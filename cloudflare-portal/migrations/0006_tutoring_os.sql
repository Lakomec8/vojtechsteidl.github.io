PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tutoring_students (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  accent TEXT NOT NULL DEFAULT 'mint',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutoring_calendar_events (
  google_event_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'planned', 'cancelled')),
  calendar_url TEXT,
  last_synced_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES tutoring_students(id)
);

CREATE TABLE IF NOT EXISTS tutoring_lessons (
  id TEXT PRIMARY KEY,
  google_event_id TEXT UNIQUE,
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
  FOREIGN KEY (google_event_id) REFERENCES tutoring_calendar_events(google_event_id)
);

CREATE TABLE IF NOT EXISTS tutoring_income (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL UNIQUE,
  received_on TEXT NOT NULL,
  payer_label TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES tutoring_lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tutoring_expenses (
  id TEXT PRIMARY KEY,
  spent_on TEXT NOT NULL,
  supplier TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  tax_deductible INTEGER NOT NULL DEFAULT 1 CHECK (tax_deductible IN (0, 1)),
  document_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutoring_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_synced_at TEXT NOT NULL,
  completed_events INTEGER NOT NULL DEFAULT 0,
  planned_events INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'google_calendar',
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_tutoring_lessons_date ON tutoring_lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_tutoring_lessons_student ON tutoring_lessons(student_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_tutoring_events_start ON tutoring_calendar_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_tutoring_events_student ON tutoring_calendar_events(student_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_tutoring_income_date ON tutoring_income(received_on);

INSERT OR IGNORE INTO tutoring_students (id, display_name, hourly_rate, active, accent) VALUES
  ('natalie', 'Natálie', 400, 1, 'mint'),
  ('vojta', 'Vojta', 450, 1, 'blue'),
  ('petra', 'Petra', 450, 1, 'amber'),
  ('anicka', 'Anička', 450, 1, 'violet'),
  ('evelina', 'Evelína', 450, 0, 'stone');

INSERT OR IGNORE INTO tutoring_calendar_events
  (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at) VALUES
  ('6qev5qvnha736rsmr8f8sgccgf_20260818T080000Z','natalie','Natalie doučko','2026-08-18T10:00:00+02:00','2026-08-18T11:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjA4MThUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260819T140000Z','vojta','Vojta doučko','2026-08-19T16:00:00+02:00','2026-08-19T17:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA4MTlUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('0rjf6q1l8f9qbsgmejckkk5jsu','evelina','Evelin doučko final','2026-08-20T18:00:00+02:00','2026-08-20T19:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=MHJqZjZxMWw4ZjlxYnNnbWVqY2trazVqc3UgZG9ubnl0b3JyaWVtQG0&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260821T080000Z','natalie','Natalie doučko','2026-08-21T10:00:00+02:00','2026-08-21T11:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=NjUwc3A0cXNyaWE0MW8wdm1xaDc0ajViZXRfMjAyNjA4MjFUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('4bidql922u6vd6bmajcs73jbhr_20260825T110000Z','petra','Petra doučování','2026-08-25T13:00:00+02:00','2026-08-25T15:00:00+02:00',120,'completed','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjA4MjVUMTEwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260826T140000Z','vojta','Vojta doučko','2026-08-26T16:00:00+02:00','2026-08-26T17:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA4MjZUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260825T080000Z','natalie','Natalie doučko','2026-08-26T17:00:00+02:00','2026-08-26T18:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjA4MjVUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('7cfq9d03sgocrhiaf3go8pnqed','anicka','Anička doučko','2026-08-28T09:00:00+02:00','2026-08-28T10:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=N2NmcTlkMDNzZ29jcmhpYWYzZ284cG5xZWQgZG9ubnl0b3JyaWVtQG0&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260828T080000Z','natalie','Natalie doučko','2026-08-28T10:00:00+02:00','2026-08-28T11:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=NjUwc3A0cXNyaWE0MW8wdm1xaDc0ajViZXRfMjAyNjA4MjhUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260901T080000Z','natalie','Natalie doučko','2026-09-01T10:00:00+02:00','2026-09-01T11:00:00+02:00',60,'completed','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjA5MDFUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260902T140000Z','vojta','Vojta doučko','2026-09-02T16:00:00+02:00','2026-09-02T17:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA5MDJUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('63qubsrgpd8rvh8vvqac8dkca5','anicka','Anička doučko','2026-09-02T17:00:00+02:00','2026-09-02T18:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=NjNxdWJzcmdwZDhydmg4dnZxYWM4ZGtjYTUgZG9ubnl0b3JyaWVtQG0&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260904T080000Z','natalie','Natalie doučko','2026-09-04T10:00:00+02:00','2026-09-04T11:00:00+02:00',60,'planned','https://www.google.com/calendar/event?eid=NjUwc3A0cXNyaWE0MW8wdm1xaDc0ajViZXRfMjAyNjA5MDRUMDgwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague','2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260908T080000Z','natalie','Natalie doučko','2026-09-08T10:00:00+02:00','2026-09-08T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('4bidql922u6vd6bmajcs73jbhr_20260908T110000Z','petra','Petra doučování','2026-09-08T13:00:00+02:00','2026-09-08T15:00:00+02:00',120,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260909T140000Z','vojta','Vojta doučko','2026-09-09T16:00:00+02:00','2026-09-09T17:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260911T080000Z','natalie','Natalie doučko','2026-09-11T10:00:00+02:00','2026-09-11T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260915T080000Z','natalie','Natalie doučko','2026-09-15T10:00:00+02:00','2026-09-15T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('4bidql922u6vd6bmajcs73jbhr_20260915T110000Z','petra','Petra doučování','2026-09-15T13:00:00+02:00','2026-09-15T15:00:00+02:00',120,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260916T140000Z','vojta','Vojta doučko','2026-09-16T16:00:00+02:00','2026-09-16T17:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260918T080000Z','natalie','Natalie doučko','2026-09-18T10:00:00+02:00','2026-09-18T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260922T080000Z','natalie','Natalie doučko','2026-09-22T10:00:00+02:00','2026-09-22T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('4bidql922u6vd6bmajcs73jbhr_20260922T110000Z','petra','Petra doučování','2026-09-22T13:00:00+02:00','2026-09-22T15:00:00+02:00',120,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260923T140000Z','vojta','Vojta doučko','2026-09-23T16:00:00+02:00','2026-09-23T17:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('650sp4qsria41o0vmqh74j5bet_20260925T080000Z','natalie','Natalie doučko','2026-09-25T10:00:00+02:00','2026-09-25T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('6qev5qvnha736rsmr8f8sgccgf_20260929T080000Z','natalie','Natalie doučko','2026-09-29T10:00:00+02:00','2026-09-29T11:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('4bidql922u6vd6bmajcs73jbhr_20260929T110000Z','petra','Petra doučování','2026-09-29T13:00:00+02:00','2026-09-29T15:00:00+02:00',120,'planned',NULL,'2026-09-01T20:29:44+02:00'),
  ('0uon2ms175g3mbjat55jbatr9g_20260930T140000Z','vojta','Vojta doučko','2026-09-30T16:00:00+02:00','2026-09-30T17:00:00+02:00',60,'planned',NULL,'2026-09-01T20:29:44+02:00');

INSERT OR IGNORE INTO tutoring_lessons
  (id, google_event_id, student_id, student_label, lesson_date, starts_at, ends_at, duration_minutes, hourly_rate, amount, payment_status, paid_at, payment_method, source, note) VALUES
  ('L-2026-001',NULL,NULL,'Historický souhrn','2026-08-09',NULL,NULL,60,400,400,'paid','2026-08-09','Převod','historical_baseline','Agregovaný záznam týdne 4.–9. 8. 2026.'),
  ('L-2026-002',NULL,NULL,'Historický souhrn','2026-08-09',NULL,NULL,60,400,400,'paid','2026-08-09','Převod','historical_baseline','Agregovaný záznam týdne 4.–9. 8. 2026.'),
  ('L-2026-003',NULL,NULL,'Historický souhrn','2026-08-09',NULL,NULL,60,400,400,'paid','2026-08-09','Převod','historical_baseline','Agregovaný záznam týdne 4.–9. 8. 2026.'),
  ('L-2026-004',NULL,NULL,'Historický souhrn','2026-08-09',NULL,NULL,60,400,400,'paid','2026-08-09','Převod','historical_baseline','Agregovaný záznam týdne 4.–9. 8. 2026.'),
  ('L-2026-005',NULL,NULL,'Historický souhrn','2026-08-09',NULL,NULL,60,450,450,'paid','2026-08-09','Převod','historical_baseline','Agregovaný záznam týdne 4.–9. 8. 2026.'),
  ('L-2026-006',NULL,NULL,'Historický souhrn','2026-08-16',NULL,NULL,60,400,400,'paid','2026-08-16','Převod','historical_baseline','Agregovaný záznam týdne 10.–16. 8. 2026.'),
  ('L-2026-007',NULL,NULL,'Historický souhrn','2026-08-16',NULL,NULL,60,400,400,'paid','2026-08-16','Převod','historical_baseline','Agregovaný záznam týdne 10.–16. 8. 2026.'),
  ('L-2026-008',NULL,NULL,'Historický souhrn','2026-08-16',NULL,NULL,60,400,400,'paid','2026-08-16','Převod','historical_baseline','Agregovaný záznam týdne 10.–16. 8. 2026.'),
  ('L-2026-009',NULL,NULL,'Historický souhrn','2026-08-16',NULL,NULL,60,400,400,'paid','2026-08-16','Převod','historical_baseline','Agregovaný záznam týdne 10.–16. 8. 2026.'),
  ('L-2026-010',NULL,NULL,'Historický souhrn','2026-08-16',NULL,NULL,60,450,450,'paid','2026-08-16','Převod','historical_baseline','Agregovaný záznam týdne 10.–16. 8. 2026.'),
  ('L-2026-011','6qev5qvnha736rsmr8f8sgccgf_20260818T080000Z','natalie','Natálie','2026-08-18','2026-08-18T10:00:00+02:00','2026-08-18T11:00:00+02:00',60,400,400,'paid','2026-08-18','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-012','0uon2ms175g3mbjat55jbatr9g_20260819T140000Z','vojta','Vojta','2026-08-19','2026-08-19T16:00:00+02:00','2026-08-19T17:00:00+02:00',60,450,450,'paid','2026-08-19','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-013','0rjf6q1l8f9qbsgmejckkk5jsu','evelina','Evelína','2026-08-20','2026-08-20T18:00:00+02:00','2026-08-20T19:00:00+02:00',60,450,450,'paid','2026-08-20','Převod','google_calendar','Letní final; návrat ve školním roce.'),
  ('L-2026-014','650sp4qsria41o0vmqh74j5bet_20260821T080000Z','natalie','Natálie','2026-08-21','2026-08-21T10:00:00+02:00','2026-08-21T11:00:00+02:00',60,400,400,'paid','2026-08-21','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-015','4bidql922u6vd6bmajcs73jbhr_20260825T110000Z','petra','Petra','2026-08-25','2026-08-25T13:00:00+02:00','2026-08-25T15:00:00+02:00',120,450,900,'paid','2026-08-25','Převod','google_calendar','120 min × 450 Kč/h.'),
  ('L-2026-016','0uon2ms175g3mbjat55jbatr9g_20260826T140000Z','vojta','Vojta','2026-08-26','2026-08-26T16:00:00+02:00','2026-08-26T17:00:00+02:00',60,450,450,'paid','2026-08-26','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-017','6qev5qvnha736rsmr8f8sgccgf_20260825T080000Z','natalie','Natálie','2026-08-26','2026-08-26T17:00:00+02:00','2026-08-26T18:00:00+02:00',60,400,400,'paid','2026-08-26','Převod','google_calendar','Přesunutá instance z 25. 8.'),
  ('L-2026-018','7cfq9d03sgocrhiaf3go8pnqed','anicka','Anička','2026-08-28','2026-08-28T09:00:00+02:00','2026-08-28T10:00:00+02:00',60,450,450,'paid','2026-08-28','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-019','650sp4qsria41o0vmqh74j5bet_20260828T080000Z','natalie','Natálie','2026-08-28','2026-08-28T10:00:00+02:00','2026-08-28T11:00:00+02:00',60,400,400,'paid','2026-08-28','Převod','google_calendar','Synchronizováno z Google Calendar.'),
  ('L-2026-020','6qev5qvnha736rsmr8f8sgccgf_20260901T080000Z','natalie','Natálie','2026-09-01','2026-09-01T10:00:00+02:00','2026-09-01T11:00:00+02:00',60,400,400,'paid','2026-09-01','Převod','google_calendar','Dokončeno 1. 9. 2026.');

INSERT OR IGNORE INTO tutoring_income
  (id, lesson_id, received_on, payer_label, amount, payment_method, description)
SELECT 'P-' || substr(id, 3), id, lesson_date, student_label, amount, 'Převod', 'Doučování – automatická úhrada po lekci'
  FROM tutoring_lessons
 WHERE payment_status = 'paid';

INSERT OR REPLACE INTO tutoring_sync_state
  (id, last_synced_at, completed_events, planned_events, source, note)
VALUES
  (1, '2026-09-01T20:29:44+02:00', 10, 18, 'google_calendar', 'Výchozí stav převzatý z hlavního sešitu a Google Calendar.');
