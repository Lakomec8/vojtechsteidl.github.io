-- Rename only the student-facing profile label.
-- Authentication, Access policy, tutoring links and materials remain unchanged.
UPDATE student_profiles
   SET payload_json = json_set(payload_json, '$.studentName', 'Dan Štec'),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id IN (
       SELECT id
         FROM students
        WHERE display_name = 'Mirek Štec' COLLATE NOCASE
          AND enabled = 1
 );
