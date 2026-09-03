PRAGMA foreign_keys = ON;

-- Snapshot refreshed from the connected primary Google Calendar on 2026-09-03.
-- Only already-known tutoring students are included here. New/uncertain names are
-- intentionally excluded until they are explicitly created as tutoring students.

INSERT INTO tutoring_calendar_events
  (google_event_id, student_id, summary, starts_at, ends_at, duration_minutes, status, calendar_url, last_synced_at)
VALUES
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261102T150000Z','adam','Adam a Kryštof','2026-11-02T16:00:00+01:00','2026-11-02T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjExMDJUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('6qev5qvnha736rsmr8f8sgccgf_20261103T090000Z','natalie','Natalie doučko','2026-11-03T10:00:00+01:00','2026-11-03T11:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjExMDNUMDkwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('4bidql922u6vd6bmajcs73jbhr_20261103T120000Z','petra','Petra doučování','2026-11-03T13:00:00+01:00','2026-11-03T15:00:00+01:00',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjExMDNUMTIwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('0uon2ms175g3mbjat55jbatr9g_20261104T150000Z','vojta','Vojta doučko','2026-11-04T16:00:00+01:00','2026-11-04T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjExMDRUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261109T150000Z','adam','Adam a Kryštof','2026-11-09T16:00:00+01:00','2026-11-09T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjExMDlUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('6qev5qvnha736rsmr8f8sgccgf_20261110T090000Z','natalie','Natalie doučko','2026-11-10T10:00:00+01:00','2026-11-10T11:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjExMTBUMDkwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('4bidql922u6vd6bmajcs73jbhr_20261110T120000Z','petra','Petra doučování','2026-11-10T13:00:00+01:00','2026-11-10T15:00:00+01:00',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjExMTBUMTIwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('0uon2ms175g3mbjat55jbatr9g_20261111T150000Z','vojta','Vojta doučko','2026-11-11T16:00:00+01:00','2026-11-11T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjExMTFUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261116T150000Z','adam','Adam a Kryštof','2026-11-16T16:00:00+01:00','2026-11-16T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjExMTZUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('6qev5qvnha736rsmr8f8sgccgf_20261117T090000Z','natalie','Natalie doučko','2026-11-17T10:00:00+01:00','2026-11-17T11:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjExMTdUMDkwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('4bidql922u6vd6bmajcs73jbhr_20261117T120000Z','petra','Petra doučování','2026-11-17T13:00:00+01:00','2026-11-17T15:00:00+01:00',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjExMTdUMTIwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('0uon2ms175g3mbjat55jbatr9g_20261118T150000Z','vojta','Vojta doučko','2026-11-18T16:00:00+01:00','2026-11-18T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjExMThUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261123T150000Z','adam','Adam a Kryštof','2026-11-23T16:00:00+01:00','2026-11-23T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjExMjNUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('6qev5qvnha736rsmr8f8sgccgf_20261124T090000Z','natalie','Natalie doučko','2026-11-24T10:00:00+01:00','2026-11-24T11:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=NnFldjVxdm5oYTczNnJzbXI4ZjhzZ2NjZ2ZfMjAyNjExMjRUMDkwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('4bidql922u6vd6bmajcs73jbhr_20261124T120000Z','petra','Petra doučování','2026-11-24T13:00:00+01:00','2026-11-24T15:00:00+01:00',120,'planned','https://www.google.com/calendar/event?eid=NGJpZHFsOTIydTZ2ZDZibWFqY3M3M2piaHJfMjAyNjExMjRUMTIwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('0uon2ms175g3mbjat55jbatr9g_20261125T150000Z','vojta','Vojta doučko','2026-11-25T16:00:00+01:00','2026-11-25T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MHVvbjJtczE3NWczbWJqYXQ1NWpiYXRyOWdfMjAyNjExMjVUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP),
  ('08v4aeq1mfj4ul4lg4n89i3uve_20261130T150000Z','adam','Adam a Kryštof','2026-11-30T16:00:00+01:00','2026-11-30T17:00:00+01:00',60,'planned','https://www.google.com/calendar/event?eid=MDh2NGFlcTFtZmo0dWw0bGc0bjg5aTN1dmVfMjAyNjExMzBUMTUwMDAwWiBkb25ueXRvcnJpZW1AbQ&ctz=Europe/Berlin',CURRENT_TIMESTAMP)
ON CONFLICT(google_event_id) DO UPDATE SET
  student_id = excluded.student_id,
  summary = excluded.summary,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  duration_minutes = excluded.duration_minutes,
  calendar_url = excluded.calendar_url,
  last_synced_at = excluded.last_synced_at;

INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id)
SELECT google_event_id, student_id
  FROM tutoring_calendar_events
 WHERE google_event_id LIKE '%202611%';

INSERT OR IGNORE INTO tutoring_calendar_event_students (google_event_id, student_id)
SELECT e.google_event_id, 'krystof'
  FROM tutoring_calendar_events AS e
 WHERE e.summary = 'Adam a Kryštof'
   AND e.google_event_id LIKE '%202611%';

UPDATE tutoring_sync_state
   SET planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       last_synced_at = CURRENT_TIMESTAMP,
       note = 'Kalendářní snapshot obnoven do konce listopadu; dokončené lekce uzavírá Cloudflare Cron.'
 WHERE id = 1;
