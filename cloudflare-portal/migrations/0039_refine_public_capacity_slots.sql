ALTER TABLE public_capacity_free_slots
ADD COLUMN display_mode TEXT NOT NULL DEFAULT 'timed';

UPDATE public_capacity_free_slots
   SET enabled = 0
 WHERE id = 'thu-1630';

INSERT INTO public_capacity_free_slots
  (id, weekday, start_time, end_time, capacity, enabled, sort_order, display_mode) VALUES
  ('tue-1515',2,'15:15','16:15',4,1,15,'timed'),
  ('tue-1630',2,'16:30','17:30',4,1,16,'timed'),
  ('thu-flex',4,'15:00','19:00',4,1,10,'flexible'),
  ('fri-1515',5,'15:15','16:15',4,1,20,'timed'),
  ('fri-1630',5,'16:30','17:30',4,1,30,'timed')
ON CONFLICT(id) DO UPDATE SET
  weekday=excluded.weekday,
  start_time=excluded.start_time,
  end_time=excluded.end_time,
  capacity=excluded.capacity,
  enabled=excluded.enabled,
  sort_order=excluded.sort_order,
  display_mode=excluded.display_mode;
