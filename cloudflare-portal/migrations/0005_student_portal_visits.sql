PRAGMA foreign_keys = ON;

-- One row represents one student portal visit. Repeated profile loads within
-- 30 minutes update last_seen_at instead of creating another visit.
CREATE TABLE IF NOT EXISTS student_portal_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_portal_visits_student_started
  ON student_portal_visits(student_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_portal_visits_student_last_seen
  ON student_portal_visits(student_id, last_seen_at DESC);
