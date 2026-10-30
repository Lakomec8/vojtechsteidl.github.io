PRAGMA foreign_keys = ON;

-- Portal login activation and calendar activation used to be separate manual
-- steps. That left valid student accounts with no completed or upcoming
-- lessons. An enabled portal account is now sufficient evidence that its
-- explicitly linked tutoring identity should participate in calendar sync.
UPDATE tutoring_students
   SET active = 1,
       updated_at = CURRENT_TIMESTAMP
 WHERE active = 0
   AND EXISTS (
     SELECT 1
       FROM student_tutoring_links AS link
       JOIN students AS portal ON portal.id = link.student_id
      WHERE link.tutoring_student_id = tutoring_students.id
        AND portal.enabled = 1
   );
