SELECT id, display_name, material_path, enabled
FROM students
WHERE id = 'vojta2';

SELECT student_id, json_extract(payload_json, '$.studentName') AS student_name,
       json_extract(payload_json, '$.priority.title') AS priority_title
FROM student_profiles
WHERE student_id = 'vojta2';
