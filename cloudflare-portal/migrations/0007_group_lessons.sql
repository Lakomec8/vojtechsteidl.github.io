PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS tutoring_calendar_event_students (
  google_event_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (google_event_id, student_id),
  FOREIGN KEY (google_event_id) REFERENCES tutoring_calendar_events(google_event_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES tutoring_students(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id)
SELECT google_event_id, student_id
  FROM tutoring_calendar_events;

CREATE INDEX IF NOT EXISTS idx_tutoring_event_students_student
ON tutoring_calendar_event_students(student_id, google_event_id);

INSERT OR IGNORE INTO tutoring_students (id, display_name, hourly_rate, active, accent) VALUES
  ('adam', 'Adam', 300, 1, 'blue'),
  ('krystof', 'Kryštof', 300, 1, 'violet');

INSERT OR IGNORE INTO tutoring_calendar_events
  (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at) VALUES
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260907T140000Z','adam','Adam a Kryštof','2026-09-07T16:00:00+02:00','2026-09-07T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MDdUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260914T140000Z','adam','Adam a Kryštof','2026-09-14T16:00:00+02:00','2026-09-14T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MTRUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260921T140000Z','adam','Adam a Kryštof','2026-09-21T16:00:00+02:00','2026-09-21T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MjFUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260928T140000Z','adam','Adam a Kryštof','2026-09-28T16:00:00+02:00','2026-09-28T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MjhUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261005T140000Z','adam','Adam a Kryštof','2026-10-05T16:00:00+02:00','2026-10-05T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjEwMDVUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261012T140000Z','adam','Adam a Kryštof','2026-10-12T16:00:00+02:00','2026-10-12T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjEwMTJUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261019T140000Z','adam','Adam a Kryštof','2026-10-19T16:00:00+02:00','2026-10-19T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjEwMTlUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261026T150000Z','adam','Adam a Kryštof','2026-10-26T16:00:00+01:00','2026-10-26T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjEwMjZUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id)
SELECT e.google_event_id, s.id
  FROM tutoring_calendar_events AS e
  CROSS JOIN tutoring_students AS s
 WHERE e.summary = 'Adam a Kryštof'
   AND s.id IN ('adam', 'krystof');

CREATE TABLE tutoring_lessons_group_ready (
  id TEXT PRIMARY KEY,
  google_event_id TEXT,
  student_id TEXT,
  student_label TEXT NOT NULL,
  lesson_date TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate > 0),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'cancelled')),
  paid_at TEXT,
  payment_method TEXT,
  source TEXT NOT NULL CHECK (source IN ('historical_baseline', 'google_calendar', 'manual')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES tutoring_students(id),
  FOREIGN KEY (google_event_id) REFERENCES tutoring_calendar_events(google_event_id),
  UNIQUE (google_event_id, student_id)
);

CREATE TABLE tutoring_income_group_ready_backup AS
SELECT id, lesson_id, received_on, payer_label, amount, payment_method, description, created_at
  FROM tutoring_income;

INSERT INTO tutoring_lessons_group_ready (
  id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at,
  duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method,
  source, note, created_at, updated_at
)
SELECT id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at,
       duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method,
       source, note, created_at, updated_at
  FROM tutoring_lessons;

DROP TABLE tutoring_lessons;
ALTER TABLE tutoring_lessons_group_ready RENAME TO tutoring_lessons;

INSERT OR IGNORE INTO tutoring_income (
  id, lesson_id, received_on, payer_label, amount, payment_method, description, created_at
)
SELECT id, lesson_id, received_on, payer_label, amount, payment_method, description, created_at
  FROM tutoring_income_group_ready_backup;

DROP TABLE tutoring_income_group_ready_backup;

CREATE INDEX IF NOT EXISTS idx_tutoring_lessons_date
ON tutoring_lessons(lesson_date);

CREATE INDEX IF NOT EXISTS idx_tutoring_lessons_student
ON tutoring_lessons(student_id, lesson_date);

UPDATE tutoring_sync_state
   SET completed_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
       planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       note = 'Kalendář podporuje individuální i skupinové lekce.'
 WHERE id = 1;

PRAGMA foreign_keys = ON;
