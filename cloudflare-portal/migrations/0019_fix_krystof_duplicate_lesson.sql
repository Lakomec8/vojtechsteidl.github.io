PRAGMA foreign_keys = ON;

-- The live Google Calendar now contains exactly one valid group lesson for
-- Adam + Kryštof on 2026-09-07. Remove any already-settled duplicate lesson
-- rows for Kryštof from that date while preserving the canonical occurrence.
DELETE FROM tutoring_lessons
 WHERE student_id = 'krystof'
   AND source = 'google_calendar'
   AND lesson_date = '2026-09-07'
   AND google_event_id IS NOT NULL
   AND google_event_id <> '08v4aeq1mfj4ul4lg4n89i3uve_20260907T140000Z';

-- Keep stale deleted-calendar occurrences from appearing as completed events.
UPDATE tutoring_calendar_events
   SET status = 'cancelled',
       last_synced_at = CURRENT_TIMESTAMP
 WHERE google_event_id <> '08v4aeq1mfj4ul4lg4n89i3uve_20260907T140000Z'
   AND date(datetime(starts_at)) = '2026-09-07'
   AND google_event_id IN (
     SELECT google_event_id
       FROM tutoring_calendar_event_students
      WHERE student_id = 'krystof'
     UNION
     SELECT google_event_id
       FROM tutoring_calendar_events
      WHERE student_id = 'krystof'
   );

UPDATE tutoring_sync_state
   SET completed_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
       planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       note = 'Odstraněna duplicitní Kryštofova lekce z 7. 9. 2026; stav znovu sladěn s kalendářem.'
 WHERE id = 1;
