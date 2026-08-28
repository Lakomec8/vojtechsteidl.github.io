PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS self_check_tests (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 1 AND 180),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS self_check_questions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL CHECK (json_valid(options_json)),
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  FOREIGN KEY (test_id) REFERENCES self_check_tests(id) ON DELETE CASCADE,
  UNIQUE (test_id, position)
);

CREATE TABLE IF NOT EXISTS self_check_assignments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  due_at TEXT,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES self_check_tests(id) ON DELETE RESTRICT,
  UNIQUE (student_id, test_id)
);

CREATE TABLE IF NOT EXISTS self_check_attempts (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  max_score INTEGER NOT NULL CHECK (max_score > 0),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES self_check_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES self_check_tests(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS self_check_answers (
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  points_awarded INTEGER NOT NULL CHECK (points_awarded >= 0),
  PRIMARY KEY (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES self_check_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES self_check_questions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_self_check_assignments_student_status
  ON self_check_assignments(student_id, status, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_self_check_attempts_assignment_submitted
  ON self_check_attempts(assignment_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_self_check_answers_attempt
  ON self_check_answers(attempt_id);

INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'rovnice-nerovnice-zaklad-v1',
  'rovnice-nerovnice-zaklad',
  1,
  'Rovnice a nerovnice — rychlý self-check',
  'Osm krátkých úloh na lineární, součinové, kvadratické a absolutní rovnice a základní nerovnice.',
  'Matematika',
  'Rovnice a nerovnice',
  'SŠ / maturita',
  12,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'rovnice-nerovnice-zaklad-v1-q1',
    'rovnice-nerovnice-zaklad-v1',
    1,
    'Vyřeš rovnici 3x - 7 = 11.',
    '[{"id":"a","label":"x = 4"},{"id":"b","label":"x = 6"},{"id":"c","label":"x = 8"},{"id":"d","label":"x = 18"}]',
    'b',
    'Přičteme 7: 3x = 18. Po vydělení třemi dostaneme x = 6.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q2',
    'rovnice-nerovnice-zaklad-v1',
    2,
    'Vyřeš rovnici 2(x - 3) = x + 5.',
    '[{"id":"a","label":"x = 1"},{"id":"b","label":"x = 5"},{"id":"c","label":"x = 11"},{"id":"d","label":"x = -11"}]',
    'c',
    'Po roznásobení: 2x - 6 = x + 5. Odečtením x a přičtením 6 vyjde x = 11.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q3',
    'rovnice-nerovnice-zaklad-v1',
    3,
    'Která množina obsahuje všechna řešení rovnice (x - 1)(x + 4) = 0?',
    '[{"id":"a","label":"{1; 4}"},{"id":"b","label":"{-1; 4}"},{"id":"c","label":"{-4; 1}"},{"id":"d","label":"{-4; -1}"}]',
    'c',
    'Součin je nulový, když je nulový alespoň jeden činitel: x = 1 nebo x = -4.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q4',
    'rovnice-nerovnice-zaklad-v1',
    4,
    'Vyřeš rovnici x² - 5x + 6 = 0.',
    '[{"id":"a","label":"x = 2 nebo x = 3"},{"id":"b","label":"x = -2 nebo x = -3"},{"id":"c","label":"x = 1 nebo x = 6"},{"id":"d","label":"Rovnice nemá reálné řešení"}]',
    'a',
    'Rozklad je (x - 2)(x - 3) = 0, proto x = 2 nebo x = 3.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q5',
    'rovnice-nerovnice-zaklad-v1',
    5,
    'Vyřeš nerovnici 3x - 6 > 0.',
    '[{"id":"a","label":"x > 2"},{"id":"b","label":"x < 2"},{"id":"c","label":"x ≥ 2"},{"id":"d","label":"x ≤ 2"}]',
    'a',
    'Přičtením 6 dostaneme 3x > 6. Dělíme kladnou trojkou, takže znaménko zůstává: x > 2.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q6',
    'rovnice-nerovnice-zaklad-v1',
    6,
    'Vyřeš nerovnici -2x ≤ 8.',
    '[{"id":"a","label":"x ≤ -4"},{"id":"b","label":"x ≥ -4"},{"id":"c","label":"x ≤ 4"},{"id":"d","label":"x ≥ 4"}]',
    'b',
    'Při dělení záporným číslem se znaménko nerovnosti obrátí: x ≥ -4.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q7',
    'rovnice-nerovnice-zaklad-v1',
    7,
    'Vyřeš rovnici (x - 2)/(x + 1) = 0.',
    '[{"id":"a","label":"x = -1"},{"id":"b","label":"x = 0"},{"id":"c","label":"x = 2"},{"id":"d","label":"x = -1 nebo x = 2"}]',
    'c',
    'Zlomek je nulový, když je nulový čitatel a jmenovatel není nulový. Vyjde x = 2; hodnota x = -1 je zakázaná.',
    1
  ),
  (
    'rovnice-nerovnice-zaklad-v1-q8',
    'rovnice-nerovnice-zaklad-v1',
    8,
    'Vyřeš rovnici |x - 3| = 5.',
    '[{"id":"a","label":"x = 2 nebo x = 8"},{"id":"b","label":"x = -2 nebo x = 8"},{"id":"c","label":"x = -8 nebo x = 2"},{"id":"d","label":"x = 3 nebo x = 5"}]',
    'b',
    'Platí x - 3 = 5 nebo x - 3 = -5. Dostaneme x = 8 nebo x = -2.',
    1
  );
