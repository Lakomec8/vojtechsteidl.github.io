PRAGMA foreign_keys = ON;

-- Diagnostic focused exclusively on translating word problems into equations.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'slovni-ulohy-rovnice-v1',
  'slovni-ulohy-rovnice',
  1,
  'Slovní úlohy — sestavení rovnice',
  'Diagnostický test zaměřený na převod textového zadání do rovnice: volba neznámé, vyjádření vztahů, změna stavu, věk a peníze. Celkem 20 bodů.',
  'Matematika',
  'Slovní úlohy a rovnice',
  '8.–9. třída',
  15,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'slovni-ulohy-rovnice-v1-q1',
    'slovni-ulohy-rovnice-v1',
    1,
    'Myslím si číslo. Když jeho trojnásobek zvětším o 7, dostanu 40. Která rovnice správně odpovídá zadání?',
    '[{"id":"a","label":"3x + 7 = 40"},{"id":"b","label":"3(x + 7) = 40"},{"id":"c","label":"x + 3 + 7 = 40"},{"id":"d","label":"3x = 40 + 7"}]',
    'a',
    'Neznámé číslo označíme x. Jeho trojnásobek je 3x a po zvětšení o 7 dostaneme 3x + 7. Podle zadání je tato hodnota 40.',
    2
  ),
  (
    'slovni-ulohy-rovnice-v1-q2',
    'slovni-ulohy-rovnice-v1',
    2,
    'Součet dvou čísel je 68. Větší číslo je o 12 větší než menší. Pokud menší číslo označíme x, která rovnice je správná?',
    '[{"id":"a","label":"x + 12 = 68"},{"id":"b","label":"x + 12x = 68"},{"id":"c","label":"x + (x + 12) = 68"},{"id":"d","label":"2x + 68 = 12"}]',
    'c',
    'Menší číslo je x a větší x + 12. Jejich součet je 68, proto x + (x + 12) = 68.',
    2
  ),
  (
    'slovni-ulohy-rovnice-v1-q3',
    'slovni-ulohy-rovnice-v1',
    3,
    'Matce je třikrát tolik let jako dceři a dohromady je jim 48 let. Pokud věk dcery označíme x, která rovnice popisuje zadání?',
    '[{"id":"a","label":"x + 3 = 48"},{"id":"b","label":"x + 3x = 48"},{"id":"c","label":"3(x + x) = 48"},{"id":"d","label":"3x - x = 48"}]',
    'b',
    'Dcera má x let a matka 3x let. Součet jejich věků je 48, tedy x + 3x = 48.',
    2
  ),
  (
    'slovni-ulohy-rovnice-v1-q4',
    'slovni-ulohy-rovnice-v1',
    4,
    'Petrovi je dnes o 8 let více než Adamovi. Za 4 roky bude součet jejich věků 40 let. Adamův dnešní věk označíme x. Která rovnice je správná?',
    '[{"id":"a","label":"x + (x + 8) = 40"},{"id":"b","label":"(x + 4) + (x + 8 + 4) = 40"},{"id":"c","label":"(x + 8) + 4 = 40"},{"id":"d","label":"4x + (4x + 8) = 40"}]',
    'b',
    'Dnes má Adam x a Petr x + 8. Za čtyři roky budou mít x + 4 a x + 12. Jejich tehdejší součet je 40.',
    3
  ),
  (
    'slovni-ulohy-rovnice-v1-q5',
    'slovni-ulohy-rovnice-v1',
    5,
    'Adam má o 160 Kč více než Kryštof. Adam dá Kryštofovi 40 Kč a potom má 1,5násobek Kryštofových peněz. Kryštofovy původní peníze označíme x. Která rovnice je správná?',
    '[{"id":"a","label":"x + 160 = 1,5x + 40"},{"id":"b","label":"x + 120 = 1,5(x + 40)"},{"id":"c","label":"x + 200 = 1,5(x - 40)"},{"id":"d","label":"x + 160 - 40 = 1,5x - 40"}]',
    'b',
    'Adam původně má x + 160. Po předání 40 Kč má x + 120. Kryštof má po přijetí peněz x + 40. Proto x + 120 = 1,5(x + 40).',
    3
  ),
  (
    'slovni-ulohy-rovnice-v1-q6',
    'slovni-ulohy-rovnice-v1',
    6,
    'Dvojnásobek neznámého čísla zvětšený o 15 má stejnou hodnotu jako trojnásobek tohoto čísla zmenšený o 7. Která rovnice odpovídá textu?',
    '[{"id":"a","label":"2(x + 15) = 3(x - 7)"},{"id":"b","label":"2x + 15 = 3x - 7"},{"id":"c","label":"2x - 15 = 3x + 7"},{"id":"d","label":"2x + 3x = 15 - 7"}]',
    'b',
    'První popis je 2x + 15, druhý 3x - 7. Slovní spojení „má stejnou hodnotu jako“ vytváří rovnítko.',
    2
  ),
  (
    'slovni-ulohy-rovnice-v1-q7',
    'slovni-ulohy-rovnice-v1',
    7,
    'V první krabici je o 20 kuliček více než ve druhé. Z první přesuneme 5 kuliček do druhé a potom je v první 1,5násobek počtu kuliček ve druhé. Pokud původní počet ve druhé krabici označíme x, která rovnice je správná?',
    '[{"id":"a","label":"x + 20 - 5 = 1,5(x + 5)"},{"id":"b","label":"x + 20 + 5 = 1,5(x - 5)"},{"id":"c","label":"x + 15 = 1,5x + 5"},{"id":"d","label":"x + 20 = 1,5x"}]',
    'a',
    'První krabice má původně x + 20 a po odebrání pěti x + 15. Druhá má původně x a po přidání pěti x + 5. Proto x + 20 - 5 = 1,5(x + 5).',
    3
  ),
  (
    'slovni-ulohy-rovnice-v1-q8',
    'slovni-ulohy-rovnice-v1',
    8,
    'Třetina neznámého čísla zvětšená o 8 je rovna polovině tohoto čísla zmenšené o 2. Která rovnice i výsledná hodnota x jsou správně?',
    '[{"id":"a","label":"x/3 + 8 = x/2 - 2; x = 60"},{"id":"b","label":"(x + 8)/3 = (x - 2)/2; x = 10"},{"id":"c","label":"x/3 - 8 = x/2 + 2; x = -60"},{"id":"d","label":"3x + 8 = 2x - 2; x = -10"}]',
    'a',
    'Text dává rovnici x/3 + 8 = x/2 - 2. Po vynásobení šesti: 2x + 48 = 3x - 12, tedy x = 60.',
    3
  );
