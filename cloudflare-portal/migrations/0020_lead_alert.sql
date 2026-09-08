CREATE TABLE IF NOT EXISTS tutoring_leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT,
  is_online INTEGER NOT NULL DEFAULT 0 CHECK (is_online IN (0, 1)),
  subject TEXT NOT NULL DEFAULT '',
  published_label TEXT,
  source_url TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'replied', 'won', 'lost', 'ignored')),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  alerted_at TEXT,
  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_tutoring_leads_score_seen
  ON tutoring_leads(score DESC, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_tutoring_leads_status
  ON tutoring_leads(status, first_seen_at DESC);

CREATE TABLE IF NOT EXISTS tutoring_lead_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  run_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  fetched_count INTEGER NOT NULL DEFAULT 0,
  new_count INTEGER NOT NULL DEFAULT 0,
  relevant_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_tutoring_lead_runs_source_time
  ON tutoring_lead_runs(source, run_at DESC);
