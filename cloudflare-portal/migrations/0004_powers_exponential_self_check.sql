PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'mocniny-exponencialni-rovnice-v1',
  'mocniny-exponencialni-rovnice',
  1,
  'Mocniny a exponenciální rovnice — self-check',
  'Deset úloh od pravidel pro mocniny po exponenciální rovnice se společným základem. Test má váhu 20 studijních bodů.',
  'Matematika',
  'Mocniny a exponenciální rovnice',
  'SŠ',
  15,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'mocniny-exp-v1-q1',
    'mocniny-exponencialni-rovnice-v1',
    1,
    'Jaká je hodnota výrazu -2^4?',
    '[{"id":"a","label":"16"},{"id":"b","label":"-16"},{"id":"c","label":"8"},{"id":"d","label":"-8"}]',
    'b',
    'Exponent patří pouze k číslu 2: -2^4 = -(2^4) = -16. Závorky by význam změnily.',
    1
  ),
  (
    'mocniny-exp-v1-q2',
    'mocniny-exponencialni-rovnice-v1',
    2,
    'Zjednoduš x^7 · x^(-3).',
    '[{"id":"a","label":"x^10"},{"id":"b","label":"x^4"},{"id":"c","label":"x^(-21)"},{"id":"d","label":"x^(-4)"}]',
    'b',
    'Při násobení mocnin se stejným základem exponenty sčítáme: 7 + (-3) = 4.',
    1
  ),
  (
    'mocniny-exp-v1-q3',
    'mocniny-exponencialni-rovnice-v1',
    3,
    'Zjednoduš (a^3)^2.',
    '[{"id":"a","label":"a^5"},{"id":"b","label":"a^6"},{"id":"c","label":"a^9"},{"id":"d","label":"2a^3"}]',
    'b',
    'Při umocnění mocniny exponenty násobíme: 3 · 2 = 6.',
    1
  ),
  (
    'mocniny-exp-v1-q4',
    'mocniny-exponencialni-rovnice-v1',
    4,
    'Přepiš 2^(x+1) · 8 jako jedinou mocninu se základem 2.',
    '[{"id":"a","label":"2^(x+2)"},{"id":"b","label":"2^(x+3)"},{"id":"c","label":"2^(x+4)"},{"id":"d","label":"2^(3x+1)"}]',
    'c',
    'Platí 8 = 2^3. Proto 2^(x+1) · 2^3 = 2^(x+4).',
    2
  ),
  (
    'mocniny-exp-v1-q5',
    'mocniny-exponencialni-rovnice-v1',
    5,
    'Zjednoduš 9^n / 3^(2n-1).',
    '[{"id":"a","label":"1"},{"id":"b","label":"3"},{"id":"c","label":"3^n"},{"id":"d","label":"9"}]',
    'b',
    '9^n = 3^(2n). Po dělení dostaneme 3^(2n-(2n-1)) = 3^1 = 3.',
    2
  ),
  (
    'mocniny-exp-v1-q6',
    'mocniny-exponencialni-rovnice-v1',
    6,
    'Vyjádři 0,2 · 5^n jako jedinou mocninu se základem 5.',
    '[{"id":"a","label":"5^(n+1)"},{"id":"b","label":"5^(n-1)"},{"id":"c","label":"5^(1-n)"},{"id":"d","label":"5^n"}]',
    'b',
    '0,2 = 1/5 = 5^(-1). Proto 5^(-1) · 5^n = 5^(n-1).',
    2
  ),
  (
    'mocniny-exp-v1-q7',
    'mocniny-exponencialni-rovnice-v1',
    7,
    'Vyřeš rovnici 2^(x+1) = 16.',
    '[{"id":"a","label":"x = 2"},{"id":"b","label":"x = 3"},{"id":"c","label":"x = 4"},{"id":"d","label":"x = 5"}]',
    'b',
    '16 = 2^4. Porovnáme exponenty: x + 1 = 4, tedy x = 3.',
    2
  ),
  (
    'mocniny-exp-v1-q8',
    'mocniny-exponencialni-rovnice-v1',
    8,
    'Vyřeš rovnici 4^x = 2^(x+3).',
    '[{"id":"a","label":"x = 1"},{"id":"b","label":"x = 2"},{"id":"c","label":"x = 3"},{"id":"d","label":"x = 4"}]',
    'c',
    '4^x = (2^2)^x = 2^(2x). Proto 2x = x + 3 a vyjde x = 3.',
    3
  ),
  (
    'mocniny-exp-v1-q9',
    'mocniny-exponencialni-rovnice-v1',
    9,
    'Vyřeš rovnici (1/2)^(2x-1) = 8.',
    '[{"id":"a","label":"x = -1"},{"id":"b","label":"x = 0"},{"id":"c","label":"x = 1"},{"id":"d","label":"x = 2"}]',
    'a',
    '(1/2)^(2x-1) = 2^(-2x+1) a 8 = 2^3. Tedy -2x + 1 = 3, takže x = -1.',
    3
  ),
  (
    'mocniny-exp-v1-q10',
    'mocniny-exponencialni-rovnice-v1',
    10,
    'Vyřeš rovnici 8^(x-1) = 4^(x+1).',
    '[{"id":"a","label":"x = 2"},{"id":"b","label":"x = 3"},{"id":"c","label":"x = 4"},{"id":"d","label":"x = 5"}]',
    'd',
    'Převedeme na základ 2: 2^(3x-3) = 2^(2x+2). Porovnáme exponenty: 3x - 3 = 2x + 2, tedy x = 5.',
    3
  );

INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status)
SELECT 'mocniny-exp-v1-' || s.id,
       s.id,
       'mocniny-exponencialni-rovnice-v1',
       'active'
  FROM students s
 WHERE s.enabled = 1
   AND s.display_name IN ('Anička', 'Anna', 'Natálie', 'Natalie');
