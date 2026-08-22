PRAGMA foreign_keys = ON;

-- Administrators are explicit identities. An authenticated account that is
-- neither an enabled student nor an enabled administrator must never receive
-- administrator privileges by fallback.
CREATE TABLE IF NOT EXISTS portal_admins (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_admins_enabled
  ON portal_admins(enabled);
