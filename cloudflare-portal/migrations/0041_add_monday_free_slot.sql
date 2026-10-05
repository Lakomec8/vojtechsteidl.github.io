PRAGMA foreign_keys = ON;

-- Recurring public availability after the Monday CERMAT group.
INSERT INTO public_capacity_free_slots
  (id, weekday, start_time, end_time, capacity, enabled, sort_order, display_mode)
VALUES
  ('mon-1745',1,'17:45','18:45',4,1,20,'timed')
ON CONFLICT(id) DO UPDATE SET
  weekday=excluded.weekday,
  start_time=excluded.start_time,
  end_time=excluded.end_time,
  capacity=excluded.capacity,
  enabled=excluded.enabled,
  sort_order=excluded.sort_order,
  display_mode=excluded.display_mode;
