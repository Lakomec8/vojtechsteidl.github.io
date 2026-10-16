CREATE TABLE IF NOT EXISTS public_calendar_busy (
  calendar_event_id TEXT PRIMARY KEY,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  last_synced_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_calendar_busy_range
ON public_calendar_busy(starts_at, ends_at);
