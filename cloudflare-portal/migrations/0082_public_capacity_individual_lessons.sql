-- Prevent individual sessions being advertised as groups with free seats.
-- Preserve explicit CERMAT groups with genuine shared capacity.
UPDATE public_capacity_series
   SET capacity = 1
 WHERE enabled = 1
   AND capacity > 1
   AND public_label IN ('Matematika', 'Fyzika', 'VŠ matematika',
                        '2. ročník SŠ', 'Příprava na maturitu',
                        '9. ročník · AJ kurikulum', 'Úvodní konzultace')
   AND series_id NOT IN ('08v4aeq1mfj4ul4lg4n89i3uve', 'u0124hlk9ov2hihg0sqebum8g8');
