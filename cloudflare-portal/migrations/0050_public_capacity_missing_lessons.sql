-- One-off events must be registered as public anonymized categories.
-- Keep private names out of this table; the source titles remain in Google Calendar.
-- Future tutoring events are auto-registered by calendar-ingestion.ts.
INSERT INTO public_capacity_series
  (series_id, public_label, capacity, fallback_people, enabled, sort_order)
VALUES
  ('2s1sao5n9a1b30ki2a463qj999', 'Úvodní konzultace', 1, 1, 1, 75),
  ('7feha3tiugdudsjdurtjlkkkks', 'Matematika', 4, 1, 1, 80),
  ('2b2suvsjh6e68sm04jh3ucavld', 'Fyzika', 4, 1, 1, 90)
ON CONFLICT(series_id) DO UPDATE SET
  public_label=excluded.public_label,
  capacity=excluded.capacity,
  fallback_people=excluded.fallback_people,
  enabled=excluded.enabled,
  sort_order=excluded.sort_order;
