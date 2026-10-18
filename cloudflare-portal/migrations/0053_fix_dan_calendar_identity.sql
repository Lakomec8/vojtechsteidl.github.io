PRAGMA foreign_keys = ON;

-- The student-facing account is labelled "Dan Štec", while the connected
-- Google Calendar series is titled "Dan doučování". Calendar ingestion uses
-- the canonical tutoring identity deliberately, so keep that identity aligned
-- with the exact name token present in Calendar without changing login,
-- profile, materials or self-check ownership.
UPDATE tutoring_students
   SET display_name = 'Dan',
       updated_at = CURRENT_TIMESTAMP
 WHERE id IN (
       SELECT link.tutoring_student_id
         FROM student_tutoring_links AS link
         JOIN students AS student ON student.id = link.student_id
        WHERE student.display_name = 'Dan Štec' COLLATE NOCASE
          AND student.enabled = 1
 )
   AND active = 1;
