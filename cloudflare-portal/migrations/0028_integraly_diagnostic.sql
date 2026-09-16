PRAGMA foreign_keys = ON;

-- Diagnostic test focused on indefinite integrals, a basic definite integral,
-- simple substitution and integration by parts.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'integraly-zaklady-v1',
  'integraly-zaklady',
  1,
  'Integrály — diagnostika',
  '[[calculator:Bez kalkulačky]]Diagnostický test na základní neurčité integrály, jednu jednoduchou práci s určitým integrálem, jednoduchou substituci a metodu per partes. Celkem 20 bodů.',
  'Matematika',
  'Integrály',
  'SŠ / VŠ základ',
  18,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'integraly-zaklady-v1-q1',
    'integraly-zaklady-v1',
    1,
    '{"instruction":"Která funkce je primitivní k funkci:","math":"f(x)=6x^2-4x+3","category":"Základní integrály","hint":"Hledej funkci, jejíž derivace je přesně zadané f(x)."}',
    '[{"id":"a","label":"[[math:F(x)=2x^3-2x^2+3x+C]]"},{"id":"b","label":"[[math:F(x)=6x^3-4x^2+3x+C]]"},{"id":"c","label":"[[math:F(x)=3x^2-2x+3+C]]"},{"id":"d","label":"[[math:F(x)=2x^3-4x^2+3x+C]]"}]',
    'a',
    'Po zderivování [[math:2x^3-2x^2+3x+C]] dostaneme [[math:6x^2-4x+3]].',
    2
  ),
  (
    'integraly-zaklady-v1-q2',
    'integraly-zaklady-v1',
    2,
    '{"instruction":"Vypočítej neurčitý integrál:","math":"\\int (4x^3-6x+2)\\,dx","category":"Základní integrály","hint":"Integruj člen po členu a u mocnin zvyš exponent o 1."}',
    '[{"id":"a","label":"[[math:x^4-3x^2+2x+C]]"},{"id":"b","label":"[[math:4x^4-6x^2+2x+C]]"},{"id":"c","label":"[[math:x^4-6x^2+2+C]]"},{"id":"d","label":"[[math:12x^2-6+C]]"}]',
    'a',
    'Platí [[math:\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C]] pro [[math:n\\neq-1]]. Po jednotlivých členech dostaneme [[math:x^4-3x^2+2x+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q3',
    'integraly-zaklady-v1',
    3,
    '{"instruction":"Vypočítej neurčitý integrál:","math":"\\int \\left(\\frac{3}{x}+2e^x-\\sin x\\right)dx","category":"Základní integrály","hint":"Použij základní vzorce pro 1/x, exponenciálu a sinus."}',
    '[{"id":"a","label":"[[math:3\\ln|x|+2e^x+\\cos x+C]]"},{"id":"b","label":"[[math:\\frac{3}{x^2}+2e^x-\\cos x+C]]"},{"id":"c","label":"[[math:3\\ln|x|+2e^x-\\cos x+C]]"},{"id":"d","label":"[[math:3\\ln x+e^{2x}+\\cos x+C]]"}]',
    'a',
    'Použijeme [[math:\\int \\frac1x dx=\\ln|x|+C]], [[math:\\int e^x dx=e^x+C]] a [[math:\\int -\\sin x\\,dx=\\cos x+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q4',
    'integraly-zaklady-v1',
    4,
    '{"instruction":"Vypočítej neurčitý integrál:","math":"\\int \\sqrt{x}\\,dx","category":"Základní integrály","hint":"Přepiš odmocninu jako x^(1/2) a použij mocninné pravidlo."}',
    '[{"id":"a","label":"[[math:\\frac{2}{3}x^{3/2}+C]]"},{"id":"b","label":"[[math:2\\sqrt{x}+C]]"},{"id":"c","label":"[[math:\\frac{1}{2\\sqrt{x}}+C]]"},{"id":"d","label":"[[math:\\frac{3}{2}x^{2/3}+C]]"}]',
    'a',
    'Protože [[math:\\sqrt{x}=x^{1/2}]], vyjde [[math:\\int x^{1/2}dx=\\frac{x^{3/2}}{3/2}=\\frac23x^{3/2}+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q5',
    'integraly-zaklady-v1',
    5,
    '{"instruction":"Vypočítej neurčitý integrál:","math":"\\int x^{-2}\\,dx","category":"Základní integrály","hint":"Použij mocninné pravidlo. Výjimkou je pouze exponent -1."}',
    '[{"id":"a","label":"[[math:-\\frac1x+C]]"},{"id":"b","label":"[[math:\\frac1x+C]]"},{"id":"c","label":"[[math:-2x^{-3}+C]]"},{"id":"d","label":"[[math:\\ln|x|+C]]"}]',
    'a',
    'Pro [[math:n=-2]] platí [[math:\\int x^{-2}dx=\\frac{x^{-1}}{-1}=-x^{-1}=-\\frac1x+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q6',
    'integraly-zaklady-v1',
    6,
    '{"instruction":"Vypočítej určitý integrál:","math":"\\int_0^2 (3x^2+1)\\,dx","category":"Určitý integrál","hint":"Najdi primitivní funkci a dosaď horní a dolní mez."}',
    '[{"id":"a","label":"[[math:10]]"},{"id":"b","label":"[[math:8]]"},{"id":"c","label":"[[math:12]]"},{"id":"d","label":"[[math:6]]"}]',
    'a',
    'Primitivní funkce je [[math:F(x)=x^3+x]]. Proto [[math:F(2)-F(0)=8+2=10]].',
    2
  ),
  (
    'integraly-zaklady-v1-q7',
    'integraly-zaklady-v1',
    7,
    '{"instruction":"Vypočítej integrál jednoduchou substitucí:","math":"\\int 2x\\cos(x^2)\\,dx","category":"Substituce","hint":"Polož u=x^2. Pak du=2x dx."}',
    '[{"id":"a","label":"[[math:\\sin(x^2)+C]]"},{"id":"b","label":"[[math:2\\sin(x^2)+C]]"},{"id":"c","label":"[[math:x^2\\sin(x^2)+C]]"},{"id":"d","label":"[[math:-\\sin(x^2)+C]]"}]',
    'a',
    'Při substituci [[math:u=x^2]], [[math:du=2x\\,dx]] se integrál změní na [[math:\\int \\cos u\\,du=\\sin u+C]], tedy [[math:\\sin(x^2)+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q8',
    'integraly-zaklady-v1',
    8,
    '{"instruction":"Vypočítej integrál jednoduchou substitucí:","math":"\\int \\frac{3}{3x+1}\\,dx","category":"Substituce","hint":"Polož u=3x+1. V čitateli už máš přesně derivaci jmenovatele."}',
    '[{"id":"a","label":"[[math:\\ln|3x+1|+C]]"},{"id":"b","label":"[[math:3\\ln|3x+1|+C]]"},{"id":"c","label":"[[math:\\frac13\\ln|3x+1|+C]]"},{"id":"d","label":"[[math:\\frac{3}{(3x+1)^2}+C]]"}]',
    'a',
    'Položíme [[math:u=3x+1]], takže [[math:du=3\\,dx]]. Dostaneme [[math:\\int \\frac{du}{u}=\\ln|u|+C=\\ln|3x+1|+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q9',
    'integraly-zaklady-v1',
    9,
    '{"instruction":"Vypočítej integrál metodou per partes:","math":"\\int xe^x\\,dx","category":"Per partes","hint":"Zvol u=x a dv=e^x dx."}',
    '[{"id":"a","label":"[[math:e^x(x-1)+C]]"},{"id":"b","label":"[[math:xe^x+C]]"},{"id":"c","label":"[[math:e^x(x+1)+C]]"},{"id":"d","label":"[[math:\\frac{x^2}{2}e^x+C]]"}]',
    'a',
    'Použijeme [[math:\\int u\\,dv=uv-\\int v\\,du]]. Pro [[math:u=x]], [[math:dv=e^x dx]] dostaneme [[math:xe^x-\\int e^x dx=e^x(x-1)+C]].',
    2
  ),
  (
    'integraly-zaklady-v1-q10',
    'integraly-zaklady-v1',
    10,
    '{"instruction":"Vypočítej integrál metodou per partes:","math":"\\int x\\cos x\\,dx","category":"Per partes","hint":"Zvol u=x a dv=cos x dx."}',
    '[{"id":"a","label":"[[math:x\\sin x+\\cos x+C]]"},{"id":"b","label":"[[math:x\\sin x-\\cos x+C]]"},{"id":"c","label":"[[math:\\sin x+x\\cos x+C]]"},{"id":"d","label":"[[math:x\\cos x+\\sin x+C]]"}]',
    'a',
    'Pro [[math:u=x]] a [[math:dv=\\cos x\\,dx]] je [[math:du=dx]] a [[math:v=\\sin x]]. Tedy [[math:x\\sin x-\\int \\sin x\\,dx=x\\sin x+\\cos x+C]].',
    2
  );
