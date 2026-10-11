-- Keep the administrator's student listing consistent with the portal heading.
-- Do not change the student's id, email, Access configuration or materials.
UPDATE student_profiles
   SET payload_json = json_set(
         payload_json,
         '$.studentName', 'Dan Štec',
         '$.studentInitials', 'DŠ'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id IN (
       SELECT id
         FROM students
        WHERE display_name = 'Mirek Štec' COLLATE NOCASE
          AND enabled = 1
 );

UPDATE students
   SET display_name = 'Dan Štec',
       updated_at = CURRENT_TIMESTAMP
 WHERE display_name = 'Mirek Štec' COLLATE NOCASE
   AND enabled = 1;
