PRAGMA foreign_keys = ON;

-- The portal audit requires exactly one current material badge for every
-- student with materials. Preserve the non-PDF nature of the lesson.
-- Avoid replacing any existing explicitly selected current material.
UPDATE student_profiles
   SET payload_json = json_set(
         payload_json,
         '$.materials[' || (
           SELECT CAST(item.key AS TEXT)
             FROM json_each(payload_json, '$.materials') AS item
            WHERE json_extract(item.value, '$.url') =
                  'https://vojtechsteidl.eu/interactive-notes/mechanical-waves/'
            LIMIT 1
         ) || '].badge',
         'Aktuální materiál'
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'karolina-lhotska'
   AND EXISTS (
     SELECT 1
       FROM json_each(payload_json, '$.materials') AS item
      WHERE json_extract(item.value, '$.url') =
            'https://vojtechsteidl.eu/interactive-notes/mechanical-waves/'
   )
   AND NOT EXISTS (
     SELECT 1
       FROM json_each(payload_json, '$.materials') AS item
      WHERE json_extract(item.value, '$.badge') IN ('Aktuální PDF', 'Aktuální materiál')
   );
