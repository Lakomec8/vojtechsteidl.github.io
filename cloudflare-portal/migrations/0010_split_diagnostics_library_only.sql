PRAGMA foreign_keys = ON;

-- Replace the previous combined diagnostic with two focused library tests.
-- No student assignment is created here; assignment remains an admin action.
UPDATE self_check_assignments
   SET status = 'archived', updated_at = CURRENT_TIMESTAMP
 WHERE test_id = 'intervaly-planimetrie-diagnostika-v1';

UPDATE self_check_tests
   SET status = 'archived', updated_at = CURRENT_TIMESTAMP
 WHERE id = 'intervaly-planimetrie-diagnostika-v1';

-- =========================================================
-- INTERVALY, NEROVNICE A SOUSTAVY
-- =========================================================
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'intervaly-nerovnice-soustavy-v1',
  'intervaly-nerovnice-soustavy',
  1,
  'Intervaly, nerovnice a soustavy — diagnostika',
  'Krátká diagnostika na zápis intervalů, lineární nerovnice, soustavy a průnik se sjednocením intervalů. Celkem 10 bodů.',
  'Matematika',
  'Intervaly, nerovnice a soustavy',
  'SŠ',
  10,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'intervaly-nerovnice-v1-q1',
    'intervaly-nerovnice-soustavy-v1',
    1,
    'Která dvojice zápisů je správná? I. Interval ⟨-2; 5) zapiš nerovností. II. Nerovnost x < 3 zapiš intervalem.',
    '[{"id":"a","label":"I. -2 ≤ x < 5; II. (-∞; 3)"},{"id":"b","label":"I. -2 < x ≤ 5; II. (-∞; 3⟩"},{"id":"c","label":"I. -2 ≤ x ≤ 5; II. ⟨3; ∞)"},{"id":"d","label":"I. -2 < x < 5; II. ⟨3; ∞)"}]',
    'a',
    'Levá hranice -2 do intervalu patří, proto -2 ≤ x. Hodnota 5 nepatří, proto x < 5. Pro x < 3 je řešení (-∞; 3).',
    2
  ),
  (
    'intervaly-nerovnice-v1-q2',
    'intervaly-nerovnice-soustavy-v1',
    2,
    'Vyřeš nerovnici -3(2x - 1) ≤ 9 a vyber správný interval řešení.',
    '[{"id":"a","label":"(-∞; -1⟩"},{"id":"b","label":"⟨-1; ∞)"},{"id":"c","label":"(-1; ∞)"},{"id":"d","label":"(-∞; 1⟩"}]',
    'b',
    'Po roznásobení: -6x + 3 ≤ 9, tedy -6x ≤ 6. Při dělení záporným číslem se znaménko obrátí: x ≥ -1.',
    3
  ),
  (
    'intervaly-nerovnice-v1-q3',
    'intervaly-nerovnice-soustavy-v1',
    3,
    'Vyřeš soustavu x > -2 a 2x + 1 ≤ 7. Který interval je jejím řešením?',
    '[{"id":"a","label":"(-∞; -2) ∪ ⟨3; ∞)"},{"id":"b","label":"⟨-2; 3⟩"},{"id":"c","label":"(-2; 3⟩"},{"id":"d","label":"(-2; 3)"}]',
    'c',
    'Druhá nerovnice dává x ≤ 3. Soustava vyžaduje splnění obou podmínek současně, tedy -2 < x ≤ 3.',
    3
  ),
  (
    'intervaly-nerovnice-v1-q4',
    'intervaly-nerovnice-soustavy-v1',
    4,
    'Je dáno A = (-3; 2⟩ a B = ⟨1; 5). Která dvojice A ∩ B a A ∪ B je správná?',
    '[{"id":"a","label":"A ∩ B = ⟨1; 2⟩; A ∪ B = (-3; 5)"},{"id":"b","label":"A ∩ B = (-3; 5); A ∪ B = ⟨1; 2⟩"},{"id":"c","label":"A ∩ B = (1; 2); A ∪ B = ⟨-3; 5⟩"},{"id":"d","label":"A ∩ B = ∅; A ∪ B = (-3; 2⟩ ∪ ⟨1; 5)"}]',
    'a',
    'Průnik obsahuje čísla společná oběma intervalům: ⟨1; 2⟩. Protože se intervaly překrývají, sjednocení je souvislé: (-3; 5).',
    2
  );

-- =========================================================
-- PLANIMETRIE
-- =========================================================
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'planimetrie-zakladni-vztahy-v1',
  'planimetrie-zakladni-vztahy',
  1,
  'Planimetrie — diagnostika',
  'Krátká diagnostika zaměřená na volbu správného vztahu a použití Pythagorovy, kosinové a sinové věty a na pravidelný mnohoúhelník. Celkem 10 bodů.',
  'Matematika',
  'Planimetrie',
  'SŠ',
  10,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'planimetrie-v1-q1',
    'planimetrie-zakladni-vztahy-v1',
    1,
    'Vyber správné pořadí metod pro situace: a) dvě odvěsny a hledaná přepona; b) dvě strany obecného trojúhelníku a úhel mezi nimi; c) jedna strana a dva úhly; d) všechny tři strany a hledaný obsah.',
    '[{"id":"a","label":"Pythagorova → kosinová → sinová → Heronův vzorec"},{"id":"b","label":"Kosinová → Pythagorova → Heronův → sinová"},{"id":"c","label":"Pythagorova → sinová → kosinová → Heronův vzorec"},{"id":"d","label":"Sinová → kosinová → Pythagorova → Heronův vzorec"}]',
    'a',
    'Dvě odvěsny vedou na Pythagorovu větu, dvě strany a sevřený úhel na kosinovou, strana a známé úhly na sinovou a tři strany s hledaným obsahem na Heronův vzorec.',
    2
  ),
  (
    'planimetrie-v1-q2',
    'planimetrie-zakladni-vztahy-v1',
    2,
    'Pravoúhlý trojúhelník má odvěsny 6 cm a 8 cm. Jak dlouhá je přepona?',
    '[{"id":"a","label":"10 cm"},{"id":"b","label":"12 cm"},{"id":"c","label":"14 cm"},{"id":"d","label":"√14 cm"}]',
    'a',
    'Pythagorova věta: c² = 6² + 8² = 100, proto c = 10 cm.',
    2
  ),
  (
    'planimetrie-v1-q3',
    'planimetrie-zakladni-vztahy-v1',
    3,
    'V trojúhelníku jsou a = 5 cm, b = 8 cm a úhel mezi nimi γ = 60°. Urči stranu c.',
    '[{"id":"a","label":"5 cm"},{"id":"b","label":"7 cm"},{"id":"c","label":"9 cm"},{"id":"d","label":"13 cm"}]',
    'b',
    'Kosinová věta: c² = a² + b² - 2ab cos γ = 25 + 64 - 80 · 1/2 = 49. Proto c = 7 cm.',
    2
  ),
  (
    'planimetrie-v1-q4',
    'planimetrie-zakladni-vztahy-v1',
    4,
    'V trojúhelníku platí a = 5 cm, α = 30° a β = 90°. Urči stranu b.',
    '[{"id":"a","label":"2,5 cm"},{"id":"b","label":"5 cm"},{"id":"c","label":"10 cm"},{"id":"d","label":"15 cm"}]',
    'c',
    'Ze sinové věty a/sin α = b/sin β. Tedy 5/0,5 = b/1, takže b = 10 cm.',
    2
  ),
  (
    'planimetrie-v1-q5',
    'planimetrie-zakladni-vztahy-v1',
    5,
    'Pravidelný šestiúhelník má stranu a = 4 cm. Která dvojice udává jeho obvod a obsah?',
    '[{"id":"a","label":"o = 24 cm; S = 24√3 cm²"},{"id":"b","label":"o = 20 cm; S = 16√3 cm²"},{"id":"c","label":"o = 24 cm; S = 48√3 cm²"},{"id":"d","label":"o = 16 cm; S = 24√3 cm²"}]',
    'a',
    'Obvod je 6a = 24 cm. Šestiúhelník tvoří šest rovnostranných trojúhelníků; jeden má obsah 4√3 cm², celkem 24√3 cm².',
    2
  );
