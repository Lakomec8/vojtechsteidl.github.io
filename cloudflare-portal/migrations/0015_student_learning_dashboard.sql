PRAGMA foreign_keys = ON;

-- Every portal student must also exist in the tutoring/calendar registry. New
-- students default to the standard 450 CZK rate; established rates are kept by
-- INSERT OR IGNORE.
INSERT OR IGNORE INTO tutoring_students (id, display_name, hourly_rate, active)
SELECT student.id,
       student.display_name,
       CASE
         WHEN lower(student.id) IN ('natalie', 'evelina') THEN 400
         ELSE 450
       END,
       student.enabled
  FROM students AS student;

-- Student dashboards query the latest attempt for every assignment, including
-- historical diagnostics. Keep that lookup fast as the attempt history grows.
CREATE INDEX IF NOT EXISTS idx_self_check_attempts_student_assignment_submitted
  ON self_check_attempts(student_id, assignment_id, submitted_at DESC);

-- The split diagnostic migration archived Anička's original assignment even
-- when she had already submitted it. Preserve that state as completed history.
UPDATE self_check_assignments
   SET status = 'completed', updated_at = CURRENT_TIMESTAMP
 WHERE status = 'archived'
   AND EXISTS (
     SELECT 1
       FROM self_check_attempts AS attempt
      WHERE attempt.assignment_id = self_check_assignments.id
   );
