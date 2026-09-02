UPDATE tutoring_students
   SET hourly_rate = 400,
       updated_at = CURRENT_TIMESTAMP
 WHERE id = 'evelina';

UPDATE tutoring_lessons
   SET hourly_rate = 400,
       amount = CAST(ROUND(duration_minutes * 400.0 / 60.0) AS INTEGER),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'evelina';

UPDATE tutoring_income
   SET amount = (
     SELECT lesson.amount
       FROM tutoring_lessons AS lesson
      WHERE lesson.id = tutoring_income.lesson_id
   )
 WHERE lesson_id IN (
   SELECT id
     FROM tutoring_lessons
    WHERE student_id = 'evelina'
 );
