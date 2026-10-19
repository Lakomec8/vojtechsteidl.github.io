PRAGMA foreign_keys = ON;

-- 2026-10-19: Prepare three student profiles without exposing login email addresses.
-- Portal accounts remain DISABLED until emails are set in production D1
-- and explicitly allowed in the Cloudflare Access application.
-- Tutoring identities are inactive to prevent unconfirmed billing/calendar imports.
-- Their provisional 450 CZK/h rate is the database's historic default, not an agreed rate.

INSERT OR IGNORE INTO tutoring_students (id, display_name, hourly_rate, active, accent)
VALUES
  ('jan-zapletal', 'Jan Zapletal', 450, 0, 'blue'),
  ('petr-svihi', 'Petr', 450, 0, 'mint'),
  ('karolina-lhotska', 'Karolína Lhotská', 450, 0, 'violet');

INSERT OR IGNORE INTO students (id, email, display_name, material_path, enabled)
VALUES
  ('jan-zapletal', 'pending-jan-zapletal-20261019@portal.invalid', 'Jan Zapletal', 'jan-zapletal', 0),
  ('petr-svihi', 'pending-petr-svihi-20261019@portal.invalid', 'Petr', 'petr-svihi', 0),
  ('karolina-lhotska', 'pending-karolina-lhotska-20261019@portal.invalid', 'Karolína Lhotská', 'karolina-lhotska', 0);

INSERT OR IGNORE INTO student_profiles (student_id, payload_json)
VALUES
  ('jan-zapletal', json('{"studentName":"Jan Zapletal","studentInitials":"JZ","historicalLessonCountOffset":0,"progress":0,"progressText":"Studentská zóna je připravená. Výukové materiály, úkoly a další informace budou doplněny podle průběhu doučování.","priority":{"title":"Začínáme s doučováním","text":"Na tomto místě se budou zobrazovat aktuální studijní cíle, materiály a diagnostické testy.","deadline":"Podle domluvy"},"readiness":{"label":"Studijní postup","lessonWeight":60,"taskWeight":40},"lessons":[],"materials":[],"tasks":[],"timeline":[],"upcoming":[],"links":[{"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Veřejný web doučování."}],"externalLessons":[]}')),
  ('petr-svihi', json('{"studentName":"Petr","studentInitials":"P","historicalLessonCountOffset":0,"progress":0,"progressText":"Studentská zóna je připravená. Výukové materiály, úkoly a další informace budou doplněny podle průběhu doučování.","priority":{"title":"Začínáme s doučováním","text":"Na tomto místě se budou zobrazovat aktuální studijní cíle, materiály a diagnostické testy.","deadline":"Podle domluvy"},"readiness":{"label":"Studijní postup","lessonWeight":60,"taskWeight":40},"lessons":[],"materials":[],"tasks":[],"timeline":[],"upcoming":[],"links":[{"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Veřejný web doučování."}],"externalLessons":[]}')),
  ('karolina-lhotska', json('{"studentName":"Karolína Lhotská","studentInitials":"KL","historicalLessonCountOffset":0,"progress":0,"progressText":"Studentská zóna je připravená. Výukové materiály, úkoly a další informace budou doplněny podle průběhu doučování.","priority":{"title":"Začínáme s doučováním","text":"Na tomto místě se budou zobrazovat aktuální studijní cíle, materiály a diagnostické testy.","deadline":"Podle domluvy"},"readiness":{"label":"Studijní postup","lessonWeight":60,"taskWeight":40},"lessons":[],"materials":[],"tasks":[],"timeline":[],"upcoming":[],"links":[{"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Veřejný web doučování."}],"externalLessons":[]}'));

INSERT OR IGNORE INTO student_tutoring_links (student_id, tutoring_student_id)
VALUES
  ('jan-zapletal', 'jan-zapletal'),
  ('petr-svihi', 'petr-svihi'),
  ('karolina-lhotska', 'karolina-lhotska');
