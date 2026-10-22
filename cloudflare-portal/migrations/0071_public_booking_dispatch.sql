-- Durable confirmation and calendar sync state; no secrets or private tokens are exposed.
ALTER TABLE public_bookings ADD COLUMN cancellation_token_hash TEXT;

CREATE TABLE IF NOT EXISTS public_booking_dispatch (
  booking_id TEXT PRIMARY KEY REFERENCES public_bookings(id) ON DELETE CASCADE,
  owner_create_state TEXT NOT NULL DEFAULT 'pending' CHECK(owner_create_state IN ('pending','sending','retry','sent')),
  google_create_state TEXT NOT NULL DEFAULT 'pending' CHECK(google_create_state IN ('pending','sending','retry','sent')),
  owner_cancel_state TEXT NOT NULL DEFAULT 'pending' CHECK(owner_cancel_state IN ('pending','sending','retry','sent')),
  google_cancel_state TEXT NOT NULL DEFAULT 'pending' CHECK(google_cancel_state IN ('pending','sending','retry','sent')),
  owner_create_attempted_at TEXT,
  google_create_attempted_at TEXT,
  owner_cancel_attempted_at TEXT,
  google_cancel_attempted_at TEXT,
  google_event_id TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_public_booking_dispatch_status ON public_booking_dispatch(updated_at);
