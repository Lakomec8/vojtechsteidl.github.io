PRAGMA foreign_keys = ON;

-- Repair stale current badge for Karolína Losová caused by an older
-- admin-library normalization rule that preferred PDFs over newer interactive lessons.
-- This is only a metadata correction; content, history, links, and access are untouched.
UPDATE student_profiles
   SET payload_json = json_set(
         payload_json, '$.materials',
         (
           SELECT json_group_array(json(
             CASE
               WHEN ranked.rn = 1 THEN json_set(ranked.value,'$.badge',
                 CASE
                   WHEN json_extract(ranked.value, '$.kind') = 'interactive'
                        OR instr(coalesce(json_extract(ranked.value,'$.url'),''), '/interactive-notes/') > 0
                   THEN 'Aktuální materiál' ELSE 'Aktuální PDF' END
               )
               WHEN json_extract(ranked.value,'$.badge') IN ('Aktuální PDF','Aktuální materiál') THEN
                 json_set(ranked.value,'$.badge',
                   CASE WHEN json_extract(ranked.value,'$.kind') = 'interactive'
                             OR instr(coalesce(json_extract(ranked.value,'$.url'),''), '/interactive-notes/') > 0
                        THEN 'Interaktivní' ELSE 'PDF' END)
               ELSE ranked.value
             END
           ))
           FROM (
             SELECT value,
                    row_number() OVER (
                      ORDER BY coalesce(json_extract(value,'$.date'),'') DESC, CAST(key AS INTEGER) ASC
                    ) AS rn
               FROM json_each(student_profiles.payload_json, '$.materials')
              ORDER BY coalesce(json_extract(value,'$.date'),'') DESC, CAST(key AS INTEGER) ASC
           ) AS ranked
         )
       ),
       updated_at=CURRENT_TIMESTAMP
 WHERE student_id='karolina'
   AND json_type(payload_json,'$.materials')='array'
   AND EXISTS (SELECT 1 FROM json_each(payload_json,'$.materials'));
