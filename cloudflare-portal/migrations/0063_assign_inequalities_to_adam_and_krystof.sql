PRAGMA foreign_keys = ON;

-- Add the shared interactive inequalities masterclass to both existing pupils.
-- Keep each student's materials, lessons, logins, scores, and settings untouched.
-- Re-runnable without duplicate assignment.
UPDATE student_profiles
   SET payload_json = json_insert(
         payload_json,
         '$.materials[#]',
         json_object(
           'title', 'Nerovnice a soustavy — interaktivní zápis',
           'meta', 'Matematika · intervaly, soustavy, znaménka, lomené a kvadratické nerovnice',
           'badge', 'Interaktivní',
           'badgeClass', 'interactive',
           'kind', 'interactive',
           'date', '2026-10-20',
           'url', 'https://vojtechsteidl.eu/interactive-notes/inequalities/',
           'source', 'interactive-library',
           'interactiveId', 'inequalities'
         )
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id IN ('adam', 'krystof')
   AND json_type(payload_json, '$.materials') = 'array'
   AND instr(payload_json, '/interactive-notes/inequalities/') = 0;

-- Portal audit requires newest-first material ordering and exactly one
-- current badge attached to the latest material. Keep all older entries.
-- When dates tie, prefer this newly assigned lesson.
UPDATE student_profiles
   SET payload_json = json_set(
         payload_json,
         '$.materials',
         (
           SELECT json_group_array(json(
                    CASE
                      WHEN ranked.rn = 1 THEN
                        json_set(ranked.value, '$.badge', 'Aktuální materiál')
                      WHEN json_extract(ranked.value, '$.badge')
                           IN ('Aktuální PDF', 'Aktuální materiál') THEN
                        json_set(ranked.value, '$.badge',
                          CASE WHEN json_extract(ranked.value, '$.kind') = 'interactive'
                                 OR instr(coalesce(json_extract(ranked.value, '$.url'), ''), '/interactive-notes/') > 0
                               THEN 'Interaktivní' ELSE 'PDF' END)
                      ELSE ranked.value
                    END
                  ))
             FROM (
               SELECT value,
                      row_number() OVER (
                        ORDER BY coalesce(json_extract(value,'$.date'),'') DESC,
                                 CASE WHEN instr(coalesce(json_extract(value,'$.url'),''), '/interactive-notes/inequalities/') > 0 THEN 1 ELSE 0 END DESC,
                                 CAST(key AS INTEGER) ASC
                      ) AS rn
                 FROM json_each(student_profiles.payload_json,'$.materials')
                ORDER BY coalesce(json_extract(value,'$.date'),'') DESC,
                         CASE WHEN instr(coalesce(json_extract(value,'$.url'),''), '/interactive-notes/inequalities/') > 0 THEN 1 ELSE 0 END DESC,
                         CAST(key AS INTEGER) ASC
             ) AS ranked
         )
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id IN ('adam', 'krystof')
   AND instr(payload_json, '/interactive-notes/inequalities/') > 0;
