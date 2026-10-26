PRAGMA foreign_keys = ON;

-- A regenerated PDF may already exist under the same R2 object key.
-- Safely keep the first (latest) entry per resource and preserve any
-- other study materials, while keeping the existing metadata intact.
UPDATE student_profiles
SET payload_json = json_set(
  payload_json,
  '$.materials',
  json((
    SELECT COALESCE(json_group_array(json(value)), '[]')
    FROM (
      SELECT value
      FROM (
        SELECT
          je.value AS value,
          CAST(je.key AS INTEGER) AS original_position,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
              json_extract(je.value, '$.r2Key'),
              json_extract(je.value, '$.url'),
              'unique-material-index:' || je.key
            )
            ORDER BY CAST(je.key AS INTEGER)
          ) AS duplicate_rank
        FROM json_each(student_profiles.payload_json, '$.materials') AS je
      )
      WHERE duplicate_rank = 1
      ORDER BY original_position
    )
  ))
),
updated_at = CURRENT_TIMESTAMP
WHERE student_id = 'simon'
  AND json_type(payload_json, '$.materials') = 'array';
