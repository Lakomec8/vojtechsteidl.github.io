import tutoringWorker from "./tutoring-os";

type WorkerRequest = Parameters<typeof tutoringWorker.fetch>[0];

type PlannedEvent = {
  google_event_id: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
};

type TutoringStudent = {
  id: string;
  display_name: string;
  hourly_rate: number;
};

function safeEventId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 150);
}

function isoDateInPrague(value: string): string {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}

async function participantsForEvent(env: Env, eventId: string): Promise<TutoringStudent[]> {
  const result = await env.DB.prepare(`
    SELECT s.id, s.display_name, s.hourly_rate
      FROM tutoring_students AS s
      JOIN (
        SELECT student_id
          FROM tutoring_calendar_event_students
         WHERE google_event_id = ?1
        UNION
        SELECT student_id
          FROM tutoring_calendar_events
         WHERE google_event_id = ?1
      ) AS participants
        ON participants.student_id = s.id
     WHERE s.active = 1
  `).bind(eventId).all<TutoringStudent>();
  return result.results || [];
}

export async function settleCompletedTutoringEvents(env: Env): Promise<number> {
  const now = new Date();
  const syncedAt = now.toISOString();
  const planned = await env.DB.prepare(`
    SELECT google_event_id, starts_at, ends_at, duration_minutes
      FROM tutoring_calendar_events
     WHERE status = 'planned'
     ORDER BY ends_at
  `).all<PlannedEvent>();

  let insertedLessons = 0;

  for (const event of planned.results || []) {
    const end = new Date(event.ends_at);
    if (Number.isNaN(end.getTime()) || end > now) continue;

    const students = await participantsForEvent(env, event.google_event_id);
    if (!students.length) {
      console.error(JSON.stringify({
        event: "tutoring_settlement_missing_participant",
        google_event_id: event.google_event_id,
      }));
      continue;
    }

    const lessonDate = isoDateInPrague(event.starts_at);
    for (const student of students) {
      const amount = Math.round((Number(event.duration_minutes) / 60) * Number(student.hourly_rate));
      const suffix = `${safeEventId(event.google_event_id)}-${student.id}`;
      const lessonId = `L-GCAL-${suffix}`;
      const incomeId = `P-GCAL-${suffix}`;

      const [lessonResult] = await env.DB.batch([
        env.DB.prepare(`INSERT OR IGNORE INTO tutoring_lessons
          (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at,
           duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                  'paid', ?5, 'Převod', 'google_calendar', 'Automaticky vytvořeno Cloudflare Cronem po skončení události.')`)
          .bind(
            lessonId,
            event.google_event_id,
            student.id,
            student.display_name,
            lessonDate,
            event.starts_at,
            event.ends_at,
            event.duration_minutes,
            student.hourly_rate,
            amount,
          ),
        env.DB.prepare(`INSERT OR IGNORE INTO tutoring_income
          (id, lesson_id, received_on, payer_label, amount, payment_method, description)
          SELECT ?1, lesson.id, lesson.lesson_date, lesson.student_label, lesson.amount,
                 'Převod', 'Doučování – automatická úhrada po lekci'
            FROM tutoring_lessons AS lesson
           WHERE lesson.google_event_id = ?2
             AND lesson.student_id = ?3`)
          .bind(incomeId, event.google_event_id, student.id),
      ]);
      insertedLessons += Number(lessonResult.meta.changes || 0);
    }

    await env.DB.prepare(`
      UPDATE tutoring_calendar_events
         SET status = 'completed', last_synced_at = ?2
       WHERE google_event_id = ?1
         AND status = 'planned'
    `).bind(event.google_event_id, syncedAt).run();
  }

  const counts = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_events,
      SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned_events
      FROM tutoring_calendar_events
  `).first<{ completed_events: number | null; planned_events: number | null }>();

  await env.DB.prepare(`INSERT INTO tutoring_sync_state
    (id, last_synced_at, completed_events, planned_events, source, note)
    VALUES (1, ?1, ?2, ?3, 'google_calendar', ?4)
    ON CONFLICT(id) DO UPDATE SET
      last_synced_at = excluded.last_synced_at,
      completed_events = excluded.completed_events,
      planned_events = excluded.planned_events,
      source = excluded.source,
      note = excluded.note
  `).bind(
    syncedAt,
    Number(counts?.completed_events || 0),
    Number(counts?.planned_events || 0),
    `Automatická kontrola dokončena; ${insertedLessons} nových lekcí.`,
  ).run();

  return insertedLessons;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const shouldSettleBeforeRead = request.method === "GET" && (
      url.pathname === "/student-portal/admin/tutoring/" ||
      url.pathname === "/student-portal/api/profile" ||
      (url.hostname === "portal.vojtechsteidl.eu" && url.pathname === "/api/profile")
    );
    if (shouldSettleBeforeRead) {
      try {
        await settleCompletedTutoringEvents(env);
      } catch (error) {
        console.error(JSON.stringify({
          event: "tutoring_settlement_on_load_error",
          message: error instanceof Error ? error.message : "unknown",
        }));
      }
    }
    return tutoringWorker.fetch(request as WorkerRequest, env);
  },

  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(
      settleCompletedTutoringEvents(env).catch((error) => {
        console.error(JSON.stringify({
          event: "tutoring_scheduled_settlement_error",
          message: error instanceof Error ? error.message : "unknown",
        }));
      }),
    );
  },
} satisfies ExportedHandler<Env>;
