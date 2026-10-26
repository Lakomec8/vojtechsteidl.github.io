-- Opportunity learning loop: funnel milestones + realized economics.
ALTER TABLE side_income_opportunities ADD COLUMN applied_at TEXT;
ALTER TABLE side_income_opportunities ADD COLUMN response_at TEXT;
ALTER TABLE side_income_opportunities ADD COLUMN interview_at TEXT;
ALTER TABLE side_income_opportunities ADD COLUMN won_at TEXT;
ALTER TABLE side_income_opportunities ADD COLUMN time_invested_hours REAL NOT NULL DEFAULT 0 CHECK (time_invested_hours >= 0);
ALTER TABLE side_income_opportunities ADD COLUMN realized_revenue_czk REAL NOT NULL DEFAULT 0 CHECK (realized_revenue_czk >= 0);
ALTER TABLE side_income_opportunities ADD COLUMN outcome_note TEXT;

CREATE INDEX IF NOT EXISTS idx_side_income_funnel
  ON side_income_opportunities(applied_at, response_at, interview_at, won_at);
