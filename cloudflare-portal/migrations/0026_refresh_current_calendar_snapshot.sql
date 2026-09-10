PRAGMA foreign_keys = ON;

-- Safety backfill of the currently verified Google Calendar snapshot.
-- The live Calendar ingestion remains authoritative; this migration only repairs
-- D1 rows that were missed while matching used the portal display name instead
-- of the canonical tutoring identity. Google event IDs keep the operation
-- idempotent and completed events are never downgraded to planned.

INSERT INTO tutoring_calendar_events
  (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at)
VALUES
  ('33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z','anicka','Anička','2026-09-09T15:00:00.000Z','2026-09-09T16:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MDlUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('4bidql922u6vd6bmajcs73jbhr_20260908T110000Z','petra','Petra doučování','2026-09-11T11:00:00.000Z','2026-09-11T13:00:00.000Z',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjA5MDhUMTEwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260914T140000Z','adam','Adam a Kryštof','2026-09-14T14:00:00.000Z','2026-09-14T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MTRUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('4bidql922u6vd6bmajcs73jbhr_20260915T110000Z','petra','Petra doučování','2026-09-15T11:00:00.000Z','2026-09-15T13:00:00.000Z',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjA5MTVUMTEwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('0uon2ms175g3mbjat55jbatr9g_20260916T140000Z','vojta','Vojta doučko','2026-09-16T14:00:00.000Z','2026-09-16T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA5MTZUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z','anicka','Anička','2026-09-16T15:00:00.000Z','2026-09-16T16:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MTZUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260921T140000Z','adam','Adam a Kryštof','2026-09-21T14:00:00.000Z','2026-09-21T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MjFUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('4bidql922u6vd6bmajcs73jbhr_20260922T110000Z','petra','Petra doučování','2026-09-22T11:00:00.000Z','2026-09-22T13:00:00.000Z',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjA5MjJUMTEwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('0uon2ms175g3mbjat55jbatr9g_20260923T140000Z','vojta','Vojta doučko','2026-09-23T14:00:00.000Z','2026-09-23T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA5MjNUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('33ueo9id4khrci7g8icc2l4o1p_20260923T150000Z','anicka','Anička','2026-09-23T15:00:00.000Z','2026-09-23T16:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MjNUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260928T140000Z','adam','Adam a Kryštof','2026-09-28T14:00:00.000Z','2026-09-28T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjA5MjhUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('4bidql922u6vd6bmajcs73jbhr_20260929T110000Z','petra','Petra doučování','2026-09-29T11:00:00.000Z','2026-09-29T13:00:00.000Z',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjA5MjlUMTEwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('0uon2ms175g3mbjat55jbatr9g_20260930T140000Z','vojta','Vojta doučko','2026-09-30T14:00:00.000Z','2026-09-30T15:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjA5MzBUMTQwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('33ueo9id4khrci7g8icc2l4o1p_20260930T150000Z','anicka','Anička','2026-09-30T15:00:00.000Z','2026-09-30T16:00:00.000Z',60,'planned','https://www.google.com/calendar/event?eid=MzN1ZW85aWQ0a2hyY2k3ZzhpY2MybDRvMXBfMjAyNjA5MzBUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Prague',strftime('%Y-%m-%dT%H:%M:%fZ','now'))
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
  calendar_url = excluded.calendar_url,
  last_synced_at = excluded.last_synced_at;

-- Rebuild verified participant links for the repaired snapshot.
INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id) VALUES
  ('33ueo9id4khrci7g8icc2l4o1p_20260909T150000Z','anicka'),
  ('4bidql922u6vd6bmajcs73jbhr_20260908T110000Z','petra'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260914T140000Z','adam'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260914T140000Z','krystof'),
  ('4bidql922u6vd6bmajcs73jbhr_20260915T110000Z','petra'),
  ('0uon2ms175g3mbjat55jbatr9g_20260916T140000Z','vojta'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260916T150000Z','anicka'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260921T140000Z','adam'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260921T140000Z','krystof'),
  ('4bidql922u6vd6bmajcs73jbhr_20260922T110000Z','petra'),
  ('0uon2ms175g3mbjat55jbatr9g_20260923T140000Z','vojta'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260923T150000Z','anicka'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260928T140000Z','adam'),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20260928T140000Z','krystof'),
  ('4bidql922u6vd6bmajcs73jbhr_20260929T110000Z','petra'),
  ('0uon2ms175g3mbjat55jbatr9g_20260930T140000Z','vojta'),
  ('33ueo9id4khrci7g8icc2l4o1p_20260930T150000Z','anicka');
