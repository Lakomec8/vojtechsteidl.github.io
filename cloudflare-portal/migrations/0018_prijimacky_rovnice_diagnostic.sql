PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'prijimacky-rovnice-modelovani-v1',
  'prijimacky-rovnice-modelovani',
  1,
  'Rovnice a matematické modelování — diagnostika',
  '[[calculator:Bez kalkulačky]]Zjisti, jak na tom jsi s rovnicemi, zlomky a slovními úlohami. Test vychází z typů úloh používaných při přípravě na přijímací zkoušky na SŠ.',
  'Matematika',
  'Rovnice',
  '9. třída / přijímačky SŠ',
  15,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'prijimacky-rovnice-modelovani-v1-q1',
    'prijimacky-rovnice-modelovani-v1',
    1,
    '{"instruction":"Vyřeš rovnici:","math":"3\\left[2x-5(1-x)\\right]+4=2(x+9)","category":"Závorky a algebra","hint":"Začni vnitřní závorkou a teprve potom násob třemi."}',
    '[{"id":"a","label":"[[math:x=\\frac{19}{29}]]"},{"id":"b","label":"[[math:x=\\frac{29}{19}]]"},{"id":"c","label":"[[math:x=-\\frac{29}{19}]]"},{"id":"d","label":"[[math:x=\\frac{29}{23}]]"}]',
    'b',
    'Po odstranění závorek dostaneme [[math:21x-11=2x+18]]. Tedy [[math:19x=29]] a proto [[math:x=\\frac{29}{19}]].',
    1
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q2',
    'prijimacky-rovnice-modelovani-v1',
    2,
    '{"instruction":"Vyřeš rovnici:","math":"\\frac{3x-2}{4}-\\frac{x+5}{6}=\\frac{x-1}{3}","category":"Rovnice se zlomky","hint":"Může se hodit vynásobit celou rovnici nejmenším společným násobkem jmenovatelů."}',
    '[{"id":"a","label":"[[math:x=2]]"},{"id":"b","label":"[[math:x=3]]"},{"id":"c","label":"[[math:x=4]]"},{"id":"d","label":"[[math:x=6]]"}]',
    'c',
    'Po vynásobení číslem 12: [[math:3(3x-2)-2(x+5)=4(x-1)]]. Po úpravě vyjde [[math:3x=12]], tedy [[math:x=4]].',
    2
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q3',
    'prijimacky-rovnice-modelovani-v1',
    3,
    '{"instruction":"Urči počet řešení rovnice:","math":"4(3x-2)+5=2(6x+1)-5","category":"Struktura rovnice","hint":"Uprav obě strany. Pokud neznámá zmizí, sleduj, zda zůstane pravdivý nebo nepravdivý výrok."}',
    '[{"id":"a","label":"Právě jedno řešení"},{"id":"b","label":"Žádné řešení"},{"id":"c","label":"Nekonečně mnoho řešení"},{"id":"d","label":"Nelze určit"}]',
    'c',
    'Obě strany se upraví na [[math:12x-3]]. Rovnost je tedy pravdivá pro každé reálné číslo.',
    1
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q4',
    'prijimacky-rovnice-modelovani-v1',
    4,
    '{"instruction":"Pro kterou hodnotu x mají následující výrazy stejnou hodnotu?","math":"\\frac{3x-4}{5}\\qquad\\text{a}\\qquad\\frac{2-x}{3}+2","category":"Závorky a algebra","hint":"Stejná hodnota znamená, že oba výrazy můžeš položit sobě rovny."}',
    '[{"id":"a","label":"[[math:x=\\frac{7}{26}]]"},{"id":"b","label":"[[math:x=\\frac{13}{7}]]"},{"id":"c","label":"[[math:x=\\frac{26}{7}]]"},{"id":"d","label":"[[math:x=\\frac{52}{7}]]"}]',
    'c',
    'Sestavíme rovnici [[math:\\frac{3x-4}{5}=\\frac{2-x}{3}+2]]. Po vynásobení 15 dostaneme [[math:9x-12=40-5x]], tedy [[math:14x=52]] a [[math:x=\\frac{26}{7}]].',
    2
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q5',
    'prijimacky-rovnice-modelovani-v1',
    5,
    '{"instruction":"Adam má o 160 Kč více než Kryštof. Kdyby Adam dal Kryštofovi 40 Kč, měl by potom Adam přesně 1,5násobek Kryštofových peněz. Kolik korun měli původně?","math":"","category":"Slovní úlohy a modelování","hint":"Označ Kryštofovy původní peníze jako x a vyjádři pomocí x i Adamovy peníze před a po předání."}',
    '[{"id":"a","label":"Adam 240 Kč, Kryštof 80 Kč"},{"id":"b","label":"Adam 260 Kč, Kryštof 100 Kč"},{"id":"c","label":"Adam 280 Kč, Kryštof 120 Kč"},{"id":"d","label":"Adam 320 Kč, Kryštof 160 Kč"}]',
    'c',
    'Kryštof měl [[math:x]] Kč a Adam [[math:x+160]]. Po předání platí [[math:x+120=1{,}5(x+40)]]. Odtud [[math:x=120]], takže Adam měl 280 Kč.',
    1
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q6',
    'prijimacky-rovnice-modelovani-v1',
    6,
    '{"instruction":"Počet chlapců a dívek v kroužku je v poměru 3 : 5. Kdyby odešly 4 dívky, poměr počtu chlapců a dívek by byl 3 : 4. Kolik dětí bylo původně v kroužku?","math":"","category":"Slovní úlohy a modelování","hint":"Původní počty můžeš zapsat jako 3x a 5x."}',
    '[{"id":"a","label":"24"},{"id":"b","label":"28"},{"id":"c","label":"32"},{"id":"d","label":"36"}]',
    'c',
    'Původní počty jsou [[math:3x]] a [[math:5x]]. Po odchodu dívek platí [[math:\\frac{3x}{5x-4}=\\frac34]]. Vyjde [[math:x=4]], celkem tedy [[math:3\\cdot4+5\\cdot4=32]].',
    1
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q7',
    'prijimacky-rovnice-modelovani-v1',
    7,
    '{"instruction":"Cena výrobku byla nejprve zvýšena o 15 % a poté byla nová cena snížena o 20 %. Výsledná cena je 1 840 Kč. Jaká byla původní cena?","math":"","category":"Slovní úlohy a modelování","hint":"Dvě procentní změny za sebou nesčítej. Každou změnu vyjádři násobícím koeficientem."}',
    '[{"id":"a","label":"1 900 Kč"},{"id":"b","label":"2 000 Kč"},{"id":"c","label":"2 100 Kč"},{"id":"d","label":"2 300 Kč"}]',
    'b',
    'Původní cenu označíme [[math:x]]. Platí [[math:1{,}15\\cdot0{,}8x=1840]], tedy [[math:0{,}92x=1840]] a [[math:x=2000]].',
    1
  ),
  (
    'prijimacky-rovnice-modelovani-v1-q8',
    'prijimacky-rovnice-modelovani-v1',
    8,
    '{"instruction":"Obvod obdélníku je 70 cm. Jeho délka je o 5 cm větší než dvojnásobek šířky. Jaké jsou rozměry obdélníku?","math":"","category":"Slovní úlohy a modelování","hint":"Označ šířku x. Délku pak můžeš vyjádřit jako 2x + 5 a použít vzorec pro obvod."}',
    '[{"id":"a","label":"10 cm a 25 cm"},{"id":"b","label":"12 cm a 23 cm"},{"id":"c","label":"15 cm a 20 cm"},{"id":"d","label":"8 cm a 27 cm"}]',
    'a',
    'Šířka je [[math:x]], délka [[math:2x+5]]. Z obvodu dostaneme [[math:2(x+2x+5)=70]], tedy [[math:x=10]]. Rozměry jsou 10 cm a 25 cm.',
    1
  );

-- Repair explicit portal-to-tutoring links for the two group students when
-- their portal profiles already exist. This does not guess login IDs.
INSERT OR IGNORE INTO student_tutoring_links (student_id, tutoring_student_id)
SELECT student.id, tutoring.id
  FROM students AS student
  JOIN tutoring_students AS tutoring
    ON lower(trim(student.display_name)) = lower(trim(tutoring.display_name))
 WHERE tutoring.id IN ('adam', 'krystof');

-- Assign the diagnostic to both members of the Monday group. The assignment
-- is idempotent and follows the explicit portal/calendar link table.
INSERT OR IGNORE INTO self_check_assignments (id, student_id, test_id, status, due_at)
SELECT 'prijimacky-rovnice-modelovani-v1-' || link.tutoring_student_id,
       link.student_id,
       'prijimacky-rovnice-modelovani-v1',
       'active',
       NULL
  FROM student_tutoring_links AS link
 WHERE link.tutoring_student_id IN ('adam', 'krystof');
