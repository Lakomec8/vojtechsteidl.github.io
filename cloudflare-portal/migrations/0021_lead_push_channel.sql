CREATE TABLE IF NOT EXISTS tutoring_lead_push_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  topic TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  last_test_at TEXT
);
