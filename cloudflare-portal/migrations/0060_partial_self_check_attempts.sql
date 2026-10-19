PRAGMA foreign_keys = ON;

-- Preserve the distinction between a finished diagnostic and a voluntarily
-- terminated one. For partial attempts, max_score counts only answered
-- questions; full_max_score retains the total available score for coverage.
-- Existing attempts are finished by default. Nullable counters indicate
-- historical rows that predate this feature.
ALTER TABLE self_check_attempts
  ADD COLUMN is_partial INTEGER NOT NULL DEFAULT 0 CHECK (is_partial IN (0, 1));

ALTER TABLE self_check_attempts
  ADD COLUMN answered_count INTEGER CHECK (answered_count IS NULL OR answered_count > 0);

ALTER TABLE self_check_attempts
  ADD COLUMN total_questions INTEGER CHECK (total_questions IS NULL OR total_questions > 0);

ALTER TABLE self_check_attempts
  ADD COLUMN full_max_score INTEGER CHECK (full_max_score IS NULL OR full_max_score > 0);

CREATE INDEX IF NOT EXISTS idx_self_check_attempts_student_finished
  ON self_check_attempts(student_id, is_partial, submitted_at DESC);
