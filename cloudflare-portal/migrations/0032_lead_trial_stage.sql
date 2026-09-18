PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tutoring_lead_trials (
  lead_id TEXT PRIMARY KEY,
  prospect_label TEXT,
  scheduled_week TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','converted','not_converted','cancelled')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES tutoring_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tutoring_lead_trials_status
  ON tutoring_lead_trials(status, scheduled_week);

-- Jakub: intenzivní příprava na OSP. Zkušební hodina je domluvená na týden od 21. 9. 2026.
INSERT OR IGNORE INTO tutoring_lead_trials (lead_id, prospect_label, scheduled_week, status, note)
SELECT id, 'Jakub', '2026-09-21', 'scheduled',
       'Zkušební hodina domluvená; o pokračování se rozhodne po první lekci.'
  FROM tutoring_leads
 WHERE source = 'doucuji'
   AND (instr(lower(title), 'osp') > 0 OR instr(lower(description), 'osp') > 0)
 ORDER BY datetime(first_seen_at) DESC
 LIMIT 1;

-- Elen: matematika v angličtině. Stejný mezistupeň funnelu.
INSERT OR IGNORE INTO tutoring_lead_trials (lead_id, prospect_label, scheduled_week, status, note)
SELECT id, 'Elen', '2026-09-21', 'scheduled',
       'Zkušební hodina domluvená; o pokračování se rozhodne po první lekci.'
  FROM tutoring_leads
 WHERE source = 'doucuji'
   AND (
        instr(description, 'anglič') > 0
        OR instr(description, 'anglick') > 0
        OR instr(lower(description), 'english') > 0
        OR instr(title, 'anglič') > 0
        OR instr(title, 'anglick') > 0
        OR instr(lower(title), 'english') > 0
   )
   AND id NOT IN (SELECT lead_id FROM tutoring_lead_trials)
 ORDER BY datetime(first_seen_at) DESC
 LIMIT 1;

UPDATE tutoring_leads
   SET status = 'replied'
 WHERE id IN (SELECT lead_id FROM tutoring_lead_trials WHERE status = 'scheduled')
   AND status IN ('new','reviewed');
