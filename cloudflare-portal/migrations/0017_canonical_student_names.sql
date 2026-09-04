PRAGMA foreign_keys = ON;

-- Student portal display names are the canonical human-readable names. The
-- tutoring/calendar registry keeps stable IDs (for example `anicka`) but must
-- not preserve informal nicknames when a linked portal identity exists.
UPDATE tutoring_students AS tutoring
   SET display_name = (
         SELECT student.display_name
           FROM student_tutoring_links AS link
           JOIN students AS student ON student.id = link.student_id
          WHERE link.tutoring_student_id = tutoring.id
          LIMIT 1
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE EXISTS (
         SELECT 1
           FROM student_tutoring_links AS link
           JOIN students AS student ON student.id = link.student_id
          WHERE link.tutoring_student_id = tutoring.id
            AND trim(student.display_name) <> ''
       )
   AND NOT EXISTS (
         SELECT 1
           FROM student_tutoring_links AS link
           JOIN students AS student ON student.id = link.student_id
           JOIN tutoring_students AS other
             ON other.id <> tutoring.id
            AND lower(other.display_name) = lower(student.display_name)
          WHERE link.tutoring_student_id = tutoring.id
       );

-- Keep already recorded lesson and payment labels consistent with the
-- canonical registry name. Stable student IDs remain unchanged.
UPDATE tutoring_lessons
   SET student_label = (
         SELECT tutoring.display_name
           FROM tutoring_students AS tutoring
          WHERE tutoring.id = tutoring_lessons.student_id
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id IS NOT NULL
   AND EXISTS (
         SELECT 1
           FROM tutoring_students AS tutoring
          WHERE tutoring.id = tutoring_lessons.student_id
       );

UPDATE tutoring_income
   SET payer_label = (
         SELECT lesson.student_label
           FROM tutoring_lessons AS lesson
          WHERE lesson.id = tutoring_income.lesson_id
       )
 WHERE EXISTS (
         SELECT 1
           FROM tutoring_lessons AS lesson
          WHERE lesson.id = tutoring_income.lesson_id
       );
