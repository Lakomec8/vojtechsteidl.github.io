PRAGMA foreign_keys = ON;

-- Publish the quadratic masterclass to Karolína Losová (student id 'karolina').
-- This is a different student from Karolína Lhotská ('karolina-lhotska').
-- Preserve all existing lessons, materials and login configuration.
-- Safe if migration is replayed; keep the interactive URL a plain lesson link.
UPDATE student_profiles
   SET payload_json = json_insert(
         payload_json,
         '$.materials[#]',
         json_object(
           'title', 'Kvadratická funkce a rovnice — interaktivní zápis',
           'meta', 'Matematika · grafy, vrchol, parita, monotónnost, omezenost, diskriminant',
           'badge', 'Interaktivní',
           'badgeClass', 'interactive',
           'kind', 'interactive',
           'date', '2026-10-20',
           'url', 'https://vojtechsteidl.eu/interactive-notes/quadratics/',
           'source', 'interactive-library',
           'interactiveId', 'quadratics'
         )
       ),
       updated_at = CURRENT_TIMESTAMP
 WHERE student_id = 'karolina'
   AND json_type(payload_json, '$.materials') = 'array'
   AND instr(payload_json, '/interactive-notes/quadratics/') = 0;
