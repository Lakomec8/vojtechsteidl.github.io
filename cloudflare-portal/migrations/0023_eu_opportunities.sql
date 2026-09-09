CREATE TABLE IF NOT EXISTS eu_opportunities (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_label TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL UNIQUE,
  programme TEXT,
  tags TEXT NOT NULL DEFAULT '',
  deadline_at TEXT,
  is_remote INTEGER NOT NULL DEFAULT 0 CHECK (is_remote IN (0, 1)),
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'applied', 'ignored')),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eu_opportunities_score
  ON eu_opportunities(score DESC, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_eu_opportunities_deadline
  ON eu_opportunities(deadline_at);

CREATE TABLE IF NOT EXISTS eu_opportunity_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at TEXT NOT NULL,
  status TEXT NOT NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  relevant_count INTEGER NOT NULL DEFAULT 0,
  new_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_eu_opportunity_runs_time
  ON eu_opportunity_runs(run_at DESC);
