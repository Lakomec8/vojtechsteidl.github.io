PRAGMA foreign_keys = ON;

UPDATE tutoring_sync_state
   SET last_synced_at = CURRENT_TIMESTAMP,
       completed_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'completed'),
       planned_events = (SELECT COUNT(*) FROM tutoring_calendar_events WHERE status = 'planned'),
       note = 'Automatické uzavírání lekcí aktivní; kontrola každých 15 minut.'
 WHERE id = 1;
