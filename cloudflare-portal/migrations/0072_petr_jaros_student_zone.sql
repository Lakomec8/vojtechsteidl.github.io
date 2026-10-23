PRAGMA foreign_keys = ON;

-- Petr Jaroš is the student behind the verified Friday calendar series
-- "Fyzika doučko" (publicly anonymized as Fyzika). The generic event title
-- must be connected by series ID, never by a broad text alias such as "fyzika".
CREATE TABLE IF NOT EXISTS tutoring_calendar_series_students (
  series_id TEXT NOT NULL,
  tutoring_student_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (series_id, tutoring_student_id),
  FOREIGN KEY (tutoring_student_id) REFERENCES tutoring_students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tutoring_calendar_series_student
  ON tutoring_calendar_series_students(tutoring_student_id);

INSERT INTO tutoring_students (id, display_name, hourly_rate, active, accent)
VALUES ('petr-jaros', 'Petr Jaroš', 450, 1, 'mint')
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  active = 1,
  accent = excluded.accent,
  updated_at = CURRENT_TIMESTAMP;

-- Login stays disabled until the real email is supplied and admitted through
-- Cloudflare Access. This placeholder is not a deliverable login identity.
INSERT INTO students (id, email, display_name, material_path, enabled)
VALUES ('petr-jaros', 'pending-petr-jaros-20261023@portal.invalid', 'Petr Jaroš', 'petr-jaros', 0)
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  material_path = excluded.material_path,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO student_profiles (student_id, payload_json)
VALUES (
  'petr-jaros',
  json('{
    "studentName":"Petr Jaroš",
    "studentInitials":"PJ",
    "historicalLessonCountOffset":0,
    "completedLessonsCount":0,
    "progress":5,
    "progressText":"Studentská zóna pro fyziku je připravená a propojená s pátečními lekcemi v kalendáři.",
    "priority":{
      "title":"Mechanika · rychlost a síly",
      "text":"Projdi interaktivní materiál: vztažné soustavy, průměrná rychlost, Newtonovy zákony a rozklad sil.",
      "deadline":"Navazuje na páteční doučování fyziky"
    },
    "readiness":{"label":"Fyzika · průběžná příprava","lessonWeight":70,"taskWeight":30},
    "lessons":[],
    "materials":[{
      "title":"Mechanika: rychlost, vztažné soustavy a síly",
      "meta":"Fyzika · živé vektory, výpočty a free-body diagrams",
      "badge":"Aktuální materiál",
      "badgeClass":"interactive",
      "date":"2026-10-23",
      "url":"https://vojtechsteidl.eu/interactive-notes/mechanics-motion-forces/",
      "kind":"interactive",
      "interactiveId":"mechanics-motion-forces"
    }],
    "tasks":[],
    "timeline":[{
      "month":"Říj",
      "day":"23",
      "title":"Studentská zóna připravena",
      "desc":"Profil pro fyziku byl založen a propojen s pátečním kalendářem.",
      "badge":"START"
    }],
    "upcoming":[],
    "links":[{"title":"Hlavní web","url":"https://vojtechsteidl.eu/","desc":"Veřejný web doučování."}],
    "externalLessons":[],
    "incrementLessonCountOnMaterialAdd":false
  }')
)
ON CONFLICT(student_id) DO UPDATE SET
  payload_json = excluded.payload_json,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO student_tutoring_links (student_id, tutoring_student_id)
VALUES ('petr-jaros', 'petr-jaros')
ON CONFLICT(student_id) DO UPDATE SET
  tutoring_student_id = excluded.tutoring_student_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO tutoring_calendar_series_students (series_id, tutoring_student_id)
VALUES ('2b2suvsjh6e68sm04jh3ucavld', 'petr-jaros');
