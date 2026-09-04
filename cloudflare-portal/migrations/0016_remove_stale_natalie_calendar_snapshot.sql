PRAGMA foreign_keys = ON;

-- The live primary Google Calendar no longer contains Natalie tutoring events from
-- 2026-09-04 onward. The historical D1 snapshot still did, so the settlement
-- cron could incorrectly create a lesson and income entry for a removed event.

DELETE FROM tutoring_income
 WHERE lesson_id IN (
   SELECT id
     FROM tutoring_lessons
    WHERE google_event_id = '650sp4qsria41o0vmqh74j5bet_20260904T080000Z'
      AND student_id = 'natalie'
      AND source = 'google_calendar'
 );

DELETE FROM tutoring_lessons
 WHERE google_event_id = '650sp4qsria41o0vmqh74j5bet_20260904T080000Z'
   AND student_id = 'natalie'
   AND source = 'google_calendar';

UPDATE tutoring_calendar_events
   SET status = 'cancelled',
       last_synced_at = CURRENT_TIMESTAMP
 WHERE student_id = 'natalie'
   AND status = 'planned'
   AND starts_at >= '2026-09-04T00:00:00Z';

UPDATE tutoring_calendar_events
   SET status = 'cancelled',
       last_synced_at = CURRENT_TIMESTAMP
 WHERE google_event_id = '650sp4qsria41o0vmqh74j5bet_20260904T080000Z';

UPDATE tutoring_sync_state
   SET completed_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
       planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       last_synced_at = CURRENT_TIMESTAMP,
       note = 'Odstraněn zastaralý snapshot Natálie; kontinuální ingest z Google Calendaru čeká na ICS secret.'
 WHERE id = 1;
