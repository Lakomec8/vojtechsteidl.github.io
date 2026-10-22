/**
 * Resumable D1 booking outbox.
 * A database booking is the source of truth: mail/calendar integration failures
 * never discard a reserved slot. Claims avoid duplicate concurrent sends.
 */
type MailBinding = {
  send(message: { from: string; to: string; replyTo?: string; subject: string; text: string }): Promise<{ messageId: string }>;
};
type BookingEnv = Env & {
  BOOKING_EMAIL?: MailBinding;
  GOOGLE_BOOKING_WEBHOOK_URL?: string;
  GOOGLE_BOOKING_WEBHOOK_SECRET?: string;
};
type BookingDispatch = {
  id: string; confirmation_code: string; booking_type: string;
  starts_at: string; ends_at: string; name: string; email: string;
  grade: string; topic: string; note: string; status: "confirmed" | "cancelled";
  owner_create_state: string; google_create_state: string;
  owner_cancel_state: string; google_cancel_state: string;
  google_event_id: string | null;
};
type DispatchAction = "owner_create" | "google_create" | "owner_cancel" | "google_cancel";
const ACTIONS: readonly DispatchAction[] = ["owner_create","google_create","owner_cancel","google_cancel"];
const BOOKING_CONTACT = "info@vojtechsteidl.eu";
const OWNER_MAILBOX = "vojtasteidl@seznam.cz";

function pragueDateTime(iso: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague", weekday: "long", day: "numeric",
    month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
function safeLog(error: unknown): string {
  // Keep customer PII and server-side secrets out of logs and public responses.
  return error instanceof Error ? error.name.slice(0, 64) : "unknown";
}
function ownerMessage(row: BookingDispatch, action: "create" | "cancel") {
  const label = row.booking_type === "diagnostic_30" ? "Diagnostika zdarma (30 min)" : "Online lekce (60 min)";
  const heading = action === "cancel" ? "ZRUŠENÁ rezervace" : "NOVÁ rezervace";
  return {
    from: BOOKING_CONTACT,
    to: OWNER_MAILBOX,
    replyTo: row.email,
    subject: `${heading}: ${row.confirmation_code} · ${pragueDateTime(row.starts_at)}`,
    text: [
      heading, `Kód: ${row.confirmation_code}`, `Typ: ${label}`,
      `Termín: ${pragueDateTime(row.starts_at)} (Praha)`,
      `Jméno: ${row.name}`, `E-mail: ${row.email}`,
      `Ročník: ${row.grade}`, `Téma: ${row.topic}`,
      `Poznámka: ${row.note || "—"}`,
      "", "Interní přehled rezervací: https://vojtechsteidl.eu/student-portal/admin/tutoring/",
    ].join("\n"),
  };
}
async function claimAction(env: BookingEnv, id: string, action: DispatchAction): Promise<boolean> {
  if (!ACTIONS.includes(action)) return false;
  const claimedAt = action + "_attempted_at";
  const state = action + "_state";
  const result = await env.DB.prepare(`UPDATE public_booking_dispatch
    SET ${state} = 'sending', ${claimedAt} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = ?1 AND (${state} IN ('pending','retry')
      OR (${state} = 'sending' AND ${claimedAt} < datetime('now','-10 minutes')))`).bind(id).run();
  return Number(result.meta.changes || 0) === 1;
}
async function concludeAction(env: BookingEnv, id: string, action: DispatchAction, ok: boolean, eventId?: string): Promise<void> {
  const state = action + "_state";
  // The claim is still scoped to this action. Failures remain retryable.
  await env.DB.prepare(`UPDATE public_booking_dispatch SET ${state} = ?2,
    google_event_id = COALESCE(?3, google_event_id),
    updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?1`)
    .bind(id, ok ? "sent" : "retry", eventId || null).run();
}
async function googleWebhook(env: BookingEnv, row: BookingDispatch, action: "create" | "cancel"): Promise<string | undefined> {
  const url = env.GOOGLE_BOOKING_WEBHOOK_URL;
  const secret = env.GOOGLE_BOOKING_WEBHOOK_SECRET;
  if (!url || !secret) throw new Error("booking_calendar_not_configured");
  if (!/^https:\/\/script\.google\.com\/macros\/s\//.test(url)) throw new Error("invalid_google_booking_webhook");
  const response = await fetch(url, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret, action, bookingId: row.id, code: row.confirmation_code,
      type: row.booking_type, startAt: row.starts_at, endAt: row.ends_at,
      name: row.name, email: row.email, grade: row.grade, topic: row.topic,
      note: row.note, calendarEventId: row.google_event_id,
      cancellationPolicy: "Zrušení alespoň 24 hodin předem zdarma.",
    }),
  });
  if (!response.ok) throw new Error("google_booking_webhook_http");
  const reply = await response.json() as { ok?: boolean; eventId?: string; error?: string };
  if (reply.ok !== true) throw new Error("google_booking_webhook_error");
  return typeof reply.eventId === "string" ? reply.eventId : undefined;
}
async function bookingById(env: BookingEnv, bookingId: string): Promise<BookingDispatch | null> {
  return await env.DB.prepare(`SELECT b.id,b.confirmation_code,b.booking_type,b.starts_at,b.ends_at,b.name,b.email,
       b.grade,b.topic,b.note,b.status,
       d.owner_create_state,d.google_create_state,d.owner_cancel_state,d.google_cancel_state,d.google_event_id
     FROM public_bookings b
     JOIN public_booking_dispatch d ON d.booking_id=b.id
    WHERE b.id = ?1`).bind(bookingId).first<BookingDispatch>();
}

export async function dispatchBookingIntegrations(env: BookingEnv, bookingId: string): Promise<void> {
  let row = await bookingById(env, bookingId);
  if (!row) return;
  const isActive = row.status === "confirmed";
  const actions: DispatchAction[] = isActive
    ? ["owner_create","google_create"]
    : [
        ...(row.owner_create_state === "sent" ? ["owner_cancel" as const] : []),
        ...(row.google_create_state === "sent" ? ["google_cancel" as const] : []),
      ];
  for (const action of actions) {
    const isOwner = action.startsWith("owner_");
    if (isOwner && !env.BOOKING_EMAIL) continue;
    if (!isOwner && (!env.GOOGLE_BOOKING_WEBHOOK_URL || !env.GOOGLE_BOOKING_WEBHOOK_SECRET)) continue;
    if (row[action + "_state" as keyof BookingDispatch] === "sent") continue;
    if (!await claimAction(env, bookingId, action)) continue;
    let eventId: string | undefined;
    let ok = false;
    try {
      if (isOwner) {
        await env.BOOKING_EMAIL!.send(ownerMessage(row, isActive ? "create" : "cancel"));
      } else {
        eventId = await googleWebhook(env, row, isActive ? "create" : "cancel");
      }
      ok = true;
    } catch (error) {
      console.error(JSON.stringify({ event: "booking_delivery_failed", action, errorType: safeLog(error) }));
    }
    await concludeAction(env, bookingId, action, ok, eventId);
    row = await bookingById(env, bookingId) || row;
  }
}

export async function dispatchPendingBookingIntegrations(env: BookingEnv, batchSize = 8): Promise<void> {
  const result = await env.DB.prepare(`SELECT b.id FROM public_bookings b
    JOIN public_booking_dispatch d ON d.booking_id=b.id
    WHERE (b.status='confirmed' AND
       (d.owner_create_state != 'sent' OR d.google_create_state != 'sent'))
       OR (b.status='cancelled' AND
       ((d.owner_create_state='sent' AND d.owner_cancel_state != 'sent')
        OR (d.google_create_state='sent' AND d.google_cancel_state != 'sent')))
    ORDER BY b.created_at ASC LIMIT ?1`).bind(Math.max(1, Math.min(30, batchSize))).all<{id:string}>();
  for (const booking of result.results || []) {
    try { await dispatchBookingIntegrations(env, booking.id); }
    catch (error) { console.error(JSON.stringify({ event: "booking_dispatch_error", errorType: safeLog(error) })); }
  }
}
