CREATE TABLE IF NOT EXISTS tutoring_lead_drafts (
  lead_id TEXT PRIMARY KEY,
  draft_text TEXT NOT NULL,
  template_key TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES tutoring_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tutoring_lead_drafts_generated_at
  ON tutoring_lead_drafts(generated_at DESC);
