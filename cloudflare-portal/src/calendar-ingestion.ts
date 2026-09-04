import ICAL from "ical.js";

type CalendarEnv = Env & {
  GOOGLE_CALENDAR_ICS_URL?: string;
};

type TutoringStudent = {
  id: string;
  display_name: string;
};

type CalendarOccurrence = {
  googleEventId: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  studentIds: string[];
};

const LOOKBACK_MS = 2 * 24 * 60 * 60 * 1000;
const LOOKAHEAD_MS = 120 * 24 * 60 * 60 * 1000;
const GOOGLE_UID_SUFFIX = "@google.com";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsName(summary: string, displayName: string): boolean {
  const normalizedSummary = ` ${normalizeText(summary)} `;
  const normalizedName = normalizeText(displayName);
  return Boolean(normalizedName) && normalizedSummary.includes(` ${normalizedName} `);
}

function compactUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleBaseEventId(uid: string): string {
  return uid.endsWith(GOOGLE_UID_SUFFIX) ? uid.slice(0, -GOOGLE_UID_SUFFIX.length) : uid;
}

function eventIdForOccurrence(event: ICAL.Event, recurrenceId?: ICAL.Time | null): string {
  const base = googleBaseEventId(event.uid);
  if (!recurrenceId) return base;
  return `${base}_${compactUtc(recurrenceId.toJSDate())}`;
}

function isCancelled(event: ICAL.Event): boolean {
  return String(event.component.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED";
}

function occurrenceFromDates(
  event: ICAL.Event,
  startsAt: Date,
  endsAt: Date,
  students: TutoringStudent[],
  recurrenceId?: ICAL.Time | null,
): CalendarOccurrence | null {
  if (isCancelled(event)) return null;
  const summary = String(event.summary || "").trim();
  const studentIds = students
    .filter((student) => containsName(summary, student.display_name))
    .map((student) => student.id)
    .sort();
  if (!studentIds.length) return null;

  const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;

  return {
    googleEventId: eventIdForOccurrence(event, recurrenceId),
    summary,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationMinutes,
    studentIds,
  };
}

function expandCalendar(ics: string, students: TutoringStudent[], rangeStart: Date, rangeEnd: Date): CalendarOccurrence[] {
  const root = new ICAL.Component(ICAL.parse(ics));

  for (const timezoneComponent of root.getAllSubcomponents("vtimezone")) {
    const timezone = new ICAL.Timezone(timezoneComponent);
    ICAL.TimezoneService.register(timezone.tzid, timezone);
  }

  const components = root.getAllSubcomponents("vevent");
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];

  for (const component of components) {
    const event = new ICAL.Event(component);
    if (event.recurrenceId) exceptions.push(event);
    else masters.set(event.uid, event);
  }

  for (const exception of exceptions) {
    const master = masters.get(exception.uid);
    if (master) master.relateException(exception);
  }

  const occurrences = new Map<string, CalendarOccurrence>();
  for (const event of masters.values()) {
    if (isCancelled(event)) continue;

    if (!event.isRecurring()) {
      const startsAt = event.startDate.toJSDate();
      const endsAt = event.endDate.toJSDate();
      if (endsAt < rangeStart || startsAt > rangeEnd) continue;
      const occurrence = occurrenceFromDates(event, startsAt, endsAt, students);
      if (occurrence) occurrences.set(occurrence.googleEventId, occurrence);
      continue;
    }

    const iterator = event.iterator();
    for (let next = iterator.next(); next; next = iterator.next()) {
      const occurrenceStart = next.toJSDate();
      if (occurrenceStart > rangeEnd) break;
      const details = event.getOccurrenceDetails(next);
      const startsAt = details.startTime.toJSDate();
      const endsAt = details.endTime.toJSDate();
      if (endsAt < rangeStart) continue;
      const occurrence = occurrenceFromDates(
        details.item,
        startsAt,
        endsAt,
        students,
        details.recurrenceId,
      );
      if (occurrence) occurrences.set(occurrence.googleEventId, occurrence);
    }
  }

  return [...occurrences.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

async function activeStudents(env: Env): Promise<TutoringStudent[]> {
  const result = await env.DB.prepare(`
    SELECT id, display_name
      FROM tutoring_students
     WHERE active = 1
     ORDER BY id
  `).all<TutoringStudent>();
  return result.results || [];
}

async function upsertOccurrence(env: Env, occurrence: CalendarOccurrence, syncedAt: string): Promise<void> {
  const primaryStudentId = occurrence.studentIds[0];
  await env.DB.prepare(`
    INSERT INTO tutoring_calendar_events
      (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'planned', NULL, ?7)
    ON CONFLICT(google_event_id) DO UPDATE SET
      student_id = excluded.student_id,
      summary = excluded.summary,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      duration_minutes = excluded.duration_minutes,
      status = CASE
        WHEN tutoring_calendar_events.status = 'completed' THEN 'completed'
        ELSE 'planned'
      END,
      last_synced_at = excluded.last_synced_at
  `).bind(
    occurrence.googleEventId,
    primaryStudentId,
    occurrence.summary,
    occurrence.startsAt,
    occurrence.endsAt,
    occurrence.durationMinutes,
    syncedAt,
  ).run();

  await env.DB.prepare(`DELETE FROM tutoring_calendar_event_students WHERE google_event_id = ?1`)
    .bind(occurrence.googleEventId)
    .run();
  for (const studentId of occurrence.studentIds) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id)
      VALUES (?1, ?2)
    `).bind(occurrence.googleEventId, studentId).run();
  }
}

export async function syncGoogleCalendarToD1(env: CalendarEnv): Promise<{ imported: number; cancelled: number; skipped: boolean }> {
  const feedUrl = String(env.GOOGLE_CALENDAR_ICS_URL || "").trim();
  if (!feedUrl) return { imported: 0, cancelled: 0, skipped: true };

  const now = new Date();
  const rangeStart = new Date(now.getTime() - LOOKBACK_MS);
  const rangeEnd = new Date(now.getTime() + LOOKAHEAD_MS);
  const syncedAt = now.toISOString();

  const response = await fetch(feedUrl, {
    headers: { Accept: "text/calendar" },
  });
  if (!response.ok) {
    throw new Error(`Google Calendar ICS fetch failed with HTTP ${response.status}`);
  }

  const [ics, students] = await Promise.all([response.text(), activeStudents(env)]);
  const occurrences = expandCalendar(ics, students, rangeStart, rangeEnd);
  const seenIds = new Set(occurrences.map((occurrence) => occurrence.googleEventId));

  for (const occurrence of occurrences) {
    await upsertOccurrence(env, occurrence, syncedAt);
  }

  const planned = await env.DB.prepare(`
    SELECT google_event_id
      FROM tutoring_calendar_events
     WHERE status = 'planned'
       AND starts_at >= ?1
       AND starts_at <= ?2
  `).bind(rangeStart.toISOString(), rangeEnd.toISOString()).all<{ google_event_id: string }>();

  let cancelled = 0;
  for (const row of planned.results || []) {
    if (seenIds.has(row.google_event_id)) continue;
    const result = await env.DB.prepare(`
      UPDATE tutoring_calendar_events
         SET status = 'cancelled', last_synced_at = ?2
       WHERE google_event_id = ?1
         AND status = 'planned'
    `).bind(row.google_event_id, syncedAt).run();
    cancelled += Number(result.meta.changes || 0);
  }

  return { imported: occurrences.length, cancelled, skipped: false };
}
