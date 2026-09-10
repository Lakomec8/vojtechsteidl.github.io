PRAGMA foreign_keys = ON;

-- Global fix: expose the next valid future tutoring lesson for every portal student
-- through the explicit student_tutoring_links mapping. This avoids relying on
-- profile IDs and tutoring/calendar IDs having identical spelling.
--
-- The view is intentionally generic so all student dashboards can query the same
-- canonical source for last/next lesson metadata.
CREATE VIEW IF NOT EXISTS student_lesson_schedule AS
SELECT
  link.student_id,
  link.tutoring_student_id,
  (
    SELECT MAX(l.start_at)
      FROM tutoring_lessons AS l
     WHERE l.student_id = link.tutoring_student_id
       AND l.status = 'completed'
  ) AS last_lesson_at,
  (
    SELECT MIN(l.start_at)
      FROM tutoring_lessons AS l
     WHERE l.student_id = link.tutoring_student_id
       AND l.status IN ('planned', 'scheduled')
       AND datetime(l.start_at) > datetime('now')
  ) AS next_lesson_at
FROM student_tutoring_links AS link;
