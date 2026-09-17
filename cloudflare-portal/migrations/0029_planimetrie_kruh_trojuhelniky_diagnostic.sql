PRAGMA foreign_keys = ON;

-- Diagnostic focused on circle planimetry through triangles, chords and angles.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'planimetrie-kruh-trojuhelniky-v1',
  'planimetrie-kruh-trojuhelniky',
  1,
  'Planimetrie v kruhu — trojúhelníky a tětivy',
  '[[calculator:Kalkulačka povolena]]Diagnostický test na pravoúhlé a rovnoramenné trojúhelníky v kružnici, tětivy, středové a obvodové úhly, oblouky a kruhové výseče. Důraz je na rozpoznání správného trojúhelníku a vztahu, ne na izolované memorování vzorců. Celkem 20 bodů.',
  'Matematika',
  'Planimetrie v kruhu',
  'SŠ',
  18,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'planimetrie-kruh-trojuhelniky-v1-q1',
    'planimetrie-kruh-trojuhelniky-v1',
    1,
    '{"instruction":"Středový úhel nad obloukem AB má velikost 100°. Jak velký je obvodový úhel nad stejným obloukem?","category":"Středový a obvodový úhel","hint":"Obvodový úhel nad stejným obloukem má poloviční velikost než středový."}',
    '[{"id":"a","label":"50°"},{"id":"b","label":"100°"},{"id":"c","label":"200°"},{"id":"d","label":"25°"}]',
    'a',
    'Pro stejný oblouk platí, že středový úhel je dvojnásobkem obvodového. Proto 100° / 2 = 50°.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q2',
    'planimetrie-kruh-trojuhelniky-v1',
    2,
    '{"instruction":"Body A a B jsou krajní body průměru kružnice a bod C leží na kružnici. Jaký je úhel ACB?","category":"Trojúhelník v kružnici","hint":"Použij Thaletovu větu."}',
    '[{"id":"a","label":"90°"},{"id":"b","label":"45°"},{"id":"c","label":"60°"},{"id":"d","label":"180°"}]',
    'a',
    'Podle Thaletovy věty je každý obvodový úhel nad průměrem pravý. Proto ∠ACB = 90°.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q3',
    'planimetrie-kruh-trojuhelniky-v1',
    3,
    '{"instruction":"Kružnice má poloměr 5 cm. Body A a B jsou krajní body průměru a bod C leží na kružnici. Je-li AC = 6 cm, jak dlouhá je BC?","category":"Pravoúhlý trojúhelník v kružnici","hint":"AB je průměr, tedy přepona pravoúhlého trojúhelníku ABC."}',
    '[{"id":"a","label":"8 cm"},{"id":"b","label":"4 cm"},{"id":"c","label":"10 cm"},{"id":"d","label":"√64 cm²"}]',
    'a',
    'Průměr AB má délku 10 cm a je přeponou. Z Pythagorovy věty: BC² = 10² - 6² = 64, tedy BC = 8 cm.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q4',
    'planimetrie-kruh-trojuhelniky-v1',
    4,
    '{"instruction":"V kružnici o poloměru 8 cm svírá tětiva AB ve středu úhel 60°. Jaká je délka tětivy AB?","category":"Tětiva a rovnoramenný trojúhelník","hint":"Spoj krajní body tětivy se středem. Vznikne rovnoramenný trojúhelník, který můžeš rozpůlit na dva pravoúhlé."}',
    '[{"id":"a","label":"8 cm"},{"id":"b","label":"4 cm"},{"id":"c","label":"8√3 cm"},{"id":"d","label":"16 cm"}]',
    'a',
    'Po rozpůlení rovnoramenného trojúhelníku je polovina tětivy 8·sin 30° = 4 cm. Celá tětiva má tedy 8 cm.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q5',
    'planimetrie-kruh-trojuhelniky-v1',
    5,
    '{"instruction":"Kružnice má poloměr 10 cm. Kolmá vzdálenost středu od tětivy je 6 cm. Jak dlouhá je tětiva?","category":"Tětiva a pravoúhlý trojúhelník","hint":"Kolmice ze středu půlí tětivu. Použij pravoúhlý trojúhelník s přeponou r."}',
    '[{"id":"a","label":"16 cm"},{"id":"b","label":"8 cm"},{"id":"c","label":"12 cm"},{"id":"d","label":"20 cm"}]',
    'a',
    'Polovina tětivy má délku √(10² - 6²) = √64 = 8 cm. Celá tětiva je tedy 16 cm.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q6',
    'planimetrie-kruh-trojuhelniky-v1',
    6,
    '{"instruction":"Tětiva kružnice o poloměru 10 cm má délku 12 cm. Jaká je vzdálenost středu kružnice od tětivy?","category":"Tětiva a pravoúhlý trojúhelník","hint":"Kolmice ze středu půlí tětivu, takže pracuj s polovinou délky 6 cm."}',
    '[{"id":"a","label":"8 cm"},{"id":"b","label":"6 cm"},{"id":"c","label":"4 cm"},{"id":"d","label":"√136 cm"}]',
    'a',
    'V pravoúhlém trojúhelníku je přepona 10 cm a jedna odvěsna 6 cm. Druhá odvěsna je √(100 - 36) = 8 cm.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q7',
    'planimetrie-kruh-trojuhelniky-v1',
    7,
    '{"instruction":"Kružnice má poloměr 6 cm a středový úhel 120°. Jaká je délka příslušného oblouku?","category":"Oblouk","hint":"Oblouk tvoří 120/360 celé kružnice."}',
    '[{"id":"a","label":"4π cm"},{"id":"b","label":"12π cm"},{"id":"c","label":"6π cm"},{"id":"d","label":"2π cm"}]',
    'a',
    'Délka oblouku je (120/360)·2π·6 = 4π cm.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q8',
    'planimetrie-kruh-trojuhelniky-v1',
    8,
    '{"instruction":"Kružnice má poloměr 6 cm a středový úhel 120°. Jaký je obsah příslušné kruhové výseče?","category":"Kruhová výseč","hint":"Výseč tvoří 120/360 obsahu celého kruhu."}',
    '[{"id":"a","label":"12π cm²"},{"id":"b","label":"24π cm²"},{"id":"c","label":"6π cm²"},{"id":"d","label":"36π cm²"}]',
    'a',
    'Obsah výseče je (120/360)·π·6² = 12π cm².',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q9',
    'planimetrie-kruh-trojuhelniky-v1',
    9,
    '{"instruction":"Obvodový úhel nad tětivou AB má velikost 35°. Jak velký je menší středový úhel AOB nad stejnou tětivou?","category":"Středový a obvodový úhel","hint":"Středový úhel nad stejným obloukem je dvojnásobný."}',
    '[{"id":"a","label":"70°"},{"id":"b","label":"35°"},{"id":"c","label":"145°"},{"id":"d","label":"17,5°"}]',
    'a',
    'Středový úhel nad stejným obloukem je dvojnásobkem obvodového, tedy 2·35° = 70°.',
    2
  ),
  (
    'planimetrie-kruh-trojuhelniky-v1-q10',
    'planimetrie-kruh-trojuhelniky-v1',
    10,
    '{"instruction":"V kružnici o poloměru 5 cm svírá tětiva AB ve středu pravý úhel. Která dvojice správně udává délku tětivy AB a obsah trojúhelníku AOB?","category":"Smíšená úloha","hint":"OA = OB = 5 cm a ∠AOB = 90°, takže AOB je pravoúhlý rovnoramenný trojúhelník."}',
    '[{"id":"a","label":"AB = 5√2 cm; S = 25/2 cm²"},{"id":"b","label":"AB = 10 cm; S = 25 cm²"},{"id":"c","label":"AB = 5 cm; S = 25/2 cm²"},{"id":"d","label":"AB = 5√2 cm; S = 25 cm²"}]',
    'a',
    'Trojúhelník AOB má odvěsny 5 cm a 5 cm. Proto AB = √(5² + 5²) = 5√2 cm a obsah je (5·5)/2 = 25/2 cm².',
    2
  );
