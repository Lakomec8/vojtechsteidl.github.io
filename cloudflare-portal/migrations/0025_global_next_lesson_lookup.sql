PRAGMA foreign_keys = ON;

-- Global canonical lesson schedule for every portal student.
-- Portal profile IDs and tutoring/calendar IDs are separate domains, therefore
-- every lookup goes through student_tutoring_links.
CREATE VIEW IF NOT EXISTS student_lesson_schedule AS
SELECT
  link.student_id,
  link.tutoring_student_id,
  (
    SELECT MAX(e.starts_at)
      FROM tutoring_calendar_events AS e
     WHERE e.student_id = link.tutoring_student_id
       AND e.status = 'completed'
  ) AS last_lesson_at,
  (
    SELECT MIN(e.starts_at)
      FROM tutoring_calendar_events AS e
     WHERE e.student_id = link.tutoring_student_id
       AND e.status = 'planned'
       AND datetime(e.starts_at) > datetime('now')
  ) AS next_lesson_at
FROM student_tutoring_links AS link;
