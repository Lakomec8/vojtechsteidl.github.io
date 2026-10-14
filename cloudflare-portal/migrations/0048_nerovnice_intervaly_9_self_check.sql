PRAGMA foreign_keys = ON;

-- Interaktivní self-check do knihovny testů pro nerovnice a intervaly v 9. třídě.
-- Pouze galerie; test se automaticky nepřiřazuje žádnému studentovi.
INSERT OR IGNORE INTO self_check_tests
  (id, slug, version, title, description, subject, topic, level, estimated_minutes, status)
VALUES
  ('nerovnice-intervaly-9-v1', 'nerovnice-intervaly-9', 1,
   'Nerovnice a intervaly — diagnostický self-check (9. třída)',
   '[[calculator:Bez kalkulačky]]12 úloh / 23 bodů / cca 20 minut. Procvičuje zápis řešení nerovnic pomocí intervalů, čtení krajních bodů, řešení lineárních a dvojitých nerovnic a sjednocení či průnik intervalů. U každé otázky vyber jednu odpověď; po vyhodnocení se zobrazí správné řešení a vysvětlení.',
   'Matematika', 'Nerovnice a intervaly', 'ZŠ / 9. třída', 20, 'published');

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  ('nerovnice-intervaly-9-v1-q1', 'nerovnice-intervaly-9-v1', 1,
   '{"instruction":"Která nerovnost odpovídá intervalu?","math":"(-3,2]","category":"Zápis intervalu","hint":"Kulatá závorka krajní bod nezahrnuje, hranatá závorka jej zahrnuje."}',
   '[{"id":"a","label":"[[math:-3\\leq x<2]]"},{"id":"b","label":"[[math:-3<x\\leq2]]"},{"id":"c","label":"[[math:-3<x<2]]"},{"id":"d","label":"[[math:-3\\leq x\\leq2]]"}]',
   'b', 'V intervalu [[math:(-3,2)]] číslo [[math:-3]] nepatří, ale [[math:2]] patří. Proto [[math:-3<x\\leq2]].', 1),

  ('nerovnice-intervaly-9-v1-q2', 'nerovnice-intervaly-9-v1', 2,
   '{"instruction":"Zapiš řešení nerovnice intervalem.","math":"x<5","category":"Zápis nerovnice intervalem","hint":"Pětka do řešení nepatří a interval pokračuje neomezeně doleva."}',
   '[{"id":"a","label":"[[math:(-\\infty,5)]]"},{"id":"b","label":"[[math:(-\\infty,5]]"},{"id":"c","label":"[[math:[5,\\infty)]]"},{"id":"d","label":"[[math:(5,\\infty)]]"}]',
   'a', 'Nerovnice [[math:x<5]] zahrnuje všechna čísla menší než 5, ale samotnou pětku ne. Řešením je [[math:(-\\infty,5)]].', 1),

  ('nerovnice-intervaly-9-v1-q3', 'nerovnice-intervaly-9-v1', 3,
   '{"instruction":"Který interval je řešením nerovnice?","math":"x\\geq-4","category":"Zápis nerovnice intervalem","hint":"Číslo −4 do řešení patří a řešení pokračuje doprava."}',
   '[{"id":"a","label":"[[math:(-\\infty,-4]]"},{"id":"b","label":"[[math:(-4,\\infty)]]"},{"id":"c","label":"[[math:[-4,\\infty)]]"},{"id":"d","label":"[[math:(-\\infty,-4)]]"}]',
   'c', 'Protože [[math:x\\geq-4]], číslo [[math:-4]] do řešení patří. Vpravo od něj jsou všechna větší čísla: [[math:[-4,\\infty)]].', 1),

  ('nerovnice-intervaly-9-v1-q4', 'nerovnice-intervaly-9-v1', 4,
   '{"instruction":"Který zápis správně popisuje interval?","math":"[1,4)","category":"Zápis intervalu","hint":"Hranatá závorka u 1 znamená, že 1 patří do intervalu; kulatá u 4 znamená, že 4 nepatří."}',
   '[{"id":"a","label":"[[math:1<x\\leq4]]"},{"id":"b","label":"[[math:1\\leq x<4]]"},{"id":"c","label":"[[math:1<x<4]]"},{"id":"d","label":"[[math:1\\leq x\\leq4]]"}]',
   'b', 'Interval [[math:[1,4)]] obsahuje 1, ale neobsahuje 4. Proto platí [[math:1\\leq x<4]].', 1),

  ('nerovnice-intervaly-9-v1-q5', 'nerovnice-intervaly-9-v1', 5,
   '{"instruction":"Které číslo patří do intervalu?","math":"[-2,3)","category":"Čtení intervalu","hint":"Levá krajní hodnota je zahrnuta a pravá krajní hodnota zahrnuta není."}',
   '[{"id":"a","label":"[[math:-2.5]]"},{"id":"b","label":"[[math:-2]]"},{"id":"c","label":"[[math:3]]"},{"id":"d","label":"[[math:4]]"}]',
   'b', 'Interval [[math:[-2,3)]] obsahuje hodnoty od [[math:-2]] včetně až po 3 bez trojky. Proto do něj patří [[math:-2]].', 1),

  ('nerovnice-intervaly-9-v1-q6', 'nerovnice-intervaly-9-v1', 6,
   '{"instruction":"Vyřeš nerovnici a zapiš její řešení intervalem.","math":"3x+5<17","category":"Lineární nerovnice","hint":"Nejprve odečti 5 a potom vyděl kladným číslem 3."}',
   '[{"id":"a","label":"[[math:(-\\infty,4)]]"},{"id":"b","label":"[[math:(-\\infty,4]]"},{"id":"c","label":"[[math:(4,\\infty)]]"},{"id":"d","label":"[[math:[4,\\infty)]]"}]',
   'a', 'Odečteme 5: [[math:3x<12]]. Vydělíme kladnou trojkou, takže směr nerovnosti zůstane: [[math:x<4]]. Řešením je [[math:(-\\infty,4)]].', 2),

  ('nerovnice-intervaly-9-v1-q7', 'nerovnice-intervaly-9-v1', 7,
   '{"instruction":"Vyřeš nerovnici a zapiš výsledek intervalem.","math":"-2x\\leq8","category":"Lineární nerovnice","hint":"Při dělení záporným číslem se znaménko nerovnosti obrací."}',
   '[{"id":"a","label":"[[math:(-\\infty,-4]]"},{"id":"b","label":"[[math:[-4,\\infty)]]"},{"id":"c","label":"[[math:(-4,\\infty)]]"},{"id":"d","label":"[[math:(-\\infty,4]]"}]',
   'b', 'Vydělíme obě strany číslem [[math:-2]]. Protože dělíme záporným číslem, obrátíme znaménko: [[math:x\\geq-4]]. Řešením je [[math:[-4,\\infty)]].', 2),

  ('nerovnice-intervaly-9-v1-q8', 'nerovnice-intervaly-9-v1', 8,
   '{"instruction":"Vyřeš nerovnici.","math":"5(x-1)\\leq2x+8","category":"Lineární nerovnice se závorkami","hint":"Rozevři závorku, převeď členy s x na jednu stranu a čísla na druhou."}',
   '[{"id":"a","label":"[[math:x\\leq\\frac{13}{3}]]"},{"id":"b","label":"[[math:x\\geq\\frac{13}{3}]]"},{"id":"c","label":"[[math:x\\leq-\\frac{13}{3}]]"},{"id":"d","label":"[[math:x\\geq-\\frac{13}{3}]]"}]',
   'a', 'Rozevřeme závorku: [[math:5x-5\\leq2x+8]]. Odečteme [[math:2x]] a přičteme 5: [[math:3x\\leq13]]. Dělíme kladnou trojkou, tedy [[math:x\\leq\\frac{13}{3}]].', 2),

  ('nerovnice-intervaly-9-v1-q9', 'nerovnice-intervaly-9-v1', 9,
   '{"instruction":"Vyřeš dvojitou nerovnici a zapiš řešení intervalem.","math":"-3<2x+1\\leq7","category":"Dvojitá nerovnice","hint":"Odečti 1 ve všech částech a potom vyděl kladnou dvojkou."}',
   '[{"id":"a","label":"[[math:(-2,3)]]"},{"id":"b","label":"[[math:[-2,3]]]"},{"id":"c","label":"[[math:(-2,3]]]"},{"id":"d","label":"[[math:[-2,3)]]"}]',
   'c', 'Odečteme 1: [[math:-4<2x\\leq6]]. Dělením kladnou dvojkou získáme [[math:-2<x\\leq3]], tedy interval [[math:(-2,3)]].', 3),

  ('nerovnice-intervaly-9-v1-q10', 'nerovnice-intervaly-9-v1', 10,
   '{"instruction":"Urči průnik intervalů.","math":"[-1,4)\\cap(2,6]","category":"Průnik intervalů","hint":"V průniku zůstávají jen čísla, která patří do obou intervalů současně."}',
   '[{"id":"a","label":"[[math:(2,4)]]"},{"id":"b","label":"[[math:[2,4)]]"},{"id":"c","label":"[[math:(-1,6]]"},{"id":"d","label":"[[math:[-1,6]]"}]',
   'a', 'Oba intervaly se překrývají mezi 2 a 4. Číslo 2 do druhého intervalu nepatří a číslo 4 do prvního nepatří, proto je průnik [[math:(2,4)]].', 2),

  ('nerovnice-intervaly-9-v1-q11', 'nerovnice-intervaly-9-v1', 11,
   '{"instruction":"Která nerovnost odpovídá sjednocení intervalů?","math":"(-\\infty,-2]\\cup[1,\\infty)","category":"Sjednocení intervalů","hint":"Sjednocení zahrnuje čísla z levé části nebo z pravé části."}',
   '[{"id":"a","label":"[[math:-2<x<1]]"},{"id":"b","label":"[[math:x\\leq-2\\text{ nebo }x\\geq1]]"},{"id":"c","label":"[[math:-2\\leq x\\leq1]]"},{"id":"d","label":"[[math:x\\leq-2\\text{ a }x\\geq1]]"}]',
   'b', 'Levá část obsahuje všechna čísla menší nebo rovna [[math:-2]], pravá část čísla větší nebo rovna [[math:1]]. Sjednocení proto odpovídá [[math:x\\leq-2]] nebo [[math:x\\geq1]].', 3),

  ('nerovnice-intervaly-9-v1-q12', 'nerovnice-intervaly-9-v1', 12,
   '{"instruction":"Vyřeš dvojitou nerovnici a zapiš řešení intervalem.","math":"-2\\leq\\frac{3x-1}{2}<4","category":"Dvojitá nerovnice","hint":"Vynásob všechny části kladnou dvojkou, potom přičti 1 a vyděl 3."}',
   '[{"id":"a","label":"[[math:[-1,3)]]"},{"id":"b","label":"[[math:(-1,3]]"},{"id":"c","label":"[[math:[-3,1)]]"},{"id":"d","label":"[[math:(-1,3)]]"}]',
   'a', 'Vynásobíme všechny části dvěma: [[math:-4\\leq3x-1<8]]. Přičteme 1: [[math:-3\\leq3x<9]]. Vydělíme kladnou trojkou: [[math:-1\\leq x<3]], tedy [[math:[-1,3)]].', 4);
