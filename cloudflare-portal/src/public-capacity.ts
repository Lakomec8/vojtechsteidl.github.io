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
};

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

function publicJson(body: unknown, status = 200): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": "https://vojtechsteidl.eu",
  });
  return Response.json(body, { status, headers });
}

async function mappedEvents(env: Env): Promise<EventRow[]> {
  const result = await env.DB.prepare(`
    WITH ranked AS (
      SELECT
        m.series_id,
        e.google_event_id,
        e.starts_at,
        e.ends_at,
        m.public_label,
        m.capacity,
        m.sort_order,
        COALESCE((
          SELECT COUNT(DISTINCT es.student_id)
            FROM tutoring_calendar_event_students AS es
           WHERE es.google_event_id = e.google_event_id
        ), 0) AS people,
        ROW_NUMBER() OVER (
          PARTITION BY m.series_id
          ORDER BY datetime(e.starts_at) ASC
        ) AS rn
      FROM public_capacity_series AS m
      JOIN tutoring_calendar_events AS e
        ON e.google_event_id = m.series_id
        OR e.google_event_id LIKE m.series_id || '_%'
      WHERE m.enabled = 1
        AND e.status = 'planned'
        AND datetime(e.starts_at) >= datetime('now')
        AND datetime(e.starts_at) < datetime('now', '+21 days')
    )
    SELECT series_id, google_event_id, starts_at, ends_at,
           public_label, capacity, sort_order, people
      FROM ranked
     WHERE rn = 1
     ORDER BY sort_order, datetime(starts_at)
  `).all<EventRow>();
  return result.results || [];
}

async function freeSlots(env: Env): Promise<FreeSlotRow[]> {
  const result = await env.DB.prepare(`
    SELECT id, weekday, start_time, end_time, capacity, sort_order
      FROM public_capacity_free_slots
     WHERE enabled = 1
     ORDER BY weekday, start_time, sort_order
  `).all<FreeSlotRow>();
  return result.results || [];
}

export async function handlePublicCapacityRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== PUBLIC_CAPACITY_PATH) return null;

  try {
    const [events, free] = await Promise.all([mappedEvents(env), freeSlots(env)]);
    const occupied = events.flatMap((event) => {
      const start = pragueParts(event.starts_at);
      const end = pragueParts(event.ends_at);
      if (!start || !end || start.weekday > 5) return [];
      const people = Math.max(1, Number(event.people || 0));
      return [{
        id: `series-${event.sort_order}`,
        day: DAY_NAMES[start.weekday],
        weekday: start.weekday,
        time: `${start.time}–${end.time}`,
        title: event.public_label,
        people,
        capacity: Number(event.capacity),
        kind: people >= Number(event.capacity) ? "full" : "join",
      }];
    });

    const occupiedKeys = new Set(occupied.map((slot) => `${slot.weekday}|${slot.time.split("–")[0]}`));
    const available = free
      .filter((slot) => !occupiedKeys.has(`${slot.weekday}|${slot.start_time}`))
      .map((slot) => ({
        id: slot.id,
        day: DAY_NAMES[slot.weekday],
        weekday: slot.weekday,
        time: `${slot.start_time}–${slot.end_time}`,
        title: "Volný slot",
        people: 0,
        capacity: Number(slot.capacity),
        kind: "free",
      }));

    const slots = [...occupied, ...available].sort((a,b) =>
      a.weekday - b.weekday || a.time.localeCompare(b.time, "cs")
    );

    return publicJson({
      updatedAt: new Date().toISOString(),
      refreshMinutes: 15,
      days: DAY_NAMES.slice(1,6),
      slots,
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "public_capacity_error",
      message: error instanceof Error ? error.message : "unknown",
    }));
    return publicJson({ error: "capacity_unavailable" }, 503);
  }
}
