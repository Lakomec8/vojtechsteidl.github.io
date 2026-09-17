PRAGMA foreign_keys = ON;

-- Maturita diagnostic built from the previously prepared word-problem set.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'slovni-ulohy-maturita-v1',
  'slovni-ulohy-maturita',
  1,
  'Slovní úlohy — maturita',
  '[[calculator:Kalkulačka povolena]]Diagnostický test z maturitních slovních úloh: procenta, pohyb, práce, směsi, věk, geometrie, posloupnosti, ekonomické modelování, pravděpodobnost, nepřímá úměrnost a průměrná rychlost. Úlohy vycházejí ze sady zpracované pro maturitní přípravu. Celkem 24 bodů.',
  'Matematika',
  'Maturitní slovní úlohy',
  'SŠ / maturita',
  28,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'slovni-ulohy-maturita-v1-q1',
    'slovni-ulohy-maturita-v1',
    1,
    '{"instruction":"Zboží bylo nejprve zlevněno o 15 % a potom byla nová cena zvýšena o 10 %. Výsledná cena je 18 700 Kč. Jaká byla původní cena?","category":"Procenta","hint":"Po sobě jdoucí procentní změny se násobí: původní cena · 0,85 · 1,10."}',
    '[{"id":"a","label":"20 000 Kč"},{"id":"b","label":"19 700 Kč"},{"id":"c","label":"22 000 Kč"},{"id":"d","label":"18 500 Kč"}]',
    'a',
    'Označme původní cenu x. Platí x·0,85·1,10 = 18 700, tedy 0,935x = 18 700 a x = 20 000 Kč.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q2',
    'slovni-ulohy-maturita-v1',
    2,
    '{"instruction":"Města A a B jsou vzdálena 252 km. Z A vyjede v 8:00 auto rychlostí 72 km/h. Z B vyjede proti němu v 8:30 druhé auto rychlostí 84 km/h. Přibližně v kolik hodin se setkají?","category":"Pohyb","hint":"Do 8:30 ujede první vůz 36 km. Potom použij součet rychlostí obou vozů."}',
    '[{"id":"a","label":"9:53"},{"id":"b","label":"9:23"},{"id":"c","label":"10:08"},{"id":"d","label":"10:30"}]',
    'a',
    'V 8:30 zbývá mezi vozy 252 - 36 = 216 km. Přibližují se rychlostí 72 + 84 = 156 km/h, takže potřebují 216/156 ≈ 1,385 h, tedy asi 1 h 23 min. Setkají se přibližně v 9:53.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q3',
    'slovni-ulohy-maturita-v1',
    3,
    '{"instruction":"První pracovník zvládne zakázku sám za 12 hodin, druhý za 18 hodin. Pracují společně 3 hodiny a potom odejde pomalejší pracovník. Za jak dlouho od začátku bude zakázka hotová?","category":"Práce a výkon","hint":"Za 3 hodiny společně udělají 3/12 + 3/18 zakázky. Zbytek dokončí rychlejší pracovník."}',
    '[{"id":"a","label":"10 hodin"},{"id":"b","label":"8 hodin"},{"id":"c","label":"12 hodin"},{"id":"d","label":"9 hodin"}]',
    'a',
    'Společně za 3 h vykonají 1/4 + 1/6 = 5/12 práce. Zbývá 7/12. Rychlejší pracovník dělá 1/12 zakázky za hodinu, takže zbytek dokončí za 7 h. Celkem 3 + 7 = 10 h.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q4',
    'slovni-ulohy-maturita-v1',
    4,
    '{"instruction":"Máme 8 litrů 50% roztoku. Kolik litrů 20% roztoku musíme přidat, aby vznikl 32% roztok?","category":"Směsi","hint":"Porovnej množství čisté látky před smícháním a po smíchání."}',
    '[{"id":"a","label":"12 l"},{"id":"b","label":"8 l"},{"id":"c","label":"10 l"},{"id":"d","label":"16 l"}]',
    'a',
    'Pro x litrů 20% roztoku platí 0,50·8 + 0,20x = 0,32(8 + x). Tedy 4 + 0,2x = 2,56 + 0,32x, odkud x = 12 l.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q5',
    'slovni-ulohy-maturita-v1',
    5,
    '{"instruction":"Otec je dnes třikrát starší než syn. Za 12 let bude otec dvakrát tak starý jako syn. Kolik je jim dnes?","category":"Věk","hint":"Označ věk syna x a sestav rovnici pro situaci za 12 let."}',
    '[{"id":"a","label":"syn 12 let, otec 36 let"},{"id":"b","label":"syn 10 let, otec 30 let"},{"id":"c","label":"syn 14 let, otec 42 let"},{"id":"d","label":"syn 8 let, otec 24 let"}]',
    'a',
    'Syn má x a otec 3x let. Za 12 let: 3x + 12 = 2(x + 12). Odtud x = 12, takže syn má 12 a otec 36 let.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q6',
    'slovni-ulohy-maturita-v1',
    6,
    '{"instruction":"Obdélník má obsah 600 m² a jeho délka je o 10 m větší než šířka. Jaké jsou jeho rozměry?","category":"Geometrie a rovnice","hint":"Pro šířku x platí x(x + 10) = 600."}',
    '[{"id":"a","label":"20 m × 30 m"},{"id":"b","label":"15 m × 40 m"},{"id":"c","label":"24 m × 25 m"},{"id":"d","label":"10 m × 60 m"}]',
    'a',
    'Řešíme x² + 10x - 600 = 0. Kladný kořen je x = 20, druhý rozměr je 30 m.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q7',
    'slovni-ulohy-maturita-v1',
    7,
    '{"instruction":"Pozorovatel stojí 40 m od paty věže. Vrchol věže vidí pod výškovým úhlem 38° a oči má ve výšce 1,7 m. Jak vysoká je věž přibližně?","category":"Trigonometrie v praxi","hint":"Výškový rozdíl mezi očima a vrcholem je 40·tan 38°. Potom přičti 1,7 m."}',
    '[{"id":"a","label":"33,0 m"},{"id":"b","label":"31,3 m"},{"id":"c","label":"26,6 m"},{"id":"d","label":"41,7 m"}]',
    'a',
    'Výška nad úrovní očí je 40·tan 38° ≈ 31,25 m. Po přičtení 1,7 m dostaneme přibližně 32,95 m, tedy 33,0 m.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q8',
    'slovni-ulohy-maturita-v1',
    8,
    '{"instruction":"V prvním řádku sálu je 18 sedadel a v každém dalším řádku jsou o 2 sedadla více. Kolik sedadel je celkem v 15 řadách?","category":"Aritmetická posloupnost","hint":"Jde o součet prvních 15 členů aritmetické posloupnosti."}',
    '[{"id":"a","label":"480"},{"id":"b","label":"450"},{"id":"c","label":"510"},{"id":"d","label":"420"}]',
    'a',
    'Patnáctý člen je 18 + 14·2 = 46. Součet je S15 = 15·(18 + 46)/2 = 480.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q9',
    'slovni-ulohy-maturita-v1',
    9,
    '{"instruction":"Výrobek má variabilní náklad 180 Kč za kus, fixní náklady jsou 45 000 Kč a prodejní cena je 330 Kč za kus. Kolik kusů je třeba prodat, aby tržby právě pokryly všechny náklady?","category":"Náklady a tržby","hint":"Bod zvratu nastane, když 330x = 45 000 + 180x."}',
    '[{"id":"a","label":"300 kusů"},{"id":"b","label":"250 kusů"},{"id":"c","label":"400 kusů"},{"id":"d","label":"150 kusů"}]',
    'a',
    'Rovnost tržeb a nákladů dává 330x = 45 000 + 180x. Po odečtení 180x je 150x = 45 000, tedy x = 300.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q10',
    'slovni-ulohy-maturita-v1',
    10,
    '{"instruction":"V sáčku je 5 červených, 4 modré a 3 zelené kuličky. Náhodně vytáhneme dvě kuličky bez vracení. Jaká je pravděpodobnost, že budou stejné barvy?","category":"Pravděpodobnost","hint":"Sečti počty dvojic stejné barvy a vyděl počtem všech dvojic z 12 kuliček."}',
    '[{"id":"a","label":"19/66 ≈ 28,8 %"},{"id":"b","label":"19/72 ≈ 26,4 %"},{"id":"c","label":"12/66 ≈ 18,2 %"},{"id":"d","label":"31/66 ≈ 47,0 %"}]',
    'a',
    'Příznivých dvojic je C(5,2)+C(4,2)+C(3,2)=10+6+3=19. Všech dvojic je C(12,2)=66. Pravděpodobnost je 19/66 ≈ 28,8 %.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q11',
    'slovni-ulohy-maturita-v1',
    11,
    '{"instruction":"Šest stejných čerpadel vyčerpá nádrž za 10 hodin. Po 4 hodinách společné práce se dvě čerpadla porouchají. Za jak dlouho od začátku bude nádrž vyčerpaná?","category":"Nepřímá úměrnost a výkon","hint":"Celá práce odpovídá 6·10 = 60 čerpadlohodinám."}',
    '[{"id":"a","label":"13 hodin"},{"id":"b","label":"12 hodin"},{"id":"c","label":"15 hodin"},{"id":"d","label":"11 hodin"}]',
    'a',
    'Celkem je třeba 60 čerpadlohodin. Za první 4 h se vykoná 6·4 = 24, zbývá 36. Čtyři čerpadla potřebují 36/4 = 9 h. Celkem tedy 4 + 9 = 13 h.',
    2
  ),
  (
    'slovni-ulohy-maturita-v1-q12',
    'slovni-ulohy-maturita-v1',
    12,
    '{"instruction":"Cyklista ujede první polovinu trasy rychlostí 20 km/h a druhou polovinu rychlostí 30 km/h. Jaká je jeho průměrná rychlost za celou trasu?","category":"Průměrná rychlost","hint":"Poloviny trasy jsou stejně dlouhé, ne stejně dlouhé časově. Průměr proto není aritmetický průměr 20 a 30."}',
    '[{"id":"a","label":"24 km/h"},{"id":"b","label":"25 km/h"},{"id":"c","label":"22 km/h"},{"id":"d","label":"26 km/h"}]',
    'a',
    'Označme každou polovinu trasy délkou d. Celkový čas je d/20 + d/30 = d/12. Celková dráha je 2d, takže průměrná rychlost je 2d/(d/12) = 24 km/h.',
    2
  );
