PRAGMA foreign_keys = ON;

-- Rozsáhlý interaktivní self-check pro ověřený účet eliska.
-- Starší přiřazení zůstává zachované v historii; nástěnka sama zobrazuje jen nejnovější přiřazení.
INSERT OR IGNORE INTO self_check_tests
  (id, slug, version, title, description, subject, topic, level, estimated_minutes, status)
VALUES
  ('zlomky-kraceni-jednotky-v2', 'zlomky-kraceni-jednotky', 2,
   'Zlomky, krácení a převody jednotek - rozsáhlý self-check',
   '[[calculator:Bez kalkulačky]]50 úloh / 69 bodů / přibližně 45-60 minut. Od významu zlomku a rozkladu na činitele přes krácení a rozšiřování až k převodům délky a hmotnosti ve zlomcích. Po odeslání se zobrazí správné odpovědi, stručná vysvětlení a výsledky po oblastech; test můžeš opakovat.',
   'Matematika', 'Zlomky a jednotky', 'ZŠ / základy SŠ', 55, 'published');

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  ('zlomky-kraceni-jednotky-v2-q01', 'zlomky-kraceni-jednotky-v2', 1,
   '{"instruction":"Co udává jmenovatel zlomku?","math":"\\frac{3}{8}","category":"Význam zlomku","hint":"Jmenovatel je číslo pod zlomkovou čarou."}',
   '[{"id":"a","label":"Počet vybraných částí."},{"id":"b","label":"Počet stejných částí, na které je rozdělen celek."},{"id":"c","label":"Výsledek sčítání 3 + 8."},{"id":"d","label":"Počet celků."}]',
   'b', 'Jmenovatel 8 říká, že celek je rozdělen na 8 stejně velkých částí.', 1),

  ('zlomky-kraceni-jednotky-v2-q02', 'zlomky-kraceni-jednotky-v2', 2,
   '{"instruction":"Který zápis nemá smysl?","math":"","category":"Význam zlomku","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{0}{7}]]"},{"id":"b","label":"[[math:\\frac{7}{1}]]"},{"id":"c","label":"[[math:\\frac{4}{0}]]"},{"id":"d","label":"[[math:\\frac{1}{4}]]"}]',
   'c', 'Jmenovatel nesmí být nula, protože nulou nelze dělit.', 1),

  ('zlomky-kraceni-jednotky-v2-q03', 'zlomky-kraceni-jednotky-v2', 3,
   '{"instruction":"Který zlomek je roven jedné polovině?","math":"\\frac{1}{2}","category":"Význam zlomku","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{2}{3}]]"},{"id":"b","label":"[[math:\\frac{3}{6}]]"},{"id":"c","label":"[[math:\\frac{4}{6}]]"},{"id":"d","label":"[[math:\\frac{5}{8}]]"}]',
   'b', 'Zlomek [[math:\frac{3}{6}]] zkrátíme třemi na [[math:\frac{1}{2}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q04', 'zlomky-kraceni-jednotky-v2', 4,
   '{"instruction":"Který zlomek je už v základním tvaru?","math":"","category":"Význam zlomku","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{6}{9}]]"},{"id":"b","label":"[[math:\\frac{8}{12}]]"},{"id":"c","label":"[[math:\\frac{7}{12}]]"},{"id":"d","label":"[[math:\\frac{15}{25}]]"}]',
   'c', 'Čísla 7 a 12 nemají společného dělitele většího než 1.', 1),

  ('zlomky-kraceni-jednotky-v2-q05', 'zlomky-kraceni-jednotky-v2', 5,
   '{"instruction":"Který zlomek je větší než 1?","math":"","category":"Význam zlomku","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{5}{8}]]"},{"id":"b","label":"[[math:\\frac{7}{7}]]"},{"id":"c","label":"[[math:\\frac{9}{7}]]"},{"id":"d","label":"[[math:\\frac{3}{4}]]"}]',
   'c', 'Je-li čitatel větší než jmenovatel, kladný zlomek je větší než 1.', 1),

  ('zlomky-kraceni-jednotky-v2-q06', 'zlomky-kraceni-jednotky-v2', 6,
   '{"instruction":"Které číslo je prvočíslo?","math":"","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"21"},{"id":"b","label":"29"},{"id":"c","label":"33"},{"id":"d","label":"39"}]',
   'b', 'Číslo 29 má jen dělitele 1 a 29.', 1),

  ('zlomky-kraceni-jednotky-v2-q07', 'zlomky-kraceni-jednotky-v2', 7,
   '{"instruction":"Které číslo je dělitelné třemi?","math":"","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"124"},{"id":"b","label":"215"},{"id":"c","label":"372"},{"id":"d","label":"451"}]',
   'c', 'Ciferný součet 3 + 7 + 2 = 12 je dělitelný třemi.', 1),

  ('zlomky-kraceni-jednotky-v2-q08', 'zlomky-kraceni-jednotky-v2', 8,
   '{"instruction":"Který rozklad čísla 24 je správný?","math":"","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"[[math:2\\cdot2\\cdot2\\cdot3]]"},{"id":"b","label":"[[math:2\\cdot3\\cdot5]]"},{"id":"c","label":"[[math:3\\cdot3\\cdot3]]"},{"id":"d","label":"[[math:2\\cdot2\\cdot7]]"}]',
   'a', '[[math:24=2^3\cdot3]].', 1),

  ('zlomky-kraceni-jednotky-v2-q09', 'zlomky-kraceni-jednotky-v2', 9,
   '{"instruction":"Který rozklad čísla 45 na prvočinitele je správný?","math":"","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"[[math:3\\cdot3\\cdot5]]"},{"id":"b","label":"[[math:3\\cdot5\\cdot5]]"},{"id":"c","label":"[[math:2\\cdot3\\cdot5]]"},{"id":"d","label":"[[math:5\\cdot9]]"}]',
   'a', 'Prvočíselný rozklad je [[math:45=3^2\cdot5]].', 1),

  ('zlomky-kraceni-jednotky-v2-q10', 'zlomky-kraceni-jednotky-v2', 10,
   '{"instruction":"Urči největší společný dělitel.","math":"\\operatorname{NSD}(18,24)","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"2"},{"id":"b","label":"3"},{"id":"c","label":"6"},{"id":"d","label":"12"}]',
   'c', 'Společní dělitelé jsou 1, 2, 3 a 6; největší je 6.', 1),

  ('zlomky-kraceni-jednotky-v2-q11', 'zlomky-kraceni-jednotky-v2', 11,
   '{"instruction":"Urči největší společný dělitel.","math":"\\operatorname{NSD}(42,63)","category":"Dělitelnost a činitelé","hint":"Rozlož obě čísla na prvočinitele."}',
   '[{"id":"a","label":"3"},{"id":"b","label":"7"},{"id":"c","label":"14"},{"id":"d","label":"21"}]',
   'd', '[[math:42=2\cdot3\cdot7]] a [[math:63=3^2\cdot7]], takže společná část je [[math:3\cdot7=21]].', 2),

  ('zlomky-kraceni-jednotky-v2-q12', 'zlomky-kraceni-jednotky-v2', 12,
   '{"instruction":"Které číslo dělí zároveň 60 i 84?","math":"","category":"Dělitelnost a činitelé","hint":""}',
   '[{"id":"a","label":"5"},{"id":"b","label":"8"},{"id":"c","label":"12"},{"id":"d","label":"18"}]',
   'c', 'Platí 60 : 12 = 5 a 84 : 12 = 7.', 1),

  ('zlomky-kraceni-jednotky-v2-q13', 'zlomky-kraceni-jednotky-v2', 13,
   '{"instruction":"Jakým největším číslem lze najednou krátit?","math":"\\frac{70}{105}","category":"Dělitelnost a činitelé","hint":"Hledej společné činitele 5 a 7."}',
   '[{"id":"a","label":"5"},{"id":"b","label":"7"},{"id":"c","label":"25"},{"id":"d","label":"35"}]',
   'd', '[[math:70=2\cdot5\cdot7]], [[math:105=3\cdot5\cdot7]], proto NSD je 35.', 2),

  ('zlomky-kraceni-jednotky-v2-q14', 'zlomky-kraceni-jednotky-v2', 14,
   '{"instruction":"Zkrať na základní tvar.","math":"\\frac{12}{18}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{6}{9}]]"},{"id":"b","label":"[[math:\\frac{2}{3}]]"},{"id":"c","label":"[[math:\\frac{3}{2}]]"},{"id":"d","label":"[[math:\\frac{4}{9}]]"}]',
   'b', 'Čitatele i jmenovatele vydělíme 6: [[math:\frac{12}{18}=\frac{2}{3}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q15', 'zlomky-kraceni-jednotky-v2', 15,
   '{"instruction":"Zkrať na základní tvar.","math":"\\frac{16}{24}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{2}{3}]]"},{"id":"b","label":"[[math:\\frac{3}{4}]]"},{"id":"c","label":"[[math:\\frac{4}{6}]]"},{"id":"d","label":"[[math:\\frac{8}{10}]]"}]',
   'a', 'Krátíme osmi: [[math:\frac{16}{24}=\frac{2}{3}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q16', 'zlomky-kraceni-jednotky-v2', 16,
   '{"instruction":"Zkrať na základní tvar.","math":"\\frac{45}{60}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{4}{3}]]"},{"id":"b","label":"[[math:\\frac{3}{4}]]"},{"id":"c","label":"[[math:\\frac{9}{12}]]"},{"id":"d","label":"[[math:\\frac{5}{6}]]"}]',
   'b', 'NSD čísel 45 a 60 je 15, tedy [[math:\frac{45}{60}=\frac{3}{4}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q17', 'zlomky-kraceni-jednotky-v2', 17,
   '{"instruction":"Zkrať na základní tvar.","math":"\\frac{84}{126}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{2}{3}]]"},{"id":"b","label":"[[math:\\frac{3}{2}]]"},{"id":"c","label":"[[math:\\frac{4}{6}]]"},{"id":"d","label":"[[math:\\frac{7}{9}]]"}]',
   'a', 'Krátíme 42: [[math:\frac{84}{126}=\frac{2}{3}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q18', 'zlomky-kraceni-jednotky-v2', 18,
   '{"instruction":"Zkrať na základní tvar.","math":"\\frac{96}{144}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{4}{5}]]"},{"id":"b","label":"[[math:\\frac{2}{3}]]"},{"id":"c","label":"[[math:\\frac{3}{4}]]"},{"id":"d","label":"[[math:\\frac{12}{18}]]"}]',
   'b', 'Krátíme 48: [[math:\frac{96}{144}=\frac{2}{3}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q19', 'zlomky-kraceni-jednotky-v2', 19,
   '{"instruction":"Který mezikrok je správný?","math":"\\frac{60}{84}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{60}{84}=\\frac{59}{83}]]"},{"id":"b","label":"[[math:\\frac{60}{84}=\\frac{30}{42}]]"},{"id":"c","label":"[[math:\\frac{60}{84}=\\frac{6}{84}]]"},{"id":"d","label":"[[math:\\frac{60}{84}=\\frac{60}{42}]]"}]',
   'b', 'Při krácení dvěma dělíme dvěma celý čitatel i celý jmenovatel.', 1),

  ('zlomky-kraceni-jednotky-v2-q20', 'zlomky-kraceni-jednotky-v2', 20,
   '{"instruction":"Je výsledek v základním tvaru?","math":"\\frac{18}{30}=\\frac{6}{10}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"Ano, dál krátit nelze."},{"id":"b","label":"Ne, lze ještě krátit dvěma."},{"id":"c","label":"Ne, lze ještě krátit pěti."},{"id":"d","label":"Ne, správný výsledek je 2/5."}]',
   'b', '[[math:\frac{6}{10}]] ještě krátíme dvěma na [[math:\frac{3}{5}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q21', 'zlomky-kraceni-jednotky-v2', 21,
   '{"instruction":"Vypočti a zkrať.","math":"\\frac{8}{15}\\cdot\\frac{9}{16}","category":"Krácení","hint":"Krátit smíš mezi čitatelem a jmenovatelem."}',
   '[{"id":"a","label":"[[math:\\frac{3}{10}]]"},{"id":"b","label":"[[math:\\frac{72}{31}]]"},{"id":"c","label":"[[math:\\frac{8}{10}]]"},{"id":"d","label":"[[math:\\frac{9}{15}]]"}]',
   'a', 'Před násobením krátíme 8 s 16 a 9 s 15: [[math:\frac{1}{5}\cdot\frac{3}{2}=\frac{3}{10}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q22', 'zlomky-kraceni-jednotky-v2', 22,
   '{"instruction":"Vypočti a zkrať.","math":"\\frac{14}{25}\\cdot\\frac{15}{21}","category":"Krácení","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{2}{5}]]"},{"id":"b","label":"[[math:\\frac{10}{15}]]"},{"id":"c","label":"[[math:\\frac{3}{5}]]"},{"id":"d","label":"[[math:\\frac{2}{3}]]"}]',
   'a', 'Krátíme 14 s 21 sedmi a 15 s 25 pěti: [[math:\frac{2\cdot3}{5\cdot3}=\frac{6}{15}=\frac{2}{5}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q23', 'zlomky-kraceni-jednotky-v2', 23,
   '{"instruction":"Které tvrzení o krácení je správné?","math":"","category":"Krácení","hint":""}',
   '[{"id":"a","label":"Od čitatele i jmenovatele odečteme stejné číslo."},{"id":"b","label":"Vydělíme čitatele i jmenovatele stejným nenulovým číslem."},{"id":"c","label":"Vydělíme jen jmenovatele."},{"id":"d","label":"Vynásobíme čitatele a vydělíme jmenovatele."}]',
   'b', 'Stejným nenulovým dělitelem dělíme celý čitatel i celý jmenovatel.', 1),

  ('zlomky-kraceni-jednotky-v2-q24', 'zlomky-kraceni-jednotky-v2', 24,
   '{"instruction":"Rozšiř zlomek na jmenovatel 20.","math":"\\frac{3}{5}=\\frac{\\square}{20}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"8"},{"id":"b","label":"10"},{"id":"c","label":"12"},{"id":"d","label":"15"}]',
   'c', 'Pětku násobíme čtyřmi, proto také 3 · 4 = 12.', 1),

  ('zlomky-kraceni-jednotky-v2-q25', 'zlomky-kraceni-jednotky-v2', 25,
   '{"instruction":"Rozšiř zlomek na jmenovatel 40.","math":"\\frac{3}{8}=\\frac{\\square}{40}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"5"},{"id":"b","label":"12"},{"id":"c","label":"15"},{"id":"d","label":"24"}]',
   'c', 'Osmičku násobíme pěti, proto také 3 · 5 = 15.', 1),

  ('zlomky-kraceni-jednotky-v2-q26', 'zlomky-kraceni-jednotky-v2', 26,
   '{"instruction":"Doplň chybějící čitatel.","math":"\\frac{7}{12}=\\frac{\\square}{60}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"25"},{"id":"b","label":"30"},{"id":"c","label":"35"},{"id":"d","label":"42"}]',
   'c', 'Jmenovatel násobíme pěti, proto čitatel je 7 · 5 = 35.', 1),

  ('zlomky-kraceni-jednotky-v2-q27', 'zlomky-kraceni-jednotky-v2', 27,
   '{"instruction":"Doplň chybějící čitatel.","math":"\\frac{\\square}{42}=\\frac{5}{7}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"25"},{"id":"b","label":"30"},{"id":"c","label":"35"},{"id":"d","label":"36"}]',
   'b', 'Sedmičku násobíme šesti na 42, proto 5 · 6 = 30.', 1),

  ('zlomky-kraceni-jednotky-v2-q28', 'zlomky-kraceni-jednotky-v2', 28,
   '{"instruction":"Která dvojice obsahuje ekvivalentní zlomky?","math":"","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{2}{3}\\text{ a }\\frac{8}{9}]]"},{"id":"b","label":"[[math:\\frac{3}{5}\\text{ a }\\frac{18}{30}]]"},{"id":"c","label":"[[math:\\frac{4}{7}\\text{ a }\\frac{8}{21}]]"},{"id":"d","label":"[[math:\\frac{5}{8}\\text{ a }\\frac{10}{24}]]"}]',
   'b', '[[math:\frac{18}{30}]] krátíme šesti na [[math:\frac{3}{5}]].', 1),

  ('zlomky-kraceni-jednotky-v2-q29', 'zlomky-kraceni-jednotky-v2', 29,
   '{"instruction":"Převeď na společný jmenovatel 24.","math":"\\frac{2}{3}\\quad\\text{a}\\quad\\frac{5}{8}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{16}{24}\\text{ a }\\frac{15}{24}]]"},{"id":"b","label":"[[math:\\frac{8}{24}\\text{ a }\\frac{5}{24}]]"},{"id":"c","label":"[[math:\\frac{16}{24}\\text{ a }\\frac{10}{24}]]"},{"id":"d","label":"[[math:\\frac{6}{24}\\text{ a }\\frac{15}{24}]]"}]',
   'a', 'První zlomek rozšíříme osmi a druhý třemi: [[math:\frac{16}{24}]] a [[math:\frac{15}{24}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q30', 'zlomky-kraceni-jednotky-v2', 30,
   '{"instruction":"Vypočti pomocí společného jmenovatele.","math":"\\frac{1}{4}+\\frac{2}{3}","category":"Rozšiřování","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{3}{7}]]"},{"id":"b","label":"[[math:\\frac{3}{12}]]"},{"id":"c","label":"[[math:\\frac{11}{12}]]"},{"id":"d","label":"[[math:\\frac{9}{12}]]"}]',
   'c', '[[math:\frac{1}{4}=\frac{3}{12}]] a [[math:\frac{2}{3}=\frac{8}{12}]], tedy součet je [[math:\frac{11}{12}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q31', 'zlomky-kraceni-jednotky-v2', 31,
   '{"instruction":"Převeď na milimetry.","math":"\\frac{3}{5}\\,\\mathrm{cm}","category":"Převody délky","hint":""}',
   '[{"id":"a","label":"5 mm"},{"id":"b","label":"6 mm"},{"id":"c","label":"8 mm"},{"id":"d","label":"15 mm"}]',
   'b', 'Jeden centimetr má 10 mm: [[math:\frac{3}{5}\cdot10=6]] mm.', 1),

  ('zlomky-kraceni-jednotky-v2-q32', 'zlomky-kraceni-jednotky-v2', 32,
   '{"instruction":"Převeď na centimetry.","math":"\\frac{7}{10}\\,\\mathrm{dm}","category":"Převody délky","hint":""}',
   '[{"id":"a","label":"0,7 cm"},{"id":"b","label":"7 cm"},{"id":"c","label":"70 cm"},{"id":"d","label":"700 cm"}]',
   'b', 'Jeden decimetr má 10 cm: [[math:\frac{7}{10}\cdot10=7]] cm.', 1),

  ('zlomky-kraceni-jednotky-v2-q33', 'zlomky-kraceni-jednotky-v2', 33,
   '{"instruction":"Převeď na centimetry.","math":"\\frac{9}{20}\\,\\mathrm{m}","category":"Převody délky","hint":""}',
   '[{"id":"a","label":"9 cm"},{"id":"b","label":"20 cm"},{"id":"c","label":"45 cm"},{"id":"d","label":"90 cm"}]',
   'c', 'Jeden metr má 100 cm: [[math:\frac{9}{20}\cdot100=45]] cm.', 2),

  ('zlomky-kraceni-jednotky-v2-q34', 'zlomky-kraceni-jednotky-v2', 34,
   '{"instruction":"Převeď na metry.","math":"\\frac{3}{8}\\,\\mathrm{km}","category":"Převody délky","hint":""}',
   '[{"id":"a","label":"37,5 m"},{"id":"b","label":"125 m"},{"id":"c","label":"375 m"},{"id":"d","label":"3 750 m"}]',
   'c', 'Jeden kilometr má 1 000 m: [[math:\frac{3}{8}\cdot1000=375]] m.', 2),

  ('zlomky-kraceni-jednotky-v2-q35', 'zlomky-kraceni-jednotky-v2', 35,
   '{"instruction":"Zapiš v základním tvaru jako část metru.","math":"250\\,\\mathrm{mm}","category":"Převody délky","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{1}{4}\\,\\mathrm{m}]]"},{"id":"b","label":"[[math:\\frac{1}{25}\\,\\mathrm{m}]]"},{"id":"c","label":"[[math:\\frac{25}{100}\\,\\mathrm{m}]]"},{"id":"d","label":"[[math:\\frac{4}{1}\\,\\mathrm{m}]]"}]',
   'a', '[[math:250\,\mathrm{mm}=\frac{250}{1000}\,\mathrm{m}=\frac{1}{4}\,\mathrm{m}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q36', 'zlomky-kraceni-jednotky-v2', 36,
   '{"instruction":"Provaz rozdělíme na tři stejné kusy. Jak dlouhý je jeden?","math":"\\frac{3}{4}\\,\\mathrm{m}:3","category":"Převody délky","hint":"Nejprve vyděl zlomek třemi, potom převeď jednotku."}',
   '[{"id":"a","label":"15 cm"},{"id":"b","label":"20 cm"},{"id":"c","label":"25 cm"},{"id":"d","label":"30 cm"}]',
   'c', '[[math:\frac{3}{4}:3=\frac{1}{4}]] m a čtvrt metru je 25 cm.', 2),

  ('zlomky-kraceni-jednotky-v2-q37', 'zlomky-kraceni-jednotky-v2', 37,
   '{"instruction":"Převeď na miligramy.","math":"\\frac{3}{4}\\,\\mathrm{g}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"75 mg"},{"id":"b","label":"250 mg"},{"id":"c","label":"750 mg"},{"id":"d","label":"1 333 mg"}]',
   'c', 'Jeden gram má 1 000 mg: [[math:\frac{3}{4}\cdot1000=750]] mg.', 1),

  ('zlomky-kraceni-jednotky-v2-q38', 'zlomky-kraceni-jednotky-v2', 38,
   '{"instruction":"Převeď na gramy.","math":"\\frac{2}{5}\\,\\mathrm{kg}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"200 g"},{"id":"b","label":"250 g"},{"id":"c","label":"400 g"},{"id":"d","label":"500 g"}]',
   'c', 'Jeden kilogram má 1 000 g: [[math:\frac{2}{5}\cdot1000=400]] g.', 1),

  ('zlomky-kraceni-jednotky-v2-q39', 'zlomky-kraceni-jednotky-v2', 39,
   '{"instruction":"Převeď na gramy.","math":"\\frac{9}{25}\\,\\mathrm{kg}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"90 g"},{"id":"b","label":"250 g"},{"id":"c","label":"360 g"},{"id":"d","label":"900 g"}]',
   'c', '[[math:\frac{9}{25}\cdot1000=9\cdot40=360]] g.', 2),

  ('zlomky-kraceni-jednotky-v2-q40', 'zlomky-kraceni-jednotky-v2', 40,
   '{"instruction":"Převeď na kilogramy.","math":"\\frac{7}{20}\\,\\mathrm{t}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"35 kg"},{"id":"b","label":"70 kg"},{"id":"c","label":"350 kg"},{"id":"d","label":"700 kg"}]',
   'c', 'Jedna tuna má 1 000 kg: [[math:\frac{7}{20}\cdot1000=350]] kg.', 2),

  ('zlomky-kraceni-jednotky-v2-q41', 'zlomky-kraceni-jednotky-v2', 41,
   '{"instruction":"Zapiš v základním tvaru jako část kilogramu.","math":"125\\,\\mathrm{g}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{1}{8}\\,\\mathrm{kg}]]"},{"id":"b","label":"[[math:\\frac{1}{4}\\,\\mathrm{kg}]]"},{"id":"c","label":"[[math:\\frac{8}{1}\\,\\mathrm{kg}]]"},{"id":"d","label":"[[math:\\frac{125}{100}\\,\\mathrm{kg}]]"}]',
   'a', '[[math:125\,\mathrm{g}=\frac{125}{1000}\,\mathrm{kg}=\frac{1}{8}\,\mathrm{kg}]].', 2),

  ('zlomky-kraceni-jednotky-v2-q42', 'zlomky-kraceni-jednotky-v2', 42,
   '{"instruction":"Kolik gramů spotřebujeme?","math":"\\frac{3}{4}\\text{ z }\\frac{2}{5}\\,\\mathrm{kg}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"150 g"},{"id":"b","label":"300 g"},{"id":"c","label":"400 g"},{"id":"d","label":"600 g"}]',
   'b', '[[math:\frac{3}{4}\cdot\frac{2}{5}=\frac{3}{10}]] kg, tedy 300 g.', 2),

  ('zlomky-kraceni-jednotky-v2-q43', 'zlomky-kraceni-jednotky-v2', 43,
   '{"instruction":"Obsah balíku váží 2/3 kg. Který přesný zápis v gramech je správný?","math":"\\frac{2}{3}\\,\\mathrm{kg}","category":"Převody hmotnosti","hint":""}',
   '[{"id":"a","label":"Přesně 667 g"},{"id":"b","label":"[[math:666\\frac{2}{3}\\,\\mathrm{g}]]"},{"id":"c","label":"Přesně 600 g"},{"id":"d","label":"Přesně 660 g"}]',
   'b', '[[math:\frac{2}{3}\cdot1000=\frac{2000}{3}=666\frac{2}{3}]] g. Hodnota 667 g je jen zaokrouhlení.', 2),

  ('zlomky-kraceni-jednotky-v2-q44', 'zlomky-kraceni-jednotky-v2', 44,
   '{"instruction":"Nejprve zkrať a potom převeď na centimetry.","math":"\\frac{18}{24}\\,\\mathrm{m}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"25 cm"},{"id":"b","label":"50 cm"},{"id":"c","label":"75 cm"},{"id":"d","label":"80 cm"}]',
   'c', '[[math:\frac{18}{24}=\frac{3}{4}]] a [[math:\frac{3}{4}\cdot100=75]] cm.', 2),

  ('zlomky-kraceni-jednotky-v2-q45', 'zlomky-kraceni-jednotky-v2', 45,
   '{"instruction":"Nejprve zkrať a potom převeď na gramy.","math":"\\frac{24}{60}\\,\\mathrm{kg}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"240 g"},{"id":"b","label":"400 g"},{"id":"c","label":"500 g"},{"id":"d","label":"600 g"}]',
   'b', '[[math:\frac{24}{60}=\frac{2}{5}]] a [[math:\frac{2}{5}\cdot1000=400]] g.', 2),

  ('zlomky-kraceni-jednotky-v2-q46', 'zlomky-kraceni-jednotky-v2', 46,
   '{"instruction":"Který výpočet je správný?","math":"\\frac{3}{20}\\,\\mathrm{t}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"[[math:\\frac{3}{20}\\cdot1000=150\\,\\mathrm{kg}]]"},{"id":"b","label":"[[math:\\frac{3}{20}:1000=150\\,\\mathrm{kg}]]"},{"id":"c","label":"[[math:\\frac{3}{20}\\cdot100=15\\,\\mathrm{kg}]]"},{"id":"d","label":"[[math:\\frac{3}{20}\\cdot10=1{,}5\\,\\mathrm{kg}]]"}]',
   'a', 'Při převodu tun na kilogramy násobíme 1 000; výsledek je 150 kg.', 1),

  ('zlomky-kraceni-jednotky-v2-q47', 'zlomky-kraceni-jednotky-v2', 47,
   '{"instruction":"Páska dlouhá 2/5 m se prodává po kusech. Kolik milimetrů měří?","math":"\\frac{2}{5}\\,\\mathrm{m}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"40 mm"},{"id":"b","label":"200 mm"},{"id":"c","label":"400 mm"},{"id":"d","label":"2 500 mm"}]',
   'c', 'Jeden metr má 1 000 mm: [[math:\frac{2}{5}\cdot1000=400]] mm.', 1),

  ('zlomky-kraceni-jednotky-v2-q48', 'zlomky-kraceni-jednotky-v2', 48,
   '{"instruction":"Dvě balení po 3/8 kg mají dohromady kolik gramů?","math":"2\\cdot\\frac{3}{8}\\,\\mathrm{kg}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"375 g"},{"id":"b","label":"600 g"},{"id":"c","label":"750 g"},{"id":"d","label":"800 g"}]',
   'c', '[[math:2\cdot\frac{3}{8}=\frac{3}{4}]] kg, tedy 750 g.', 2),

  ('zlomky-kraceni-jednotky-v2-q49', 'zlomky-kraceni-jednotky-v2', 49,
   '{"instruction":"Tyč dlouhá 5/6 m se zkrátí o 1/3 m. Jaká délka zbude?","math":"\\frac{5}{6}\\,\\mathrm{m}-\\frac{1}{3}\\,\\mathrm{m}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"30 cm"},{"id":"b","label":"50 cm"},{"id":"c","label":"60 cm"},{"id":"d","label":"75 cm"}]',
   'b', '[[math:\frac{5}{6}-\frac{2}{6}=\frac{3}{6}=\frac{1}{2}]] m, tedy 50 cm.', 2),

  ('zlomky-kraceni-jednotky-v2-q50', 'zlomky-kraceni-jednotky-v2', 50,
   '{"instruction":"Který odhad je rozumný?","math":"\\frac{2}{5}\\,\\mathrm{kg}","category":"Smíšené úlohy","hint":""}',
   '[{"id":"a","label":"Je to méně než 100 g."},{"id":"b","label":"Je to přesně 200 g."},{"id":"c","label":"Je to o něco méně než půl kilogramu."},{"id":"d","label":"Je to více než 1 kg."}]',
   'c', 'Dvě pětiny jsou 0,4, tedy o něco méně než polovina celku.', 1);

-- Přiřazení je omezeno přesným stabilním ID, jménem a aktivním stavem účtu.
INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status)
SELECT 'eliska-zlomky-kraceni-jednotky-v2', id, 'zlomky-kraceni-jednotky-v2', 'active'
  FROM students
 WHERE id = 'eliska' AND display_name = 'Eliška' AND enabled = 1;
