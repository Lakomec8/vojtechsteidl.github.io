PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS public_bookings (
  id TEXT PRIMARY KEY,
  confirmation_code TEXT NOT NULL UNIQUE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('diagnostic_30','lesson_60')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_bookings_range
ON public_bookings(starts_at, ends_at, status);

-- One row per occupied 15-minute interval makes overlapping concurrent
-- reservations fail atomically, including 30-minute versus 60-minute overlaps.
CREATE TABLE IF NOT EXISTS public_booking_locks (
  interval_start TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES public_bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_public_booking_locks_booking
ON public_booking_locks(booking_id);
