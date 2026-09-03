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
  FROM students AS student
 WHERE student.id <> 'prusikova'
    OR NOT EXISTS (SELECT 1 FROM tutoring_students WHERE id = 'anicka');

-- Authentication/profile IDs and calendar IDs are separate domains. Never
-- rely on them accidentally having the same spelling.
CREATE TABLE IF NOT EXISTS student_tutoring_links (
  student_id TEXT PRIMARY KEY,
  tutoring_student_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (tutoring_student_id) REFERENCES tutoring_students(id) ON DELETE CASCADE
);

-- Production profile "Anna" is the student called "Anička" in Calendar.
DELETE FROM student_tutoring_links
 WHERE tutoring_student_id = 'anicka'
   AND student_id <> 'prusikova'
   AND EXISTS (SELECT 1 FROM students WHERE id = 'prusikova');

INSERT INTO student_tutoring_links (student_id, tutoring_student_id)
SELECT 'prusikova', 'anicka'
 WHERE EXISTS (SELECT 1 FROM students WHERE id = 'prusikova')
   AND EXISTS (SELECT 1 FROM tutoring_students WHERE id = 'anicka')
ON CONFLICT(student_id) DO UPDATE SET
  tutoring_student_id = excluded.tutoring_student_id,
  updated_at = CURRENT_TIMESTAMP;

-- All other existing profiles currently use the same stable ID in both
-- domains. Future profiles receive an explicit link when they are created.
INSERT OR IGNORE INTO student_tutoring_links (student_id, tutoring_student_id)
SELECT student.id, student.id
  FROM students AS student
  JOIN tutoring_students AS tutoring ON tutoring.id = student.id;

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
