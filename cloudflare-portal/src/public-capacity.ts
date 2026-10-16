const PUBLIC_CAPACITY_PATH = "/api/public-capacity";
const DAY_NAMES = ["","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota","Neděle"];

type SeriesRow = {
  series_id: string;
  public_label: string;
  capacity: number;
  sort_order: number;
};

type EventRow = {
  series_id: string;
  google_event_id: string;
  starts_at: string;
  ends_at: string;
  people: number;
  capacity: number;
  public_label: string;
  sort_order: number;
};

type FreeSlotRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  capacity: number;
  sort_order: number;
  display_mode: "timed" | "flexible";
};

type WeekWindow = {
  startDate: string;
  endDate: string;
  endExclusive: string;
};

function dateKey(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function pragueDate(value: Date | string): { year: number; month: number; day: number; weekday: number } | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const weekdayMap: Record<string, number> = { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7 };
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const weekday = weekdayMap[parts.find((part) => part.type === "weekday")?.value || ""];
  return year && month && day && weekday ? { year, month, day, weekday } : null;
}

export function nextWeekWindow(now = new Date()): WeekWindow {
  const today = pragueDate(now);
  if (!today) throw new Error("invalid-current-date");
  const todayMarker = Date.UTC(today.year, today.month - 1, today.day, 12);
  const daysUntilNextMonday = 8 - today.weekday;
  const nextMonday = new Date(todayMarker + daysUntilNextMonday * 86_400_000);
  const nextFriday = new Date(nextMonday.getTime() + 4 * 86_400_000);
  const followingMonday = new Date(nextMonday.getTime() + 7 * 86_400_000);
  return {
    startDate: dateKey(nextMonday.getUTCFullYear(), nextMonday.getUTCMonth() + 1, nextMonday.getUTCDate()),
    endDate: dateKey(nextFriday.getUTCFullYear(), nextFriday.getUTCMonth() + 1, nextFriday.getUTCDate()),
    endExclusive: dateKey(followingMonday.getUTCFullYear(), followingMonday.getUTCMonth() + 1, followingMonday.getUTCDate()),
  };
}

function isInWeek(value: string, week: WeekWindow): boolean {
  const local = pragueDate(value);
  if (!local) return false;
  const key = dateKey(local.year, local.month, local.day);
  return key >= week.startDate && key < week.endExclusive;
}

function pragueParts(value: string): { weekday: number; time: string } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const weekdayText = parts.find((p) => p.type === "weekday")?.value || "";
  const weekdayMap: Record<string, number> = { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7 };
  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  const weekday = weekdayMap[weekdayText];
  return weekday ? { weekday, time: `${hour}:${minute}` } : null;
}

function publicJson(body: unknown, status = 200, request?: Request): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": status >= 400 ? "no-store" : "public, max-age=60, s-maxage=120",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  const origin = request?.headers.get("Origin") || "";
  if (["https://vojtechsteidl.eu", "https://www.vojtechsteidl.eu"].includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return Response.json(body, { status, headers });
}

async function mappedEvents(env: Env): Promise<EventRow[]> {
  // Only explicit public series are shown; time is read from anonymized
  // calendar occurrences instead of student-name matching.
  const result = await env.DB.prepare(`
    SELECT m.series_id, b.calendar_event_id AS google_event_id,
           b.starts_at, b.ends_at, m.public_label, m.capacity, m.sort_order,
           COALESCE(NULLIF((
             SELECT COUNT(DISTINCT es.student_id)
               FROM tutoring_calendar_event_students AS es
              WHERE es.google_event_id = b.calendar_event_id
           ), 0), m.fallback_people) AS people
      FROM public_capacity_series AS m
      JOIN public_calendar_busy AS b
        ON b.calendar_event_id = m.series_id
        OR b.calendar_event_id LIKE m.series_id || '_%'
     WHERE m.enabled = 1
       AND datetime(b.starts_at) >= datetime('now')
       AND datetime(b.starts_at) < datetime('now', '+21 days')
     ORDER BY m.sort_order, datetime(b.starts_at)
  `).all<EventRow>();
  return result.results || [];
}

async function freeSlots(env: Env): Promise<FreeSlotRow[]> {
  const result = await env.DB.prepare(`
    SELECT id, weekday, start_time, end_time, capacity, sort_order, display_mode
      FROM public_capacity_free_slots
     WHERE enabled = 1
     ORDER BY weekday, start_time, sort_order
  `).all<FreeSlotRow>();
  return result.results || [];
}

async function allUpcomingRanges(env: Env): Promise<Array<{ starts_at: string; ends_at: string }>> {
  const result = await env.DB.prepare(`
    SELECT starts_at, ends_at
      FROM public_calendar_busy
     WHERE datetime(ends_at) > datetime('now')
       AND datetime(starts_at) < datetime('now', '+21 days')
  `).all<{ starts_at: string; ends_at: string }>();
  return result.results || [];
}

async function calendarSyncedAt(env: Env): Promise<string | null> {
  const row = await env.DB.prepare(`
    SELECT MAX(last_synced_at) AS last_synced_at
      FROM public_calendar_busy
  `).first<{ last_synced_at: string | null }>();
  return row?.last_synced_at || null;
}

function minutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function isCalendarSyncFresh(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const ageMs = now.getTime() - new Date(value).getTime();
  return Number.isFinite(ageMs) && ageMs >= -5 * 60_000 && ageMs <= 60 * 60_000;
}

function weekdayDate(week: WeekWindow, weekday: number): string {
  const date = new Date(`${week.startDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weekday - 1);
  return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Busy intervals spanning midnight are split by local Prague calendar day.
export function busyMinutesOnDay(
  event: { starts_at: string; ends_at: string },
  localDay: string,
): { start: number; end: number } | null {
  const starts = pragueDate(event.starts_at);
  const ends = pragueDate(event.ends_at);
  if (!starts || !ends) return null;
  const startDay = dateKey(starts.year, starts.month, starts.day);
  const endDay = dateKey(ends.year, ends.month, ends.day);
  if (localDay < startDay || localDay > endDay) return null;
  const startTime = pragueParts(event.starts_at);
  const endTime = pragueParts(event.ends_at);
  if (!startTime || !endTime) return null;
  const start = localDay === startDay ? minutes(startTime.time) : 0;
  const end = localDay === endDay ? minutes(endTime.time) : 24 * 60;
  return end > start ? { start, end } : null;
}

export function slotIsAvailable(
  startTime: string,
  endTime: string,
  occupied: Array<{ start: number; end: number }>,
  flexible = false,
): boolean {
  const slotStart = minutes(startTime);
  const slotEnd = minutes(endTime);
  const overlaps = occupied
    .filter((event) => slotStart < event.end && slotEnd > event.start)
    .sort((a, b) => a.start - b.start);

  if (!flexible) return overlaps.length === 0;

  const minimumLessonMinutes = 60;
  let cursor = slotStart;
  for (const event of overlaps) {
    if (Math.max(slotStart, event.start) - cursor >= minimumLessonMinutes) return true;
    cursor = Math.max(cursor, Math.min(slotEnd, event.end));
  }
  return slotEnd - cursor >= minimumLessonMinutes;
}

export async function handlePublicCapacityRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== PUBLIC_CAPACITY_PATH) return null;

  try {
    const week = nextWeekWindow();
    const [events, free, allUpcoming, syncedAt] = await Promise.all([
      mappedEvents(env),
      freeSlots(env),
      allUpcomingRanges(env),
      calendarSyncedAt(env),
    ]);
    if (!isCalendarSyncFresh(syncedAt)) {
      return publicJson({ error: "calendar_not_synced" }, 503, request);
    }
    // A series can have several lessons in one week; render each occurrence.
    const occupied = events.filter((event) => isInWeek(event.starts_at, week)).flatMap((event) => {
      const start = pragueParts(event.starts_at);
      const end = pragueParts(event.ends_at);
      if (!start || !end || start.weekday > 5) return [];
      const people = Math.max(1, Number(event.people || 0));
      return [{
        id: `series-${event.google_event_id}`,
        day: DAY_NAMES[start.weekday],
        weekday: start.weekday,
        time: `${start.time}–${end.time}`,
        title: event.public_label,
        people,
        capacity: Number(event.capacity),
        kind: people >= Number(event.capacity) ? "full" : "join",
      }];
    });

    const available = free
      .filter((slot) => {
        const day = weekdayDate(week, slot.weekday);
        const sameDayBusy = allUpcoming
          .map((event) => busyMinutesOnDay(event, day))
          .filter((range): range is { start: number; end: number } => range !== null);
        return slotIsAvailable(
          slot.start_time,
          slot.end_time,
          sameDayBusy,
          slot.display_mode === "flexible",
        );
      })
      .map((slot) => ({
        id: slot.id,
        day: DAY_NAMES[slot.weekday],
        weekday: slot.weekday,
        time: slot.display_mode === "flexible" ? "" : `${slot.start_time}–${slot.end_time}`,
        title: slot.display_mode === "flexible" ? "Volno" : "Volný slot",
        people: 0,
        capacity: Number(slot.capacity),
        kind: "free",
        flexible: slot.display_mode === "flexible",
      }));

    const slots = [...occupied, ...available].sort((a,b) =>
      a.weekday - b.weekday || a.time.localeCompare(b.time, "cs")
    );

    return publicJson({
      updatedAt: new Date().toISOString(),
      calendarSyncedAt: syncedAt,
      refreshMinutes: 15,
      week: { startDate: week.startDate, endDate: week.endDate },
      days: DAY_NAMES.slice(1,6),
      slots,
    }, 200, request);
  } catch (error) {
    console.error(JSON.stringify({
      event: "public_capacity_error",
      message: error instanceof Error ? error.message : "unknown",
    }));
    return publicJson({ error: "capacity_unavailable" }, 503, request);
  }
}
