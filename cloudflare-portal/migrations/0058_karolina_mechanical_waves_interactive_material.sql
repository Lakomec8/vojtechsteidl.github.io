PRAGMA foreign_keys = ON;

-- Add the interactive mechanical-waves lesson to Karolína Lhotská's materials.
-- Keep existing student profile and materials history untouched.
-- Idempotent on repeated migrations, without a public email address.
UPDATE student_profiles
   SET payload_json = json_insert(
         payload_json,
         '$.materials[#]',
         json_object(
           'title', 'Mechanické vlnění — interaktivní laboratoř',
           'meta', 'Fyzika · vztahy, animace a čtyři experimenty',
           'badge', 'Interaktivní',
           'badgeClass', 'interactive',
           'date', '2026-10-19',
           'url', 'https://vojtechsteidl.eu/interactive-notes/mechanical-waves/'
         )
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'karolina-lhotska'
   AND json_type(payload_json, '$.materials') = 'array'
   AND instr(payload_json, '/interactive-notes/mechanical-waves/') = 0;
