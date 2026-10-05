CREATE TABLE IF NOT EXISTS public_capacity_series (
  series_id TEXT PRIMARY KEY,
  public_label TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity BETWEEN 1 AND 12),
  fallback_people INTEGER NOT NULL DEFAULT 1 CHECK (fallback_people BETWEEN 0 AND 12),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public_capacity_series
  (series_id, public_label, capacity, fallback_people, enabled, sort_order) VALUES
  ('08v4aeq1mfj4ul4lg4n89i3uve','CERMAT přijímačky',4,2,1,10),
  ('4bidql922u6vd6bmajcs73jbhr','VŠ matematika',4,1,1,20),
  ('u0124hlk9ov2hihg0sqebum8g8','CERMAT přijímačky',4,1,1,30),
  ('0uon2ms175g3mbjat55jbatr9g','2. ročník SŠ',4,1,1,40),
  ('33ueo9id4khrci7g8icc2l4o1p','Příprava na maturitu',4,1,1,50),
  ('72g71jf87k79vm1nqqu218maav','9. ročník · AJ kurikulum',4,1,1,60),
  ('55nbk16cc74ij93lneutj2uflt','VŠ matematika',4,1,1,70)
ON CONFLICT(series_id) DO UPDATE SET
  public_label=excluded.public_label,
  capacity=excluded.capacity,
  fallback_people=excluded.fallback_people,
  enabled=excluded.enabled,
  sort_order=excluded.sort_order;

CREATE TABLE IF NOT EXISTS public_capacity_events (
  series_id TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (series_id, starts_at),
  FOREIGN KEY (series_id) REFERENCES public_capacity_series(series_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_public_capacity_events_start
ON public_capacity_events(starts_at, series_id);

CREATE TABLE IF NOT EXISTS public_capacity_free_slots (
  id TEXT PRIMARY KEY,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 5),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity BETWEEN 1 AND 12),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public_capacity_free_slots
  (id, weekday, start_time, end_time, capacity, enabled, sort_order) VALUES
  ('thu-1630',4,'16:30','17:30',4,1,10),
  ('fri-1515',5,'15:15','16:15',4,1,20),
  ('fri-1630',5,'16:30','17:30',4,1,30)
ON CONFLICT(id) DO UPDATE SET
  weekday=excluded.weekday,
  start_time=excluded.start_time,
  end_time=excluded.end_time,
  capacity=excluded.capacity,
  enabled=excluded.enabled,
  sort_order=excluded.sort_order;
