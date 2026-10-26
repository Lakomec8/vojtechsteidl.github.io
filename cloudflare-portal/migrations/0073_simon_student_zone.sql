PRAGMA foreign_keys = ON;

-- Šimon, 2. ročník SŠ. Profile is provisioned without publishing his
-- parent's login address in the public repository.
-- Authentication MUST remain disabled until the parent email is inserted
-- privately in D1 and the Cloudflare Access policy allows that address.
-- The introductory physics lesson must not create a historical calendar
-- record here: Google Calendar remains the single source of truth.

INSERT OR IGNORE INTO tutoring_students (id, display_name, hourly_rate, active, accent)
VALUES ('simon', 'Šimon', 450, 1, 'blue');

INSERT OR IGNORE INTO students (id, email, display_name, material_path, enabled)
VALUES ('simon', 'pending-simon-20261026@portal.invalid', 'Šimon', 'simon', 0);

INSERT OR IGNORE INTO student_profiles (student_id, payload_json)
VALUES ('simon', json('{"studentName":"Šimon","studentInitials":"Š","historicalLessonCountOffset":0,"completedLessonsCount":0,"progress":0,"progressText":"Vítej ve studentské zóně. Pravidelná příprava z matematiky pro 2. ročník SŠ, podle aktuálních témat ve škole.","priority":{"title":"Matematika · 2. ročník SŠ","text":"Na navazujících hodinách se zaměříme na aktuální látku a postupně doplníme řešené příklady, zápisy i krátké ověřovací testy.","deadline":"Průběžná příprava"},"readiness":{"label":"Matematika SŠ · průběžná příprava","lessonWeight":70,"taskWeight":30},"lessons":[],"materials":[],"tasks":[],"timeline":[{"month":"Říj","day":"26","title":"Založení studentské zóny","desc":"Připraven prostor pro materiály, úkoly a navazující lekce.","badge":"START"}],"upcoming":[],"links":[{"title":"Veřejné ukázky PDF","url":"https://vojtechsteidl.eu/materialy-zdarma/","desc":"Ukázkové zápisy z matematiky; individuální materiály se objeví přímo zde."}],"externalLessons":[],"incrementLessonCountOnMaterialAdd":false}'));

INSERT OR IGNORE INTO student_tutoring_links (student_id, tutoring_student_id)
VALUES ('simon', 'simon');
