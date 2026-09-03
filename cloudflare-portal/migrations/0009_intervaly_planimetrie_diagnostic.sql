PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'intervaly-planimetrie-diagnostika-v1',
  'intervaly-planimetrie-diagnostika',
  1,
  'Intervaly, nerovnice a planimetrie — diagnostika',
  'Krátká diagnostika na intervaly, lineární nerovnice, soustavy, průnik a sjednocení a základní volbu i použití geometrických vztahů. Celkem 20 bodů.',
  'Matematika',
  'Intervaly, nerovnice a planimetrie',
  'SŠ',
  18,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'intervaly-planimetrie-v1-q1',
    'intervaly-planimetrie-diagnostika-v1',
    1,
    'Která dvojice zápisů je správná? I. Interval ⟨-2; 5) zapiš nerovností. II. Nerovnost x < 3 zapiš intervalem.',
    '[{"id":"a","label":"I. -2 ≤ x < 5; II. (-∞; 3)"},{"id":"b","label":"I. -2 < x ≤ 5; II. (-∞; 3⟩"},{"id":"c","label":"I. -2 ≤ x ≤ 5; II. ⟨3; ∞)"},{"id":"d","label":"I. -2 < x < 5; II. ⟨3; ∞)"}]',
    'a',
    'Levá hranice -2 do intervalu patří, proto -2 ≤ x. Hodnota 5 nepatří, proto x < 5. Pro x < 3 jsou všechna čísla menší než 3 a trojka sama do řešení nepatří: (-∞; 3).',
    2
  ),
  (
    'intervaly-planimetrie-v1-q2',
    'intervaly-planimetrie-diagnostika-v1',
    2,
    'Vyřeš nerovnici -3(2x - 1) ≤ 9 a vyber správný interval řešení.',
    '[{"id":"a","label":"(-∞; -1⟩"},{"id":"b","label":"⟨-1; ∞)"},{"id":"c","label":"(-1; ∞)"},{"id":"d","label":"(-∞; 1⟩"}]',
    'b',
    'Po roznásobení dostaneme -6x + 3 ≤ 9, tedy -6x ≤ 6. Při dělení záporným číslem se znaménko obrátí: x ≥ -1. Řešení je ⟨-1; ∞).',
    3
  ),
  (
    'intervaly-planimetrie-v1-q3',
    'intervaly-planimetrie-diagnostika-v1',
    3,
    'Vyřeš soustavu x > -2 a 2x + 1 ≤ 7. Který interval je jejím řešením?',
    '[{"id":"a","label":"(-∞; -2) ∪ ⟨3; ∞)"},{"id":"b","label":"⟨-2; 3⟩"},{"id":"c","label":"(-2; 3⟩"},{"id":"d","label":"(-2; 3)"}]',
    'c',
    'Druhá nerovnice dává 2x ≤ 6, tedy x ≤ 3. Soustava vyžaduje splnění obou podmínek současně: -2 < x ≤ 3, tedy (-2; 3⟩.',
    3
  ),
  (
    'intervaly-planimetrie-v1-q4',
    'intervaly-planimetrie-diagnostika-v1',
    4,
    'Je dáno A = (-3; 2⟩ a B = ⟨1; 5). Která dvojice A ∩ B a A ∪ B je správná?',
    '[{"id":"a","label":"A ∩ B = ⟨1; 2⟩; A ∪ B = (-3; 5)"},{"id":"b","label":"A ∩ B = (-3; 5); A ∪ B = ⟨1; 2⟩"},{"id":"c","label":"A ∩ B = (1; 2); A ∪ B = ⟨-3; 5⟩"},{"id":"d","label":"A ∩ B = ∅; A ∪ B = (-3; 2⟩ ∪ ⟨1; 5)"}]',
    'a',
    'Průnik obsahuje čísla, která jsou v obou intervalech: od 1 do 2 včetně. Intervaly se překrývají, takže sjednocení vytvoří souvislý interval od -3 do 5, bez obou krajních bodů.',
    2
  ),
  (
    'intervaly-planimetrie-v1-q5',
    'intervaly-planimetrie-diagnostika-v1',
    5,
    'Vyber správné pořadí metod pro situace: a) dvě odvěsny a hledaná přepona; b) dvě strany obecného trojúhelníku a úhel mezi nimi; c) jedna strana a dva úhly; d) všechny tři strany a hledaný obsah.',
    '[{"id":"a","label":"Pythagorova → kosinová → sinová → Heronův vzorec"},{"id":"b","label":"Kosinová → Pythagorova → Heronův → sinová"},{"id":"c","label":"Pythagorova → sinová → kosinová → Heronův vzorec"},{"id":"d","label":"Sinová → kosinová → Pythagorova → Heronův vzorec"}]',
    'a',
    'Pravoúhlý trojúhelník se dvěma odvěsnami vede na Pythagorovu větu. Dvě strany a sevřený úhel na kosinovou větu. Strana a známé úhly na sinovou větu. Tři strany a obsah na Heronův vzorec.',
    2
  ),
  (
    'intervaly-planimetrie-v1-q6',
    'intervaly-planimetrie-diagnostika-v1',
    6,
    'Pravoúhlý trojúhelník má odvěsny 6 cm a 8 cm. Jak dlouhá je přepona?',
    '[{"id":"a","label":"10 cm"},{"id":"b","label":"12 cm"},{"id":"c","label":"14 cm"},{"id":"d","label":"√14 cm"}]',
    'a',
    'Pythagorova věta: c² = 6² + 8² = 36 + 64 = 100, proto c = 10 cm.',
    2
  ),
  (
    'intervaly-planimetrie-v1-q7',
    'intervaly-planimetrie-diagnostika-v1',
    7,
    'V trojúhelníku jsou a = 5 cm, b = 8 cm a úhel mezi nimi γ = 60°. Urči stranu c.',
    '[{"id":"a","label":"5 cm"},{"id":"b","label":"7 cm"},{"id":"c","label":"9 cm"},{"id":"d","label":"13 cm"}]',
    'b',
    'Použijeme kosinovou větu: c² = a² + b² - 2ab cos γ = 25 + 64 - 80 · 1/2 = 49. Proto c = 7 cm.',
    2
  ),
  (
    'intervaly-planimetrie-v1-q8',
    'intervaly-planimetrie-diagnostika-v1',
    8,
    'V trojúhelníku platí a = 5 cm, α = 30° a β = 90°. Urči stranu b.',
    '[{"id":"a","label":"2,5 cm"},{"id":"b","label":"5 cm"},{"id":"c","label":"10 cm"},{"id":"d","label":"15 cm"}]',
    'c',
    'Ze sinové věty a/sin α = b/sin β. Tedy 5/sin 30° = b/sin 90°. Proto 5/0,5 = b a vyjde b = 10 cm.',
    2
  ),
  (
    'intervaly-planimetrie-v1-q9',
    'intervaly-planimetrie-diagnostika-v1',
    9,
    'Pravidelný šestiúhelník má stranu a = 4 cm. Která dvojice udává jeho obvod a obsah?',
    '[{"id":"a","label":"o = 24 cm; S = 24√3 cm²"},{"id":"b","label":"o = 20 cm; S = 16√3 cm²"},{"id":"c","label":"o = 24 cm; S = 48√3 cm²"},{"id":"d","label":"o = 16 cm; S = 24√3 cm²"}]',
    'a',
    'Obvod je 6a = 24 cm. Pravidelný šestiúhelník tvoří šest rovnostranných trojúhelníků. Jeden má obsah a²√3/4 = 4√3 cm², celkem tedy 24√3 cm².',
    2
  );

INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status)
SELECT 'intervaly-planimetrie-v1-' || s.id,
       s.id,
       'intervaly-planimetrie-diagnostika-v1',
       'active'
  FROM students s
 WHERE s.enabled = 1
   AND s.display_name IN ('Anička', 'Anicka', 'Anna');
