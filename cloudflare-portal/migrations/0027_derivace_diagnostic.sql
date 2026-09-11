PRAGMA foreign_keys = ON;

-- Diagnostic test focused on derivatives from meaning and basic rules to applications.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'derivace-zaklady-v1',
  'derivace-zaklady',
  1,
  'Derivace — diagnostika',
  '[[calculator:Bez kalkulačky]]Diagnostický test na význam derivace, základní derivační vzorce, součin, podíl, složenou funkci, tečnu a jednoduché použití derivace. Celkem 20 bodů.',
  'Matematika',
  'Derivace',
  'SŠ / VŠ základ',
  15,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'derivace-zaklady-v1-q1',
    'derivace-zaklady-v1',
    1,
    '{"instruction":"Který výraz správně definuje derivaci funkce f v bodě a?","math":"","category":"Význam derivace","hint":"Derivace vzniká jako limita směrnice sečny, když druhý bod přibližujeme k bodu a."}',
    '[{"id":"a","label":"[[math:f\u0027(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}]]"},{"id":"b","label":"[[math:f\u0027(a)=\\lim_{h\\to0}\\frac{f(a+h)+f(a)}{h}]]"},{"id":"c","label":"[[math:f\u0027(a)=\\frac{f(a)}{a}]]"},{"id":"d","label":"[[math:f\u0027(a)=\\lim_{h\\to0}\\frac{f(h)-f(a)}{a}]]"}]',
    'a',
    'Derivace v bodě je limita diferenčního podílu [[math:\\frac{f(a+h)-f(a)}{h}]], tedy limita směrnice sečny při [[math:h\\to0]].',
    2
  ),
  (
    'derivace-zaklady-v1-q2',
    'derivace-zaklady-v1',
    2,
    '{"instruction":"Urči derivaci funkce:","math":"f(x)=5x^4-3x^2+7","category":"Základní vzorce","hint":"Derivuj každý člen zvlášť a konstantu nezapomeň převést na nulu."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=20x^3-6x]]"},{"id":"b","label":"[[math:f\u0027(x)=5x^3-3x]]"},{"id":"c","label":"[[math:f\u0027(x)=20x^4-6x^2]]"},{"id":"d","label":"[[math:f\u0027(x)=20x^3-6x+7]]"}]',
    'a',
    'Použijeme mocninné pravidlo [[math:(x^n)\u0027=nx^{n-1}]]. Dostaneme [[math:20x^3-6x]], konstanta 7 má derivaci 0.',
    2
  ),
  (
    'derivace-zaklady-v1-q3',
    'derivace-zaklady-v1',
    3,
    '{"instruction":"Urči derivaci funkce:","math":"f(x)=\\sqrt{x}+\\frac{1}{x}","category":"Základní vzorce","hint":"Přepiš odmocninu a převrácenou hodnotu jako mocniny x."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=\\frac{1}{2\\sqrt{x}}-\\frac{1}{x^2}]]"},{"id":"b","label":"[[math:f\u0027(x)=\\frac{1}{\\sqrt{x}}+\\frac{1}{x^2}]]"},{"id":"c","label":"[[math:f\u0027(x)=2\\sqrt{x}-x^2]]"},{"id":"d","label":"[[math:f\u0027(x)=\\frac{1}{2\\sqrt{x}}+\\frac{1}{x^2}]]"}]',
    'a',
    'Platí [[math:\\sqrt{x}=x^{1/2}]] a [[math:1/x=x^{-1}]]. Proto [[math:f\u0027(x)=\\frac12x^{-1/2}-x^{-2}=\\frac{1}{2\\sqrt{x}}-\\frac{1}{x^2}]].',
    2
  ),
  (
    'derivace-zaklady-v1-q4',
    'derivace-zaklady-v1',
    4,
    '{"instruction":"Urči derivaci součinu:","math":"f(x)=x^2\\sin x","category":"Součin a podíl","hint":"U součinu se derivují oba činitelé: jednou první a podruhé druhý."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=2x\\sin x+x^2\\cos x]]"},{"id":"b","label":"[[math:f\u0027(x)=2x\\cos x]]"},{"id":"c","label":"[[math:f\u0027(x)=x^2\\cos x]]"},{"id":"d","label":"[[math:f\u0027(x)=2x\\sin x-x^2\\cos x]]"}]',
    'a',
    'Použijeme pravidlo pro součin [[math:(uv)\u0027=u\u0027v+uv\u0027]]. Pro [[math:u=x^2]] a [[math:v=\\sin x]] vyjde [[math:2x\\sin x+x^2\\cos x]].',
    2
  ),
  (
    'derivace-zaklady-v1-q5',
    'derivace-zaklady-v1',
    5,
    '{"instruction":"Urči derivaci podílu:","math":"f(x)=\\frac{x^2+1}{x}","category":"Součin a podíl","hint":"Můžeš použít pravidlo pro podíl, nebo si funkci nejprve upravit na x + 1/x."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=1-\\frac{1}{x^2}]]"},{"id":"b","label":"[[math:f\u0027(x)=1+\\frac{1}{x^2}]]"},{"id":"c","label":"[[math:f\u0027(x)=\\frac{2x}{x}]]"},{"id":"d","label":"[[math:f\u0027(x)=\\frac{x^2-1}{x}]]"}]',
    'a',
    'Nejrychleji [[math:f(x)=x+x^{-1}]], takže [[math:f\u0027(x)=1-x^{-2}=1-\\frac{1}{x^2}]].',
    2
  ),
  (
    'derivace-zaklady-v1-q6',
    'derivace-zaklady-v1',
    6,
    '{"instruction":"Urči derivaci složené funkce:","math":"f(x)=(3x^2+1)^5","category":"Složená funkce","hint":"Nejprve derivuj vnější mocninu a potom násob derivací vnitřní funkce."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=30x(3x^2+1)^4]]"},{"id":"b","label":"[[math:f\u0027(x)=5(3x^2+1)^4]]"},{"id":"c","label":"[[math:f\u0027(x)=6x(3x^2+1)^5]]"},{"id":"d","label":"[[math:f\u0027(x)=15x(3x^2+1)^4]]"}]',
    'a',
    'Řetězové pravidlo dává [[math:5(3x^2+1)^4\\cdot6x=30x(3x^2+1)^4]].',
    2
  ),
  (
    'derivace-zaklady-v1-q7',
    'derivace-zaklady-v1',
    7,
    '{"instruction":"Která derivace je správná?","math":"f(x)=e^{2x}+\\ln x-\\cos x","category":"Základní vzorce","hint":"U exponenciály použij řetězové pravidlo. Pozor na znaménko u derivace cosinu."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=2e^{2x}+\\frac1x+\\sin x]]"},{"id":"b","label":"[[math:f\u0027(x)=e^{2x}+\\frac1x-\\sin x]]"},{"id":"c","label":"[[math:f\u0027(x)=2e^{2x}+\\ln x+\\sin x]]"},{"id":"d","label":"[[math:f\u0027(x)=2e^{2x}+x+\\sin x]]"}]',
    'a',
    'Platí [[math:(e^{2x})\u0027=2e^{2x}]], [[math:(\\ln x)\u0027=1/x]] a [[math:(-\\cos x)\u0027=+\\sin x]].',
    2
  ),
  (
    'derivace-zaklady-v1-q8',
    'derivace-zaklady-v1',
    8,
    '{"instruction":"Urči rovnici tečny ke grafu funkce v bodě s x = 1:","math":"f(x)=x^2+1","category":"Význam derivace","hint":"Potřebuješ bod na grafu a směrnici tečny, tedy hodnotu derivace v daném bodě."}',
    '[{"id":"a","label":"[[math:y=2x]]"},{"id":"b","label":"[[math:y=2x+1]]"},{"id":"c","label":"[[math:y=x+1]]"},{"id":"d","label":"[[math:y=2x-1]]"}]',
    'a',
    'Bod dotyku je [[math:(1,2)]]. Derivace je [[math:f\u0027(x)=2x]], tedy směrnice v bodě 1 je 2. Z [[math:y-2=2(x-1)]] dostaneme [[math:y=2x]].',
    2
  ),
  (
    'derivace-zaklady-v1-q9',
    'derivace-zaklady-v1',
    9,
    '{"instruction":"Funkce má derivaci:","math":"f\u0027(x)=3(x-1)(x+2)","category":"Aplikace derivace","hint":"Znaménko derivace určuje růst a pokles funkce. Kritické body jsou x = -2 a x = 1."}',
    '[{"id":"a","label":"Funkce roste na (-∞; -2) a (1; ∞), klesá na (-2; 1)."},{"id":"b","label":"Funkce klesá na (-∞; -2) a (1; ∞), roste na (-2; 1)."},{"id":"c","label":"Funkce roste na celé R."},{"id":"d","label":"Funkce klesá na celé R."}]',
    'a',
    'Pro [[math:x<-2]] jsou oba závorkové výrazy záporné, takže derivace je kladná. Mezi -2 a 1 je záporná a pro [[math:x>1]] opět kladná.',
    2
  ),
  (
    'derivace-zaklady-v1-q10',
    'derivace-zaklady-v1',
    10,
    '{"instruction":"Urči derivaci funkce:","math":"f(x)=\\ln(x^2+1)","category":"Složená funkce","hint":"Derivace ln u je u´/u."}',
    '[{"id":"a","label":"[[math:f\u0027(x)=\\frac{2x}{x^2+1}]]"},{"id":"b","label":"[[math:f\u0027(x)=\\frac{1}{x^2+1}]]"},{"id":"c","label":"[[math:f\u0027(x)=2x\\ln(x^2+1)]]"},{"id":"d","label":"[[math:f\u0027(x)=\\frac{x^2+1}{2x}]]"}]',
    'a',
    'Pro [[math:u=x^2+1]] platí [[math:(\\ln u)\u0027=u\u0027/u]]. Proto [[math:f\u0027(x)=\\frac{2x}{x^2+1}]].',
    2
  );
