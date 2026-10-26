PRAGMA foreign_keys = ON;

-- Final scored self-check for Šimon: internal energy, three heat-transfer
-- mechanisms and thermal expansion. Results are saved in D1 by existing engine.
INSERT OR IGNORE INTO self_check_tests (id,slug,version,title,description,subject,topic,level,estimated_minutes,status)
VALUES ('vnitrni-energie-simon-ss-v1','vnitrni-energie-simon-ss','1','Vnitřní energie, přenos tepla a roztažnost — self-check','[[calculator:Povolena kalkulačka]]20 úloh / postupně od pojmů k výpočtům. Zadání pokrývá vnitřní energii, teplo, vedení, proudění, záření a teplotní roztažnost. Po odevzdání se zobrazí rozbor chyb.','Fyzika','Vnitřní energie a přenos tepla','SŠ','30','published');

INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q01','vnitrni-energie-simon-ss-v1','1','{"instruction":"Která veličina popisuje energii spojenou s mikroskopickým pohybem a vzájemným působením částic tělesa?","math":"","category":"Základní pojmy","hint":"Pomysli na energii částic uvnitř tělesa."}','[{"id":"a","label":"Teplo Q"},{"id":"b","label":"Vnitřní energie U"},{"id":"c","label":"Teplota T"},{"id":"d","label":"Tepelná vodivost λ"}]','b','Vnitřní energie zahrnuje mikroskopickou kinetickou a potenciální energii částic. Teplo Q je energie přenášená kvůli teplotnímu rozdílu.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q02','vnitrni-energie-simon-ss-v1','2','{"instruction":"Které tvrzení o teplu je fyzikálně správné?","math":"","category":"Základní pojmy","hint":"Rozlišuj zásobu energie a její přenos."}','[{"id":"a","label":"Těleso může uchovávat teplo jako látku."},{"id":"b","label":"Teplo je vždy totéž co teplota."},{"id":"c","label":"Teplo je energie předávaná kvůli rozdílu teplot."},{"id":"d","label":"Teplo se může přenášet pouze vedením."}]','c','Teplo není stavová veličina tělesa. Označuje přenos energie mezi soustavami způsobený rozdílem teplot.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q03','vnitrni-energie-simon-ss-v1','3','{"instruction":"Soustava přijme 200 J tepla a okolí na ní vykoná 100 J práce. Jak se změní její vnitřní energie?","math":"\\Delta U=Q+W_{\\mathrm{na}}","category":"První termodynamický zákon","hint":"Oba způsoby předání energie jsou kladné."}','[{"id":"a","label":"Zvýší se o 300 J"},{"id":"b","label":"Zvýší se o 100 J"},{"id":"c","label":"Sníží se o 100 J"},{"id":"d","label":"Sníží se o 300 J"}]','a','Při použité znaménkové konvenci ΔU = Q + W_na = 200 + 100 = 300 J.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q04','vnitrni-energie-simon-ss-v1','4','{"instruction":"Který děj typicky mění vnitřní energii konáním práce, nikoli primárně přenosem tepla?","math":"","category":"První termodynamický zákon","hint":"Hledej působení síly na dráze."}','[{"id":"a","label":"Ohřev lžíce položené do čaje."},{"id":"b","label":"Zahřátí rukou intenzivním třením."},{"id":"c","label":"Ohřev Země Sluncem."},{"id":"d","label":"Ochladnutí vody v místnosti."}]','b','Při tření dlaní se mechanická práce přeměňuje na vnitřní energii.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q05','vnitrni-energie-simon-ss-v1','5','{"instruction":"Jaká je správná jednotka měrné tepelné kapacity c?","math":"Q=mc\\Delta T","category":"Kalorimetrie","hint":"Odvoď jednotku c ze vztahu."}','[{"id":"a","label":"J/(kg·K)"},{"id":"b","label":"J·kg/K"},{"id":"c","label":"W/m"},{"id":"d","label":"kg/(J·K)"}]','a','c = Q/(mΔT), tedy J/(kg·K).','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q06','vnitrni-energie-simon-ss-v1','6','{"instruction":"Jaké teplo potřebuje 0,30 kg vody pro ohřev z 20 °C na 50 °C? c = 4200 J/(kg·K).","math":"Q=mc\\Delta T","category":"Kalorimetrie","hint":"Teplotní rozdíl je 30 K."}','[{"id":"a","label":"12,6 kJ"},{"id":"b","label":"37,8 kJ"},{"id":"c","label":"42,0 kJ"},{"id":"d","label":"378 kJ"}]','b','Q = 0,30 × 4200 × (50−20) = 37 800 J = 37,8 kJ.','3');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q07','vnitrni-energie-simon-ss-v1','7','{"instruction":"Kolik tepla potřebuje 250 g vody pro ohřev o 20 K? c = 4200 J/(kg·K).","math":"Q=mc\\Delta T","category":"Kalorimetrie","hint":"Pozor na převod gramů na kilogramy."}','[{"id":"a","label":"2,1 kJ"},{"id":"b","label":"21 kJ"},{"id":"c","label":"84 kJ"},{"id":"d","label":"210 kJ"}]','b','250 g = 0,25 kg. Q = 0,25 × 4200 × 20 = 21 000 J = 21 kJ.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q08','vnitrni-energie-simon-ss-v1','8','{"instruction":"Tělesu o hmotnosti 0,5 kg dodáme 10 000 J a zahřeje se o 20 K. Urči c.","math":"c=\\frac{Q}{m\\Delta T}","category":"Kalorimetrie","hint":"Vyjádři neznámou z Q = mcΔT."}','[{"id":"a","label":"500 J/(kg·K)"},{"id":"b","label":"1000 J/(kg·K)"},{"id":"c","label":"2000 J/(kg·K)"},{"id":"d","label":"10 000 J/(kg·K)"}]','b','c = 10 000/(0,5 × 20) = 1000 J/(kg·K).','3');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q09','vnitrni-energie-simon-ss-v1','9','{"instruction":"Kovová lžíce v horké polévce se zahřívá podél rukojeti. Co je hlavním mechanismem uvnitř kovu?","math":"","category":"Vedení tepla","hint":"Zamysli se, zda kov jako celek proudí."}','[{"id":"a","label":"Proudění celé lžíce"},{"id":"b","label":"Teplotní roztažnost"},{"id":"c","label":"Vedení tepla"},{"id":"d","label":"Tání kovu"}]','c','Vedením se předává energie mezi sousedními částmi kovu; látka jako celek necirkuluje.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q10','vnitrni-energie-simon-ss-v1','10','{"instruction":"Homogenní izolační deska má při stejném rozdílu povrchových teplot a stejné ploše dvojnásobnou tloušťku. Výkon vedením se přibližně…","math":"P=\\lambda A\\frac{\\Delta T}{d}","category":"Vedení tepla","hint":"Podívej se, kde je tloušťka d ve vzorci."}','[{"id":"a","label":"zdvojnásobí."},{"id":"b","label":"zmenší na polovinu."},{"id":"c","label":"zčtyřnásobí."},{"id":"d","label":"nezmění."}]','b','U ustáleného jednorozměrného vedení je P nepřímo úměrné d.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q11','vnitrni-energie-simon-ss-v1','11','{"instruction":"Izolace má λ = 0,04 W/(m·K), A = 2 m², d = 0,10 m a rozdíl povrchových teplot 20 K. Jaký výkon se vede?","math":"P=\\lambda A\\frac{\\Delta T}{d}","category":"Vedení tepla","hint":"Zanedbej povrchové odpory a předpokládej ustálený stav."}','[{"id":"a","label":"4 W"},{"id":"b","label":"8 W"},{"id":"c","label":"16 W"},{"id":"d","label":"40 W"}]','c','P = 0,04 × 2 × 20 / 0,10 = 16 W.','3');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q12','vnitrni-energie-simon-ss-v1','12','{"instruction":"Jakým mechanismem se v ohřívané vodě přenáší energie spolu s pohybujícími se oblastmi kapaliny?","math":"","category":"Proudění","hint":"Při tomto mechanismu se přemisťuje tekutina."}','[{"id":"a","label":"Prouděním"},{"id":"b","label":"Výhradně vedením"},{"id":"c","label":"Pouze zářením"},{"id":"d","label":"Jen vykonáním práce"}]','a','Konvekce je přenos energie spojený s pohybem kapaliny či plynu.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q13','vnitrni-energie-simon-ss-v1','13','{"instruction":"Proč může ohřátý vzduch nad radiátorem stoupat?","math":"","category":"Proudění","hint":"Uvažuj přibližně stejný tlak a vztlak."}','[{"id":"a","label":"Protože se veškerý vzduch mění na vakuum."},{"id":"b","label":"Protože ohřátý vzduch mívá nižší hustotu a působí na něj vztlak."},{"id":"c","label":"Protože elektromagnetické vlny přenášejí vzduch."},{"id":"d","label":"Protože vzduch přestane mít hmotnost."}]','b','Za přibližně stejného tlaku zahřátý vzduch expanduje, jeho hustota klesá a vztlak vytváří přirozenou cirkulaci.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q14','vnitrni-energie-simon-ss-v1','14','{"instruction":"Který způsob přenosu energie může probíhat i v dokonalém vakuu?","math":"","category":"Záření","hint":"Zvaž, který způsob nepotřebuje látkové prostředí."}','[{"id":"a","label":"Vedení"},{"id":"b","label":"Přirozená konvekce"},{"id":"c","label":"Elektromagnetické záření"},{"id":"d","label":"Nucená konvekce"}]','c','Záření přenáší energii elektromagnetickými vlnami, například ze Slunce na Zemi.','1');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q15','vnitrni-energie-simon-ss-v1','15','{"instruction":"Černé těleso má při stejné ploše dvojnásobnou absolutní teplotu. Kolikrát vyšší je jeho celkový vyzařovaný výkon?","math":"P=\\sigma A T^4","category":"Záření","hint":"Teplota je v kelvinech, nikoli ve °C."}','[{"id":"a","label":"2×"},{"id":"b","label":"4×"},{"id":"c","label":"8×"},{"id":"d","label":"16×"}]','d','Poměr vyzařovaných výkonů je (2T/T)^4 = 16. Nejde nutně o poměr čistých toků do okolí.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q16','vnitrni-energie-simon-ss-v1','16','{"instruction":"Těleso s teplotou 300 K zahřejeme na 600 K. Které tvrzení je správné?","math":"","category":"Záření","hint":"Vztahuj teploty v kelvinech a používej T^4."}','[{"id":"a","label":"Celkový vyzařovaný výkon je při stejné emisivitě a ploše 16× větší."},{"id":"b","label":"Vyzařovaný výkon je pouze 2× větší."},{"id":"c","label":"Celkový výkon se nezmění."},{"id":"d","label":"Výkon je nulový, pokud je těleso v místnosti."}]','a','Stefanův–Boltzmannův zákon používá absolutní teplotu: (600/300)^4 = 16.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q17','vnitrni-energie-simon-ss-v1','17','{"instruction":"Dvoumetrovou ocelovou tyč s α = 12×10⁻⁶ K⁻¹ zahřejeme o 50 K. Jaké je prodloužení?","math":"\\Delta l=\\alpha l_0\\Delta T","category":"Roztažnost","hint":"Převáděj metry na milimetry až na konci."}','[{"id":"a","label":"0,12 mm"},{"id":"b","label":"1,2 mm"},{"id":"c","label":"12 mm"},{"id":"d","label":"120 mm"}]','b','Δl = 12×10⁻⁶ × 2 × 50 = 0,0012 m = 1,2 mm.','3');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q18','vnitrni-energie-simon-ss-v1','18','{"instruction":"Co se obvykle stane s otvorem v rovnoměrně ohřáté kovové desce?","math":"","category":"Roztažnost","hint":"Představ si desku, jako by byl otvor vyplněn stejným materiálem."}','[{"id":"a","label":"Otvor se vždy zmenší."},{"id":"b","label":"Otvor nezmění velikost."},{"id":"c","label":"Otvor se také zvětší."},{"id":"d","label":"Otvor se uzavře, protože kov měkne."}]','c','Při rovnoměrné izotropní roztažnosti se zvětšují rozměry celé desky včetně otvoru.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q19','vnitrni-energie-simon-ss-v1','19','{"instruction":"Pro které teplotní rozmezí je voda známou anomálií, kdy se při zahřívání její hustota zvětšuje?","math":"","category":"Roztažnost","hint":"Hustota vody má maximum u 4 °C."}','[{"id":"a","label":"0 až 4 °C"},{"id":"b","label":"4 až 40 °C"},{"id":"c","label":"80 až 100 °C"},{"id":"d","label":"Pro jakékoliv zvýšení teploty"}]','a','Mezi 0 a 4 °C hustota kapalné vody při ohřevu roste; maximum je okolo 4 °C.','2');
INSERT OR IGNORE INTO self_check_questions (id,test_id,position,prompt,options_json,correct_answer,explanation,points)
VALUES ('vnitrni-energie-simon-ss-v1-q20','vnitrni-energie-simon-ss-v1','20','{"instruction":"Jakým způsobem může radiátor přenášet energii do místnosti?","math":"","category":"Souvislosti","hint":"Přenosové mechanismy se mohou kombinovat."}','[{"id":"a","label":"Pouze vedením do vzduchu bez jeho pohybu."},{"id":"b","label":"Pouze zářením, nikdy ne prouděním."},{"id":"c","label":"Prouděním zahřívaného vzduchu i zářením na okolní povrchy."},{"id":"d","label":"Žádným, dokud vzduch nedosáhne 100 °C."}]','c','Radiátor ohřívá vzduch a vyvolává proudění; současně vyzařuje infračervené záření na okolní povrchy.','2');

-- Every account has at most one assignment for this particular test.
INSERT OR IGNORE INTO self_check_assignments (id,student_id,test_id,status)
SELECT 'simon-vnitrni-energie-assignment-v1','simon','vnitrni-energie-simon-ss-v1','active'
WHERE EXISTS (SELECT 1 FROM students WHERE id='simon');

-- Keep historical materials intact, including the private PDF uploaded to R2.
-- Append this interactive lesson only when not already present.
UPDATE student_profiles
SET payload_json=json_insert(payload_json,'$.materials[#]',json_object(
  'title','Vnitřní energie — interaktivní laboratoř a procvičování',
  'meta','Fyzika SŠ · vedení, proudění, záření a roztažnost',
  'badge','Interaktivní',
  'badgeClass','interactive',
  'date','2026-10-26',
  'kind','interactive',
  'interactiveId','thermal-energy',
  'url','https://vojtechsteidl.eu/interactive-notes/thermal-energy/'
)),updated_at=CURRENT_TIMESTAMP
WHERE student_id='simon'
  AND json_type(payload_json,'$.materials')='array'
  AND instr(payload_json,'/interactive-notes/thermal-energy/')=0;

UPDATE student_profiles
SET payload_json=json_set(payload_json,
  '$.priority',json_object('title','Vnitřní energie a přenos tepla',
     'text','Projdi PDF a interaktivní laboratoř. Pak dokonči závěrečný self-check ve studentské zóně.',
     'deadline','Průběžná příprava'),
  '$.progressText','Studijní balíček: PDF zápis, interaktivní modely a závěrečný self-check. Výsledky testu se ukládají do studentské zóny.'),
updated_at=CURRENT_TIMESTAMP
WHERE student_id='simon';
