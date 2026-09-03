PRAGMA foreign_keys = ON;

-- The Sep 2 events were imported as planned before they happened. The previous
-- implementation had no scheduled process that promoted them to completed
-- lessons, so reconcile them once during deployment. All inserts are idempotent.

UPDATE tutoring_calendar_events
   SET status = 'completed',
       last_synced_at = CURRENT_TIMESTAMP
 WHERE google_event_id IN (
   '0uon2ms175g3mbjat55jbatr9g_20260902T140000Z',
   '63qubsrgpd8rvh8vvqac8dkca5'
 );

INSERT OR IGNORE INTO tutoring_lessons (
  id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at,
  duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method,
  source, note
)
SELECT
  'L-GCAL-0uon2ms175g3mbjat55jbatr9g_20260902T140000Z-vojta',
  e.google_event_id,
  s.id,
  s.display_name,
  '2026-09-02',
  e.starts_at,
  e.ends_at,
  e.duration_minutes,
  s.hourly_rate,
  CAST(ROUND(e.duration_minutes * s.hourly_rate / 60.0) AS INTEGER),
  'paid',
  '2026-09-02',
  'Převod',
  'google_calendar',
  'Doplněno při opravě automatické synchronizace.'
FROM tutoring_calendar_events AS e
JOIN tutoring_students AS s ON s.id = 'vojta'
WHERE e.google_event_id = '0uon2ms175g3mbjat55jbatr9g_20260902T140000Z';

INSERT OR IGNORE INTO tutoring_lessons (
  id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at,
  duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method,
  source, note
)
SELECT
  'L-GCAL-63qubsrgpd8rvh8vvqac8dkca5-anicka',
  e.google_event_id,
  s.id,
  s.display_name,
  '2026-09-02',
  e.starts_at,
  e.ends_at,
  e.duration_minutes,
  s.hourly_rate,
  CAST(ROUND(e.duration_minutes * s.hourly_rate / 60.0) AS INTEGER),
  'paid',
  '2026-09-02',
  'Převod',
  'google_calendar',
  'Doplněno při opravě automatické synchronizace.'
FROM tutoring_calendar_events AS e
JOIN tutoring_students AS s ON s.id = 'anicka'
WHERE e.google_event_id = '63qubsrgpd8rvh8vvqac8dkca5';

INSERT OR IGNORE INTO tutoring_income (
  id, lesson_id, received_on, payer_label, amount, payment_method, description
)
SELECT
  'P-GCAL-0uon2ms175g3mbjat55jbatr9g_20260902T140000Z-vojta',
  l.id,
  l.lesson_date,
  l.student_label,
  l.amount,
  'Převod',
  'Doučování – automatická úhrada po lekci'
FROM tutoring_lessons AS l
WHERE l.google_event_id = '0uon2ms175g3mbjat55jbatr9g_20260902T140000Z'
  AND l.student_id = 'vojta';

INSERT OR IGNORE INTO tutoring_income (
  id, lesson_id, received_on, payer_label, amount, payment_method, description
)
SELECT
  'P-GCAL-63qubsrgpd8rvh8vvqac8dkca5-anicka',
  l.id,
  l.lesson_date,
  l.student_label,
  l.amount,
  'Převod',
  'Doučování – automatická úhrada po lekci'
FROM tutoring_lessons AS l
WHERE l.google_event_id = '63qubsrgpd8rvh8vvqac8dkca5'
  AND l.student_id = 'anicka';

INSERT INTO tutoring_sync_state (
  id, last_synced_at, completed_events, planned_events, source, note
)
VALUES (
  1,
  CURRENT_TIMESTAMP,
  (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
  (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
  'google_calendar',
  'Doplněny lekce z 2. 9.; automatické uzavírání běží přes Cloudflare Cron.'
)
ON CONFLICT(id) DO UPDATE SET
  last_synced_at = excluded.last_synced_at,
  completed_events = excluded.completed_events,
  planned_events = excluded.planned_events,
  source = excluded.source,
  note = excluded.note;
