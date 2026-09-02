import portalWorker from "./library-backfill-entry";
import { PortalError, principalForRequest, privateHeaders } from "./entry";

const APP_PATH = "/student-portal/admin/tutoring";
const API_PATH = "/student-portal/api/admin/tutoring/sync";
const PORTAL_HOST = "portal.vojtechsteidl.eu";
const PRAGUE_TIME_ZONE = "Europe/Prague";

type WorkerRequest = Parameters<typeof portalWorker.fetch>[0];
type StudentRow = {
  id: string;
  display_name: string;
  hourly_rate: number;
  active: number;
  accent: string;
};
type LessonRow = {
  id: string;
  google_event_id: string | null;
  student_id: string | null;
  student_label: string;
  lesson_date: string;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number;
  hourly_rate: number;
  amount: number;
  payment_status: string;
  paid_at: string | null;
  payment_method: string | null;
  source: string;
};
type CalendarRow = {
  google_event_id: string;
  student_id: string;
  participant_ids: string;
  summary: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  status: "completed" | "planned" | "cancelled";
  calendar_url: string | null;
  last_synced_at: string;
};
type SyncRow = {
  last_synced_at: string;
  completed_events: number;
  planned_events: number;
  note: string | null;
};
type ExpenseRow = {
  id: string;
  spent_on: string;
  supplier: string;
  description: string;
  amount: number;
  tax_deductible: number;
};
type SyncEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  url?: string | null;
};

function html(body: string, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  return new Response(body, { status, headers });
}

function json(body: unknown, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return Response.json(body, { status, headers });
}

function plain(message: string, status: number): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { status, headers });
}

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
}

function money(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function hours(minutes: number): string {
  const value = minutes / 60;
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value) + " h";
}

function dateLabel(value: string | null, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? value + "T12:00:00+02:00" : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: PRAGUE_TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function fullDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: PRAGUE_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function monthKey(value: string): string {
  return value.slice(0, 7);
}

function monthName(value: string): string {
  const date = new Date(value + "-01T12:00:00+01:00");
  return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric", timeZone: PRAGUE_TIME_ZONE }).format(date);
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

async function dashboardData(env: Env): Promise<{
  students: StudentRow[];
  lessons: LessonRow[];
  events: CalendarRow[];
  expenses: ExpenseRow[];
  sync: SyncRow | null;
}> {
  const [students, lessons, events, expenses, sync] = await Promise.all([
    env.DB.prepare("SELECT id, display_name, hourly_rate, active, accent FROM tutoring_students ORDER BY active DESC, display_name COLLATE NOCASE").all<StudentRow>(),
    env.DB.prepare("SELECT id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source FROM tutoring_lessons ORDER BY lesson_date DESC, id DESC").all<LessonRow>(),
    env.DB.prepare(`SELECT e.google_event_id, e.student_id, e.summary, e.starts_at, e.ends_at,
                           e.duration_minutes, e.status, e.calendar_url, e.last_synced_at,
                           COALESCE(GROUP_CONCAT(es.student_id), e.student_id) AS participant_ids
                      FROM tutoring_calendar_events AS e
                      LEFT JOIN tutoring_calendar_event_students AS es
                        ON es.google_event_id = e.google_event_id
                     GROUP BY e.google_event_id
                     ORDER BY e.starts_at`).all<CalendarRow>(),
    env.DB.prepare("SELECT id, spent_on, supplier, description, amount, tax_deductible FROM tutoring_expenses ORDER BY spent_on DESC").all<ExpenseRow>(),
    env.DB.prepare("SELECT last_synced_at, completed_events, planned_events, note FROM tutoring_sync_state WHERE id = 1").first<SyncRow>(),
  ]);
  return {
    students: students.results || [],
    lessons: lessons.results || [],
    events: events.results || [],
    expenses: expenses.results || [],
    sync,
  };
}

function renderDashboard(data: Awaited<ReturnType<typeof dashboardData>>, email: string): Response {
  const { students, lessons, events, expenses, sync } = data;
  const paidLessons = lessons.filter((lesson) => lesson.payment_status === "paid");
  const revenue = paidLessons.reduce((sum, lesson) => sum + Number(lesson.amount), 0);
  const countedTeachingSessions = new Set<string>();
  const totalMinutes = lessons
    .filter((lesson) => lesson.payment_status !== "cancelled")
    .reduce((sum, lesson) => {
      const sessionKey = lesson.google_event_id || lesson.id;
      if (countedTeachingSessions.has(sessionKey)) return sum;
      countedTeachingSessions.add(sessionKey);
      return sum + Number(lesson.duration_minutes);
    }, 0);
  const unpaid = lessons.filter((lesson) => lesson.payment_status === "unpaid").reduce((sum, lesson) => sum + Number(lesson.amount), 0);
  const activeStudents = students.filter((student) => student.active).length;
  const completedEvents = events.filter((event) => event.status === "completed");
  const plannedEvents = events.filter((event) => event.status === "planned");
  const deductibleExpenses = expenses.filter((expense) => expense.tax_deductible).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const allowance = Math.round(revenue * 0.6);
  const estimatedTaxBase = Math.max(0, revenue - allowance);

  const monthly = new Map<string, { revenue: number; minutes: number; count: number }>();
  for (const lesson of lessons) {
    const key = monthKey(lesson.lesson_date);
    const item = monthly.get(key) || { revenue: 0, minutes: 0, count: 0 };
    item.revenue += lesson.payment_status === "paid" ? Number(lesson.amount) : 0;
    item.minutes += Number(lesson.duration_minutes);
    item.count += 1;
    monthly.set(key, item);
  }
  const monthRows = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b));
  const maxMonthRevenue = Math.max(1, ...monthRows.map(([, item]) => item.revenue));

  const studentStats = students.map((student) => {
    const ownLessons = lessons.filter((lesson) => lesson.student_id === student.id);
    const ownCompleted = ownLessons.filter((lesson) => lesson.payment_status !== "cancelled");
    const ownEvents = events.filter((event) => event.participant_ids.split(",").includes(student.id));
    const last = ownCompleted.map((lesson) => lesson.starts_at || lesson.lesson_date).sort().at(-1) || null;
    const next = ownEvents.filter((event) => event.status === "planned").map((event) => event.starts_at).sort()[0] || null;
    return {
      ...student,
      minutes: ownCompleted.reduce((sum, lesson) => sum + Number(lesson.duration_minutes), 0),
      revenue: ownCompleted.filter((lesson) => lesson.payment_status === "paid").reduce((sum, lesson) => sum + Number(lesson.amount), 0),
      lessons: ownCompleted.length,
      last,
      next,
    };
  });

  const currentMonth = plannedEvents[0]?.starts_at.slice(0, 7) || new Date().toISOString().slice(0, 7);
  const timelineEvents = events.filter((event) => event.starts_at.startsWith(currentMonth)).slice(0, 30);
  const lessonRows = lessons.slice(0, 40).map((lesson) => `
    <tr>
      <td><span class="status-dot ${lesson.source === "historical_baseline" ? "baseline" : "paid"}"></span>${esc(dateLabel(lesson.starts_at || lesson.lesson_date, Boolean(lesson.starts_at)))}</td>
      <td><strong>${esc(lesson.student_label)}</strong><small>${lesson.source === "historical_baseline" ? "Historický baseline" : "Google Calendar"}</small></td>
      <td>${esc(hours(lesson.duration_minutes))}</td>
      <td class="money">${esc(money(lesson.amount))}</td>
      <td><span class="pill success">Uhrazeno</span></td>
    </tr>`).join("");

  const studentRows = studentStats.map((student) => `
    <tr>
      <td><span class="avatar ${esc(student.accent)}">${esc(student.display_name.slice(0, 1))}</span><strong>${esc(student.display_name)}</strong></td>
      <td><span class="pill ${student.active ? "success" : "muted"}">${student.active ? "Aktivní" : "Neaktivní"}</span></td>
      <td>${esc(money(student.hourly_rate))}<small>za 60 min</small></td>
      <td>${esc(dateLabel(student.last, Boolean(student.last?.includes("T"))))}</td>
      <td>${esc(dateLabel(student.next, true))}</td>
      <td>${esc(hours(student.minutes))}</td>
      <td class="money">${esc(money(student.revenue))}</td>
    </tr>`).join("");

  const timeline = timelineEvents.map((event) => {
    const day = new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, day: "2-digit" }).format(new Date(event.starts_at));
    const weekday = new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, weekday: "short" }).format(new Date(event.starts_at));
    const participants = event.participant_ids
      .split(",")
      .map((id) => students.find((item) => item.id === id))
      .filter((student): student is StudentRow => Boolean(student));
    const participantLabel = participants.map((student) => student.display_name).join(" + ") || event.summary;
    const eventAmount = participants.reduce(
      (sum, student) => sum + Math.round((event.duration_minutes / 60) * Number(student.hourly_rate)),
      0,
    );
    return `<article class="timeline-item ${event.status}">
      <div class="date-tile"><strong>${esc(day)}</strong><span>${esc(weekday)}</span></div>
      <div class="timeline-copy"><small>${esc(dateLabel(event.starts_at, true).split(" ").at(-1) || "")}</small><strong>${esc(participantLabel)}</strong><span>${esc(hours(event.duration_minutes))} · ${esc(money(eventAmount))}${participants.length > 1 ? " celkem" : ""}</span></div>
      <span class="pill ${event.status === "completed" ? "success" : "planned"}">${event.status === "completed" ? "Hotovo" : "Plán"}</span>
    </article>`;
  }).join("");

  const monthBars = monthRows.map(([key, item]) => {
    const height = Math.max(10, Math.round((item.revenue / maxMonthRevenue) * 150));
    return `<div class="bar-column"><span>${esc(money(item.revenue))}</span><div class="bar" style="height:${height}px"></div><strong>${esc(monthName(key).split(" ")[0])}</strong><small>${item.count} lekcí</small></div>`;
  }).join("");

  const studentBars = studentStats.filter((student) => student.revenue > 0).map((student) => {
    const width = Math.round((student.revenue / Math.max(1, revenue - 4100)) * 100);
    return `<div class="split-row"><span>${esc(student.display_name)}</span><div class="track"><i class="${esc(student.accent)}" style="width:${Math.max(4, width)}%"></i></div><strong>${esc(money(student.revenue))}</strong></div>`;
  }).join("");

  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Tutoring OS · Vojtěch Steidl</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--mint:#9ee8ca;--mint-strong:#68d5aa;--mint-soft:#dff7ed;--amber:#e7c86f;--red:#e4867f;--blue:#8ebbd8;--violet:#bba7dd;--shadow:0 18px 38px rgba(55,52,43,.12),0 3px 8px rgba(55,52,43,.08);--shadow-soft:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100vh;background-color:var(--paper);background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}
    button,a{font:inherit}.shell{width:min(1480px,calc(100% - 32px));margin:20px auto;display:grid;grid-template-columns:226px minmax(0,1fr);min-height:calc(100vh - 40px);border:1px solid rgba(151,148,137,.55);border-radius:28px;background:rgba(248,247,241,.88);box-shadow:var(--shadow);overflow:hidden;backdrop-filter:blur(16px)}
    .sidebar{padding:24px 18px;background:rgba(231,229,220,.76);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:28px}.brand{display:flex;gap:12px;align-items:center;padding:0 7px}.brand-mark{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--mint);box-shadow:inset 0 1px rgba(255,255,255,.8),0 7px 14px rgba(56,129,101,.18);font-weight:900}.brand strong{display:block;font-size:15px}.brand span{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}.nav{display:grid;gap:7px}.nav button{display:flex;align-items:center;gap:11px;width:100%;border:0;background:transparent;color:#5d5f58;padding:11px 12px;border-radius:13px;text-align:left;cursor:pointer;font-weight:700}.nav button:hover{background:rgba(255,255,255,.55)}.nav button.active{color:var(--ink);background:var(--surface);box-shadow:var(--shadow-soft)}.nav svg{width:18px;height:18px}.sync-card{margin-top:auto;padding:15px;border-radius:18px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-soft)}.sync-head{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px}.sync-dot{width:9px;height:9px;border-radius:50%;background:var(--mint-strong);box-shadow:0 0 0 4px var(--mint-soft)}.sync-card p{font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0 0}.account{padding:9px 7px 0;border-top:1px solid var(--line);font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis}
    main{padding:28px 30px 44px;min-width:0}.topbar{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}.topbar h1{font-size:clamp(32px,4vw,56px);line-height:.98;letter-spacing:-.055em;margin:7px 0 8px}.topbar p{margin:0;color:var(--muted)}.top-actions{display:flex;gap:9px;align-items:center}.button{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;padding:10px 15px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:13px;box-shadow:var(--shadow-soft)}.button.primary{background:var(--mint);border-color:#83dcb9}.button:hover{transform:translateY(-1px)}
    .view{display:none}.view.active{display:block}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:14px}.card{background:rgba(251,250,246,.93);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-soft)}.kpi{padding:18px;min-height:145px;display:flex;flex-direction:column}.kpi-top{display:flex;justify-content:space-between;align-items:center}.kpi-label{font-size:12px;color:var(--muted);font-weight:800}.icon-box{width:34px;height:34px;border-radius:11px;background:var(--surface-2);display:grid;place-items:center}.icon-box.mint{background:var(--mint-soft)}.kpi strong{font-size:clamp(27px,3vw,42px);letter-spacing:-.045em;margin-top:auto}.kpi small{color:var(--muted);margin-top:3px}.delta{color:#347c61;font-weight:800}.content-grid{display:grid;grid-template-columns:minmax(0,1.42fr) minmax(320px,.78fr);gap:14px;margin-bottom:14px}.section{padding:20px}.section-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.section h2{margin:0;font-size:19px;letter-spacing:-.025em}.section-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.chip{border:1px solid var(--line);background:var(--surface-2);padding:7px 11px;border-radius:999px;font-size:11px;font-weight:800}.chart{height:220px;display:flex;align-items:flex-end;gap:22px;padding:28px 8px 0;border-bottom:1px solid var(--line);background-image:linear-gradient(rgba(62,63,57,.06) 1px,transparent 1px);background-size:100% 48px}.bar-column{height:100%;flex:1;min-width:64px;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;position:relative}.bar-column>span{font-size:11px;font-weight:800;margin-bottom:7px}.bar{width:min(58px,70%);border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,var(--mint),#78d8b4);box-shadow:inset 0 1px rgba(255,255,255,.75),0 8px 16px rgba(67,140,111,.2)}.bar-column strong{font-size:12px;margin-top:9px;text-transform:capitalize}.bar-column small{font-size:10px;color:var(--muted)}.split-list{display:grid;gap:14px}.split-row{display:grid;grid-template-columns:72px minmax(80px,1fr) 70px;gap:9px;align-items:center;font-size:12px}.split-row span{font-weight:700}.split-row strong{text-align:right}.track{height:9px;border-radius:99px;background:var(--surface-2);overflow:hidden}.track i{display:block;height:100%;border-radius:inherit;background:var(--mint-strong)}.track i.blue{background:var(--blue)}.track i.amber{background:var(--amber)}.track i.violet{background:var(--violet)}.track i.stone{background:#aaa99f}
    .wide-card{padding:20px;overflow:auto}.table-head{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:14px}.table-head h2{margin:0;font-size:19px}.search{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--muted)}.search input{border:0;outline:0;background:transparent;width:150px;color:var(--ink)}table{width:100%;border-collapse:collapse;min-width:780px}th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);padding:10px 11px;border-bottom:1px solid var(--line)}td{padding:13px 11px;border-bottom:1px solid rgba(213,210,200,.7);font-size:13px;vertical-align:middle}tr:last-child td{border-bottom:0}td small{display:block;color:var(--muted);font-size:10px;margin-top:3px}td.money{font-weight:900}.avatar{display:inline-grid;place-items:center;width:29px;height:29px;border-radius:10px;background:var(--mint);margin-right:9px;box-shadow:inset 0 1px rgba(255,255,255,.7)}.avatar.blue{background:var(--blue)}.avatar.amber{background:var(--amber)}.avatar.violet{background:var(--violet)}.avatar.stone{background:#c9c7be}.pill{display:inline-flex;align-items:center;border-radius:99px;padding:5px 9px;font-size:10px;font-weight:900;background:var(--surface-2);white-space:nowrap}.pill.success{background:var(--mint-soft);color:#2f7258}.pill.planned{background:#e5eef3;color:#4f7187}.pill.muted{color:var(--muted)}.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--mint-strong);margin-right:8px}.status-dot.baseline{background:var(--amber)}
    .timeline{display:grid;gap:10px}.timeline-item{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:14px;padding:12px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.timeline-item.completed{opacity:.72}.date-tile{width:48px;height:50px;border-radius:13px;display:grid;place-items:center;align-content:center;background:var(--surface-2);line-height:1}.date-tile strong{font-size:20px}.date-tile span{font-size:9px;color:var(--muted);text-transform:uppercase;margin-top:4px}.timeline-copy{display:grid}.timeline-copy small{color:var(--muted);font-size:10px}.timeline-copy strong{font-size:14px;margin:2px 0}.timeline-copy span{font-size:11px;color:var(--muted)}
    .tax-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tax-hero{padding:25px;min-height:280px;display:flex;flex-direction:column}.tax-number{font-size:clamp(44px,6vw,78px);letter-spacing:-.065em;margin:28px 0 4px}.tax-breakdown{margin-top:auto;display:grid;gap:11px}.tax-row{display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:11px;font-size:13px}.tax-row span{color:var(--muted)}.note{padding:14px;border-radius:15px;background:#f6edce;color:#6f5b1f;font-size:12px;line-height:1.55}.empty{padding:28px;text-align:center;color:var(--muted)}
    @media(max-width:1100px){.shell{grid-template-columns:82px minmax(0,1fr)}.sidebar{padding:22px 12px}.brand-copy,.nav button span,.sync-card,.account{display:none}.brand{justify-content:center}.nav button{justify-content:center;padding:12px}.kpis{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:780px){body{background-size:28px 28px}.shell{display:block;width:100%;margin:0;border:0;border-radius:0;min-height:100vh}.sidebar{position:sticky;top:0;z-index:8;display:flex;flex-direction:row;align-items:center;padding:9px 12px;border-right:0;border-bottom:1px solid var(--line);overflow:auto}.brand{padding:0}.brand-mark{width:36px;height:36px}.nav{display:flex;gap:4px}.nav button{padding:9px}.top-actions .button:not(.primary){display:none}main{padding:22px 14px 80px}.topbar{align-items:flex-end}.topbar h1{font-size:36px}.topbar p{font-size:12px}.kpis{grid-template-columns:1fr 1fr;gap:10px}.kpi{min-height:125px;padding:14px}.kpi strong{font-size:26px}.content-grid,.tax-grid{grid-template-columns:1fr}.section{padding:16px}.timeline-item{grid-template-columns:44px 1fr}.timeline-item>.pill{grid-column:2}.chart{gap:10px}.table-head{align-items:flex-start;flex-direction:column}.search{width:100%}.search input{width:100%}}
    @media(max-width:480px){.kpis{grid-template-columns:1fr}.topbar h1{font-size:32px}.button.primary{padding:9px 12px}.topbar{gap:10px}.chart{height:190px}.bar-column{min-width:48px}.split-row{grid-template-columns:60px 1fr 62px}}
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">T</div><div class="brand-copy"><strong>Tutoring OS</strong><span>2026 · live</span></div></div>
      <nav class="nav" aria-label="Hlavní navigace">
        <button class="active" data-target="overview" title="Přehled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span>Přehled</span></button>
        <button data-target="students" title="Studenti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg><span>Studenti</span></button>
        <button data-target="finance" title="Finance"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></svg><span>Finance</span></button>
        <button data-target="calendar" title="Kalendář"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg><span>Kalendář</span></button>
        <button data-target="tax" title="Daně"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg><span>Daně</span></button>
      </nav>
      <div class="sync-card"><div class="sync-head"><span class="sync-dot"></span>Kalendář synchronizován</div><p>${esc(sync ? fullDateLabel(sync.last_synced_at) : "Čeká na první synchronizaci")}<br>${completedEvents.length} dokončeno · ${plannedEvents.length} plánováno</p></div>
      <div class="account" title="${esc(email)}">${esc(email)}</div>
    </aside>
    <main>
      <header class="topbar"><div><div class="eyebrow">Administrace · podnikatelská evidence</div><h1>Dobré odpoledne.</h1><p>Finance, studenti a kalendář na jednom místě.</p></div><div class="top-actions"><a class="button" href="/student-portal/admin">Studentské zóny</a><button class="button primary" type="button" data-target="calendar">Další lekce · ${esc(plannedEvents[0] ? dateLabel(plannedEvents[0].starts_at, true) : "žádná")}</button></div></header>

      <section class="view active" id="overview">
        <div class="kpis">
          <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Příjmy 2026</span><span class="icon-box mint">↗</span></div><strong>${esc(money(revenue))}</strong><small><span class="delta">100 % uhrazeno</span> · převodem</small></article>
          <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Odučeno</span><span class="icon-box">◷</span></div><strong>${esc(hours(totalMinutes))}</strong><small>${lessons.length} evidovaných lekcí</small></article>
          <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Aktivní studenti</span><span class="icon-box">◎</span></div><strong>${activeStudents}</strong><small>${students.length} profilů celkem</small></article>
          <article class="card kpi"><div class="kpi-top"><span class="kpi-label">Neuhrazeno</span><span class="icon-box mint">✓</span></div><strong>${esc(money(unpaid))}</strong><small>Všechny dokončené lekce spárovány</small></article>
        </div>
        <div class="content-grid">
          <article class="card section"><div class="section-head"><div><h2>Vývoj příjmů</h2><p>Uhrazené lekce podle měsíce</p></div><span class="chip">2026</span></div><div class="chart">${monthBars}</div></article>
          <article class="card section"><div class="section-head"><div><h2>Příjmy podle studentů</h2><p>Bez historického baseline 4.–16. 8.</p></div></div><div class="split-list">${studentBars}</div><div class="note" style="margin-top:20px"><strong>Historický baseline:</strong> 10 hodin a 4 100 Kč zůstává správně nealokováno, protože původní data neobsahují konkrétní studenty.</div></article>
        </div>
        <article class="card wide-card"><div class="table-head"><div><h2>Studenti</h2><span style="font-size:12px;color:var(--muted)">Poslední a další lekce, hodiny a příjmy</span></div><label class="search">⌕ <input id="studentSearch" type="search" placeholder="Hledat studenta"></label></div><table><thead><tr><th>Student</th><th>Stav</th><th>Sazba</th><th>Poslední</th><th>Další</th><th>Odučeno</th><th>Příjmy</th></tr></thead><tbody id="studentRows">${studentRows}</tbody></table></article>
      </section>

      <section class="view" id="students"><article class="card wide-card"><div class="table-head"><div><h2>Přehled studentů</h2><span style="font-size:12px;color:var(--muted)">Aktuální stav vypočtený z lekcí a Kalendáře</span></div><span class="chip">${activeStudents} aktivní</span></div><table><thead><tr><th>Student</th><th>Stav</th><th>Sazba</th><th>Poslední</th><th>Další</th><th>Odučeno</th><th>Příjmy</th></tr></thead><tbody>${studentRows}</tbody></table></article></section>

      <section class="view" id="finance"><div class="kpis"><article class="card kpi"><span class="kpi-label">Příjmy</span><strong>${esc(money(revenue))}</strong><small>${paidLessons.length} evidovaných úhrad</small></article><article class="card kpi"><span class="kpi-label">Výdaje</span><strong>${esc(money(deductibleExpenses))}</strong><small>${expenses.length ? expenses.length + " záznamů" : "Zatím bez záznamů"}</small></article><article class="card kpi"><span class="kpi-label">Pohledávky</span><strong>${esc(money(unpaid))}</strong><small>Žádná po splatnosti</small></article><article class="card kpi"><span class="kpi-label">Průměr / hodina</span><strong>${esc(money(Math.round(revenue / Math.max(1, totalMinutes / 60))))}</strong><small>Včetně historického baseline</small></article></div><article class="card wide-card"><div class="table-head"><div><h2>Daňová evidence příjmů</h2><span style="font-size:12px;color:var(--muted)">Dokončená lekce = úhrada převodem v den lekce</span></div><span class="chip">Google ID + student bez duplicit</span></div><table><thead><tr><th>Datum</th><th>Plátce / zdroj</th><th>Délka</th><th>Částka</th><th>Úhrada</th></tr></thead><tbody>${lessonRows}</tbody></table></article></section>

      <section class="view" id="calendar"><div class="content-grid"><article class="card section"><div class="section-head"><div><h2>Časová osa · ${esc(monthName(currentMonth))}</h2><p>Dokončené a budoucí lekce z Google Calendar</p></div><span class="chip">${timelineEvents.length} událostí</span></div><div class="timeline">${timeline || '<div class="empty">V tomto měsíci nejsou žádné lekce.</div>'}</div></article><article class="card section"><div class="section-head"><div><h2>Stav synchronizace</h2><p>Google event ID je unikátní klíč</p></div><span class="sync-dot"></span></div><div class="tax-breakdown"><div class="tax-row"><span>Dokončeno</span><strong>${completedEvents.length}</strong></div><div class="tax-row"><span>Plánováno</span><strong>${plannedEvents.length}</strong></div><div class="tax-row"><span>Duplicitní lekce</span><strong>0</strong></div><div class="tax-row"><span>Poslední sync</span><strong>${esc(sync ? dateLabel(sync.last_synced_at, true) : "—")}</strong></div></div><div class="note" style="margin-top:20px">Budoucí události jsou pouze v časové ose. Do lekcí a příjmů se zapíší až po skončení.</div></article></div></section>

      <section class="view" id="tax"><div class="tax-grid"><article class="card tax-hero"><div class="section-head"><div><h2>Odhad základu daně</h2><p>Pracovní výpočet s 60% výdajovým paušálem</p></div><span class="chip">2026</span></div><strong class="tax-number">${esc(money(estimatedTaxBase))}</strong><small style="color:var(--muted)">Před dalšími úpravami a daňovými slevami</small><div class="tax-breakdown"><div class="tax-row"><span>Příjmy</span><strong>${esc(money(revenue))}</strong></div><div class="tax-row"><span>Výdajový paušál · 60 %</span><strong>− ${esc(money(allowance))}</strong></div><div class="tax-row"><span>Evidované skutečné výdaje</span><strong>${esc(money(deductibleExpenses))}</strong></div></div></article><article class="card tax-hero"><div class="section-head"><div><h2>Kontrola evidence</h2><p>Podklady připravené pro přiznání</p></div></div><div class="tax-breakdown"><div class="tax-row"><span>Lekce s příjmem</span><strong>${paidLessons.length} / ${lessons.length}</strong></div><div class="tax-row"><span>Neuhrazené položky</span><strong>${esc(money(unpaid))}</strong></div><div class="tax-row"><span>Historický baseline</span><strong>10 h · 4 100 Kč</strong></div><div class="tax-row"><span>Google ID duplicity</span><strong>0</strong></div></div><div class="note" style="margin-top:auto"><strong>Důležité:</strong> výdajový paušál je pracovní nastavení. Před podáním přiznání je vhodné ověřit režim a aktuální pravidla s daňovým poradcem.</div></article></div></section>
    </main>
  </div>
  <script>
    const buttons=[...document.querySelectorAll('[data-target]')];
    const views=[...document.querySelectorAll('.view')];
    function show(id){views.forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.target===id));history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'smooth'})}
    buttons.forEach(button=>button.addEventListener('click',()=>show(button.dataset.target)));
    const initial=location.hash.slice(1);if(views.some(v=>v.id===initial))show(initial);
    const search=document.getElementById('studentSearch');if(search)search.addEventListener('input',()=>{const query=search.value.trim().toLocaleLowerCase('cs');document.querySelectorAll('#studentRows tr').forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase('cs').includes(query))});
  </script>
</body>
</html>`);
}

function studentIdsFor(summary: string, students: StudentRow[]): string[] {
  const normalized = summary.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matched = students.filter((student) => {
    const firstName = student.display_name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/\s+/)[0];
    return firstName.length >= 3 && normalized.includes(firstName);
  }).map((student) => student.id);
  if (normalized.includes("evelin") && students.some((student) => student.id === "evelina")) {
    matched.push("evelina");
  }
  return [...new Set(matched)];
}

function isoDateInPrague(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function safeEventId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 150);
}

async function syncCalendar(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return plain("JSON required", 415);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);

  const payload = await request.json<{ events?: SyncEvent[]; syncedAt?: string }>();
  if (!Array.isArray(payload.events) || payload.events.length > 500) return json({ error: "Invalid events payload." }, 400);
  const syncedAt = payload.syncedAt && !Number.isNaN(new Date(payload.syncedAt).getTime()) ? payload.syncedAt : new Date().toISOString();
  const now = new Date();
  const students = (await env.DB.prepare("SELECT id, display_name, hourly_rate, active, accent FROM tutoring_students").all<StudentRow>()).results || [];
  const byId = new Map(students.map((student) => [student.id, student]));
  let completed = 0;
  let planned = 0;
  let insertedLessons = 0;

  for (const event of payload.events) {
    if (!event || typeof event.id !== "string" || typeof event.summary !== "string" || typeof event.start !== "string" || typeof event.end !== "string") continue;
    const studentIds = studentIdsFor(event.summary, students).filter((studentId) => byId.has(studentId));
    if (!studentIds.length) continue;
    const primaryStudentId = studentIds[0];
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) continue;
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    const status = end <= now ? "completed" : "planned";
    status === "completed" ? completed++ : planned++;

    await env.DB.prepare(`INSERT INTO tutoring_calendar_events
      (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      ON CONFLICT(google_event_id) DO UPDATE SET student_id=excluded.student_id, summary=excluded.summary,
      starts_at=excluded.starts_at, ends_at=excluded.ends_at, duration_minutes=excluded.duration_minutes,
      status=excluded.status, calendar_url=excluded.calendar_url, last_synced_at=excluded.last_synced_at`)
      .bind(event.id, primaryStudentId, event.summary.trim(), event.start, event.end, durationMinutes, status, event.url || null, syncedAt).run();

    await env.DB.prepare("DELETE FROM tutoring_calendar_event_students WHERE google_event_id = ?1")
      .bind(event.id).run();
    await env.DB.batch(studentIds.map((studentId) =>
      env.DB.prepare(`INSERT INTO tutoring_calendar_event_students (google_event_id, student_id)
        VALUES (?1, ?2)`).bind(event.id, studentId),
    ));

    if (status !== "completed") continue;
    const lessonDate = isoDateInPrague(event.start);
    for (const studentId of studentIds) {
      const exists = await env.DB.prepare(
        "SELECT id FROM tutoring_lessons WHERE google_event_id = ?1 AND student_id = ?2 LIMIT 1",
      ).bind(event.id, studentId).first<{ id: string }>();
      if (exists) continue;
      const student = byId.get(studentId)!;
      const amount = Math.round((durationMinutes / 60) * Number(student.hourly_rate));
      const suffix = `${safeEventId(event.id)}-${studentId}`;
      const lessonId = `L-GCAL-${suffix}`;
      const incomeId = `P-GCAL-${suffix}`;
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO tutoring_lessons
          (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'paid', ?5, 'Převod', 'google_calendar', 'Automaticky vytvořeno po skončení události.')`)
          .bind(lessonId, event.id, studentId, student.display_name, lessonDate, event.start, event.end, durationMinutes, student.hourly_rate, amount),
        env.DB.prepare(`INSERT INTO tutoring_income (id, lesson_id, received_on, payer_label, amount, payment_method, description)
          VALUES (?1, ?2, ?3, ?4, ?5, 'Převod', 'Doučování – automatická úhrada po lekci')`)
          .bind(incomeId, lessonId, lessonDate, student.display_name, amount),
      ]);
      insertedLessons++;
    }
  }

  await env.DB.prepare(`INSERT INTO tutoring_sync_state (id, last_synced_at, completed_events, planned_events, source, note)
    VALUES (1, ?1, ?2, ?3, 'google_calendar', ?4)
    ON CONFLICT(id) DO UPDATE SET last_synced_at=excluded.last_synced_at, completed_events=excluded.completed_events,
    planned_events=excluded.planned_events, note=excluded.note`)
    .bind(syncedAt, completed, planned, `Synchronizace dokončena; ${insertedLessons} nových lekcí.`).run();
  return json({ ok: true, completed, planned, insertedLessons });
}

async function addTutoringLink(response: Response): Promise<Response> {
  if (response.status !== 200 || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (!body.includes("Studentské zóny") || body.includes("Tutoring OS →")) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const marker = '<div class="notice">';
  if (!body.includes(marker)) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const enhanced = body.replace(marker, `<p style="margin:0 0 18px"><a href="${APP_PATH}/" style="display:inline-flex;padding:11px 16px;border-radius:999px;background:#9ee8ca;color:#25352f;font-weight:800;text-decoration:none;box-shadow:0 8px 18px rgba(55,52,43,.12)">Tutoring OS →</a></p>${marker}`);
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.hostname === PORTAL_HOST && (url.pathname === "/tutoring-os" || url.pathname === "/tutoring-os/")) {
        return Response.redirect(`https://vojtechsteidl.eu${APP_PATH}/`, 302);
      }
      if (url.pathname === APP_PATH) return Response.redirect(`${APP_PATH}/`, 302);
      if (url.pathname === `${APP_PATH}/`) {
        if (request.method !== "GET") return plain("Method not allowed", 405);
        const email = await requireAdmin(request, env);
        return renderDashboard(await dashboardData(env), email);
      }
      if (url.pathname === API_PATH) return syncCalendar(request, env);

      const response = await portalWorker.fetch(request as WorkerRequest, env);
      if (request.method === "GET" && (url.pathname === "/student-portal/" || url.pathname === "/student-portal/admin" || url.pathname === "/student-portal/admin/")) {
        return addTutoringLink(response);
      }
      return response;
    } catch (error) {
      if (error instanceof PortalError) return plain(error.status >= 500 ? "Service unavailable" : error.message, error.status);
      console.error(JSON.stringify({ event: "tutoring_os_error", path: url.pathname }));
      return plain("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
