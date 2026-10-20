PRAGMA foreign_keys = ON;

-- Calendar titles often use students' familiar first names while tutoring
-- identities retain full names. Map ONLY explicit, verified identities.
-- Normalized alias is globally unique to prevent accidental cross-student assignment.
CREATE TABLE IF NOT EXISTS tutoring_calendar_aliases (
  normalized_alias TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  tutoring_student_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutoring_student_id) REFERENCES tutoring_students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tutoring_calendar_alias_student
  ON tutoring_calendar_aliases(tutoring_student_id);

-- "Anna doučko" -> portal profile Anna, canonical tutoring identity Anička.
-- "Aleš doučování" -> Aleš Vyklický.
-- "Karolína - doučko 1. hodina" -> currently active Karolína Losová.
-- Karolína Lhotská is a DISTINCT inactive tutoring identity; do not map to her.
INSERT OR IGNORE INTO tutoring_calendar_aliases
  (normalized_alias, alias, tutoring_student_id)
SELECT 'anna', 'Anna', id FROM tutoring_students WHERE id = 'anicka' AND active = 1;

INSERT OR IGNORE INTO tutoring_calendar_aliases
  (normalized_alias, alias, tutoring_student_id)
SELECT 'ales', 'Aleš', id FROM tutoring_students WHERE id = 'ales' AND active = 1;

INSERT OR IGNORE INTO tutoring_calendar_aliases
  (normalized_alias, alias, tutoring_student_id)
SELECT 'karolina', 'Karolína', id FROM tutoring_students WHERE id = 'karolina' AND active = 1;
