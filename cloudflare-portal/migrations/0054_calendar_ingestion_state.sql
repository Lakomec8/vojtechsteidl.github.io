-- Freshness belongs to the whole successful snapshot, not every busy row.
CREATE TABLE IF NOT EXISTS calendar_ingestion_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_synced_at TEXT NOT NULL
);

INSERT OR IGNORE INTO calendar_ingestion_state (id, last_synced_at)
SELECT 1, MAX(last_synced_at) FROM public_calendar_busy
HAVING MAX(last_synced_at) IS NOT NULL;
