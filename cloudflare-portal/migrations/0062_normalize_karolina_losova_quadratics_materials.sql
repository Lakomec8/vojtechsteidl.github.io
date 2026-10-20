PRAGMA foreign_keys = ON;

-- Follow up to the new 2026-10-20 interactive lesson.
-- The student portal audit expects materials newest-first and exactly one
-- current badge on the newest entry. Correct only Karolína Losová.
-- Existing material links, titles and lesson history remain unchanged.
UPDATE student_profiles
   SET payload_json = json_set(
         payload_json,
         '$.materials',
         (
           SELECT json_group_array(
                    json(
                      CASE
                        WHEN j.rn = 1 THEN
                          json_set(j.value, '$.badge', 'Aktuální materiál')
                        WHEN json_extract(j.value, '$.badge') IN
                             ('Aktuální PDF', 'Aktuální materiál') THEN
                          json_set(
                            j.value,
                            '$.badge',
                            CASE
                              WHEN json_extract(j.value, '$.kind') = 'interactive'
                                   OR instr(coalesce(json_extract(j.value, '$.url'), ''), '/interactive-notes/') > 0
                                THEN 'Interaktivní'
                              ELSE 'PDF'
                            END
                          )
                        ELSE j.value
                      END
                    )
                  )
             FROM (
               SELECT value,
                      row_number() OVER (
                        ORDER BY coalesce(json_extract(value, '$.date'), '') DESC,
                                 CAST(key AS INTEGER) ASC
                      ) AS rn
                 FROM json_each(student_profiles.payload_json, '$.materials')
                ORDER BY coalesce(json_extract(value, '$.date'), '') DESC,
                         CAST(key AS INTEGER) ASC
             ) AS j
         )
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'karolina'
   AND instr(payload_json, '/interactive-notes/quadratics/') > 0;
