PRAGMA foreign_keys = ON;

-- Explicit assignment requested for the verified Eliška portal account.
-- Current production audit confirms today's Zlomky material for student eliska.
-- Other students receive this reusable diagnostic only via normal admin assignment.
INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status)
SELECT 'eliska-zlomky-zaklady-diagnostika-v1', id,
       'zlomky-zaklady-diagnostika-v1', 'active'
  FROM students
 WHERE id = 'eliska' AND display_name = 'Eliška' AND enabled = 1;
