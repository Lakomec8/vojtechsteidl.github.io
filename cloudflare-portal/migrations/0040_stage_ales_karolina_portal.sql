PRAGMA foreign_keys = ON;

-- Prepare two new portal identities without committing private login emails.
-- They stay disabled until the real addresses are set directly in production D1
-- and added to the Cloudflare Access allow policy.

INSERT INTO tutoring_students (id, display_name, hourly_rate, active, accent)
VALUES
  ('ales', 'Aleš Vyklický', 450, 1, 'blue'),
  ('karolina', 'Karolína Losová', 450, 1, 'violet')
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  hourly_rate = excluded.hourly_rate,
  active = excluded.active,
  accent = excluded.accent,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO students (id, email, display_name, material_path, enabled)
VALUES
  ('ales', 'pending-ales@portal.invalid', 'Aleš Vyklický', 'ales', 0),
  ('karolina', 'pending-karolina@portal.invalid', 'Karolína Losová', 'karolina', 0)
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  material_path = excluded.material_path,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO student_profiles (student_id, payload_json)
VALUES
  (
    'ales',
    json('{
      "studentName":"Aleš Vyklický",
      "studentInitials":"AV",
      "historicalLessonCountOffset":0,
      "completedLessonsCount":0,
      "progress":10,
      "progressText":"Pravidelná příprava z vysokoškolské matematiky podle aktuální látky a požadavků PEF MENDELU.",
      "priority":{
        "title":"Matematika · PEF MENDELU",
        "text":"Cílem je systematicky projít problematická témata prvního semestru a připravit se na průběžné kontroly, zápočet a zkoušku.",
        "deadline":"Průběžná příprava"
      },
      "readiness":{"label":"VŠ matematika","lessonWeight":70,"taskWeight":30},
      "lessons":[],
      "materials":[],
      "tasks":[],
      "timeline":[
        {"month":"Říj","day":"05","title":"Studentská zóna připravena","desc":"Profil pro pravidelnou VŠ matematiku byl založen.","badge":"START"}
      ],
      "upcoming":[],
      "links":[
        {"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Návrat na veřejnou část webu."}
      ]
    }')
  ),
  (
    'karolina',
    json('{
      "studentName":"Karolína Losová",
      "studentInitials":"KL",
      "historicalLessonCountOffset":0,
      "completedLessonsCount":0,
      "progress":5,
      "progressText":"Studentská zóna je připravená. Konkrétní témata a materiály se budou doplňovat podle navazujících lekcí.",
      "priority":{
        "title":"Aktuální příprava",
        "text":"Po úvodní lekci se zde budou zobrazovat aktuální témata, materiály, úkoly a další termíny.",
        "deadline":"Podle domluvy"
      },
      "readiness":{"label":"Průběžná příprava","lessonWeight":70,"taskWeight":30},
      "lessons":[],
      "materials":[],
      "tasks":[],
      "timeline":[
        {"month":"Říj","day":"05","title":"Studentská zóna připravena","desc":"Profil byl založen a čeká na další navazující výuku.","badge":"START"}
      ],
      "upcoming":[],
      "links":[
        {"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Návrat na veřejnou část webu."}
      ]
    }')
  )
ON CONFLICT(student_id) DO UPDATE SET
  payload_json = excluded.payload_json,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO student_tutoring_links (student_id, tutoring_student_id)
VALUES
  ('ales', 'ales'),
  ('karolina', 'karolina')
ON CONFLICT(student_id) DO UPDATE SET
  tutoring_student_id = excluded.tutoring_student_id,
  updated_at = CURRENT_TIMESTAMP;
