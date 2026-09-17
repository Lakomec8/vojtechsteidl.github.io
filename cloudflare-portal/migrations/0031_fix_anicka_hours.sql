PRAGMA foreign_keys = ON;

-- Keep the tutoring identity aligned with the name used in Google Calendar.
-- The linked student portal profile may still use a different display label (for example Anna).
UPDATE tutoring_students
   SET display_name = 'Anička',
       updated_at = CURRENT_TIMESTAMP
 WHERE id = 'anicka';

UPDATE tutoring_lessons
   SET student_label = 'Anička',
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'anicka';

UPDATE tutoring_income
   SET payer_label = 'Anička'
 WHERE lesson_id IN (
   SELECT id FROM tutoring_lessons WHERE student_id = 'anicka'
 );

-- Remove duplicate Google-calendar lessons occupying the exact same student/time slot.
-- This handles the duplicated Anička event on 2026-09-02 without losing the lesson itself.
DELETE FROM tutoring_income
 WHERE lesson_id IN (
   SELECT later.id
     FROM tutoring_lessons AS later
     JOIN tutoring_lessons AS earlier
       ON earlier.student_id = later.student_id
      AND earlier.starts_at = later.starts_at
      AND earlier.ends_at = later.ends_at
      AND earlier.source = 'google_calendar'
      AND later.source = 'google_calendar'
      AND earlier.id < later.id
    WHERE later.student_id IS NOT NULL
      AND later.starts_at IS NOT NULL
      AND later.ends_at IS NOT NULL
 );

DELETE FROM tutoring_lessons
 WHERE id IN (
   SELECT later.id
     FROM tutoring_lessons AS later
     JOIN tutoring_lessons AS earlier
       ON earlier.student_id = later.student_id
      AND earlier.starts_at = later.starts_at
      AND earlier.ends_at = later.ends_at
      AND earlier.source = 'google_calendar'
      AND later.source = 'google_calendar'
      AND earlier.id < later.id
    WHERE later.student_id IS NOT NULL
      AND later.starts_at IS NOT NULL
      AND later.ends_at IS NOT NULL
 );

-- Prevent a duplicated Calendar event from ever counting the same lesson twice again.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tutoring_lessons_google_student_slot
ON tutoring_lessons(student_id, starts_at, ends_at)
WHERE source = 'google_calendar'
  AND student_id IS NOT NULL
  AND starts_at IS NOT NULL
  AND ends_at IS NOT NULL;

-- Verified Anička occurrences from the connected Google Calendar through 2026-09-16.
INSERT INTO tutoring_calendar_events
  (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at)
VALUES
  ('33ueo9id4khrci7g8icc2l4o1p_20260819T150000Z','anicka','Anička','2026-08-19T15:00:00.000Z','2026-08-19T16:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA4MTlUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('33ueo9id4khrci7g8icc2l4o1p_20260826T150000Z','anicka','Anička','2026-08-26T15:00:00.000Z','2026-08-26T16:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA4MjZUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('7cfq9d03sgocrhiaf3go8pnqed','anicka','Anička doučko','2026-08-28T07:00:00.000Z','2026-08-28T08:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=N2NmcTlkMDNzZ29jcmhpYWYzZ284cG5xZWQgZG9ubnl0b3JyaWVtQG0&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('33ueo9id4khrci7g8icc2l4o1p_20260902T150000Z','anicka','Anička','2026-09-02T15:00:00.000Z','2026-09-02T16:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MDJUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z','anicka','Anička','2026-09-09T15:00:00.000Z','2026-09-09T16:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MDlUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z','anicka','Anička','2026-09-16T15:00:00.000Z','2026-09-16T16:00:00.000Z',60,'completed','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MTZUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP)
ON CONFLICT(google_event_id) DO UPDATE SET
  student_id = excluded.student_id,
  summary = excluded.summary,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  duration_minutes = excluded.duration_minutes,
  status = 'completed',
  calendar_url = excluded.calendar_url,
  last_synced_at = excluded.last_synced_at;

INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id) VALUES
  ('33ueo9id4khrci7g8icc2l4o1p_20260819T150000Z','anicka'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260826T150000Z','anicka'),
  ('7cfq9d03sgocrhiaf3go8pnqed','anicka'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260902T150000Z','anicka'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z','anicka'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z','anicka');

-- Backfill one paid lesson per verified time slot. The partial unique index above
-- ensures an overlapping duplicate Calendar event cannot create a second hour.
INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-33ueo9id4khrci7g8icc2l4o1p_20260819T150000Z-anicka',
       '33ueo9id4khrci7g8icc2l4o1p_20260819T150000Z', id, display_name, '2026-08-19',
       '2026-08-19T15:00:00.000Z','2026-08-19T16:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-08-19','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-33ueo9id4khrci7g8icc2l4o1p_20260826T150000Z-anicka',
       '33ueo9id4khrci7g8icc2l4o1p_20260826T150000Z', id, display_name, '2026-08-26',
       '2026-08-26T15:00:00.000Z','2026-08-26T16:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-08-26','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-7cfq9d03sgocrhiaf3go8pnqed-anicka',
       '7cfq9d03sgocrhiaf3go8pnqed', id, display_name, '2026-08-28',
       '2026-08-28T07:00:00.000Z','2026-08-28T08:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-08-28','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-33ueo9id4khrci7g8icc2l4o1p_20260902T150000Z-anicka',
       '33ueo9id4khrci7g8icc2l4o1p_20260902T150000Z', id, display_name, '2026-09-02',
       '2026-09-02T15:00:00.000Z','2026-09-02T16:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-09-02','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z-anicka',
       '33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z', id, display_name, '2026-09-09',
       '2026-09-09T15:00:00.000Z','2026-09-09T16:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-09-09','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note)
SELECT 'L-GCAL-33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z-anicka',
       '33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z', id, display_name, '2026-09-16',
       '2026-09-16T15:00:00.000Z','2026-09-16T16:00:00.000Z',60,hourly_rate,hourly_rate,'paid','2026-09-16','Převod','google_calendar','Backfill z ověřeného Google Calendaru.'
  FROM tutoring_students WHERE id = 'anicka';

-- Rebuild corresponding income rows only for lessons that actually exist after de-duplication.
INSERT OR IGNORE INTO tutoring_income (id, lesson_id, received_on, payer_label, amount, payment_method, description)
SELECT 'P-' || l.id, l.id, l.lesson_date, l.student_label, l.amount, 'Převod', 'Doučování – backfill z Google Calendaru'
  FROM tutoring_lessons AS l
 WHERE l.student_id = 'anicka'
   AND l.source = 'google_calendar'
   AND l.lesson_date IN ('2026-08-19','2026-08-26','2026-08-28','2026-09-02','2026-09-09','2026-09-16');

UPDATE tutoring_sync_state
   SET completed_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
       planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       last_synced_at = CURRENT_TIMESTAMP,
       note = 'Anička: opravené párování názvu a doplněné historické lekce z Google Calendaru.'
 WHERE id = 1;
