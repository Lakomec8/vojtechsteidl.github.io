PRAGMA foreign_keys = ON;

-- Diagnostic focused on the prerequisites for ordinary and partial differential equations.
-- Library only: no student assignment is created here.
INSERT OR IGNORE INTO self_check_tests (
  id, slug, version, title, description, subject, topic, level, estimated_minutes, status
) VALUES (
  'diferencialni-rovnice-ode-pde-v1',
  'diferencialni-rovnice-ode-pde',
  1,
  'Diferenciální rovnice — ODE a základy PDE',
  '[[calculator:Bez kalkulačky]]Diagnostický test na separovatelné obyčejné diferenciální rovnice, práci s logaritmem a exponenciálou, počáteční podmínky, parciální derivace a základní orientaci v PDE. Celkem 24 bodů.',
  'Matematika',
  'Diferenciální rovnice',
  'VŠ základ',
  22,
  'published'
);

INSERT OR IGNORE INTO self_check_questions
  (id, test_id, position, prompt, options_json, correct_answer, explanation, points)
VALUES
  (
    'diferencialni-rovnice-ode-pde-v1-q1',
    'diferencialni-rovnice-ode-pde-v1',
    1,
    '{"instruction":"Která funkce je obecným řešením diferenciální rovnice?","math":"y''=0","category":"ODE — význam řešení","hint":"Hledej funkci, jejíž druhá derivace je nulová."}',
    '[{"id":"a","label":"[[math:y=C_1x+C_2]]"},{"id":"b","label":"[[math:y=Ce^x]]"},{"id":"c","label":"[[math:y=Cx^2]]"},{"id":"d","label":"[[math:y=\\\\sin x+C]]"}]',
    'a',
    'Je-li [[math:y''''=0]], pak [[math:y''=C_1]] a po další integraci [[math:y=C_1x+C_2]]. Rovnice druhého řádu proto obsahuje dvě integrační konstanty.',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q2',
    'diferencialni-rovnice-ode-pde-v1',
    2,
    '{"instruction":"Vyřeš separovatelnou diferenciální rovnici:","math":"y''=3y","category":"ODE — exponenciální růst","hint":"Přepiš rovnici jako dy/y = 3 dx a integruj obě strany."}',
    '[{"id":"a","label":"[[math:y=Ce^{3x}]]"},{"id":"b","label":"[[math:y=3Ce^x]]"},{"id":"c","label":"[[math:y=Cx^3]]"},{"id":"d","label":"[[math:y=Ce^{x/3}]]"}]',
    'a',
    'Po separaci [[math:\\\\frac{dy}{y}=3\\\\,dx]] dostaneme [[math:\\\\ln|y|=3x+C]], tedy [[math:y=Ce^{3x}]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q3',
    'diferencialni-rovnice-ode-pde-v1',
    3,
    '{"instruction":"Vyřeš diferenciální rovnici:","math":"y''=2xy","category":"ODE — separace proměnných","hint":"Po separaci vznikne na levé straně integrál 1/y a na pravé 2x."}',
    '[{"id":"a","label":"[[math:y=Ce^{x^2}]]"},{"id":"b","label":"[[math:y=Ce^{2x}]]"},{"id":"c","label":"[[math:y=Cx^2]]"},{"id":"d","label":"[[math:y=e^{x^2}+C]]"}]',
    'a',
    'Separací dostaneme [[math:\\\\frac{dy}{y}=2x\\\\,dx]]. Po integraci [[math:\\\\ln|y|=x^2+C]], takže [[math:y=Ce^{x^2}]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q4',
    'diferencialni-rovnice-ode-pde-v1',
    4,
    '{"instruction":"Vyřeš diferenciální rovnici pro x ≠ 0:","math":"y''=\\\\frac{y}{x}","category":"ODE — logaritmus","hint":"Po separaci dostaneš integrál 1/y na jedné straně a 1/x na druhé."}',
    '[{"id":"a","label":"[[math:y=Cx]]"},{"id":"b","label":"[[math:y=C\\\\ln|x|]]"},{"id":"c","label":"[[math:y=Ce^x]]"},{"id":"d","label":"[[math:y=\\\\frac{C}{x}]]"}]',
    'a',
    'Platí [[math:\\\\frac{dy}{y}=\\\\frac{dx}{x}]], tedy [[math:\\\\ln|y|=\\\\ln|x|+C]]. Po exponenciaci lze konstanty spojit a dostaneme [[math:y=Cx]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q5',
    'diferencialni-rovnice-ode-pde-v1',
    5,
    '{"instruction":"Najdi řešení počáteční úlohy:","math":"y''=2y,\\\\qquad y(0)=3","category":"ODE — počáteční podmínka","hint":"Nejprve najdi obecné řešení a potom dosaď x = 0."}',
    '[{"id":"a","label":"[[math:y=3e^{2x}]]"},{"id":"b","label":"[[math:y=2e^{3x}]]"},{"id":"c","label":"[[math:y=3e^x]]"},{"id":"d","label":"[[math:y=e^{2x}+3]]"}]',
    'a',
    'Obecné řešení je [[math:y=Ce^{2x}]]. Z podmínky [[math:y(0)=3]] plyne [[math:C=3]], takže [[math:y=3e^{2x}]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q6',
    'diferencialni-rovnice-ode-pde-v1',
    6,
    '{"instruction":"Který zápis správně odděluje proměnné v rovnici?","math":"y''=y(1-y)","category":"ODE — logistická rovnice","hint":"Všechny výrazy s y přesuň k dy a výrazy s x k dx."}',
    '[{"id":"a","label":"[[math:\\\\frac{dy}{y(1-y)}=dx]]"},{"id":"b","label":"[[math:\\\\frac{dy}{y}= (1-y)dx]]"},{"id":"c","label":"[[math:y\\\\,dy=(1-y)dx]]"},{"id":"d","label":"[[math:\\\\frac{dy}{1-y}=y\\\\,dx]]"}]',
    'a',
    'Pro úplnou separaci musí být na levé straně pouze funkce proměnné y. Vydělením výrazem [[math:y(1-y)]] vznikne [[math:\\\\frac{dy}{y(1-y)}=dx]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q7',
    'diferencialni-rovnice-ode-pde-v1',
    7,
    '{"instruction":"Vyřeš diferenciální rovnici:","math":"y''=\\\\frac{2x}{x^2+1}y","category":"ODE — integrál typu f''/f","hint":"Po separaci se na pravé straně objeví integrál, kde je čitatel derivací jmenovatele."}',
    '[{"id":"a","label":"[[math:y=C(x^2+1)]]"},{"id":"b","label":"[[math:y=C\\\\ln(x^2+1)]]"},{"id":"c","label":"[[math:y=Ce^{x^2+1}]]"},{"id":"d","label":"[[math:y=\\\\frac{C}{x^2+1}]]"}]',
    'a',
    'Po separaci [[math:\\\\frac{dy}{y}=\\\\frac{2x}{x^2+1}dx]]. Pravý integrál je [[math:\\\\ln(x^2+1)]], takže [[math:\\\\ln|y|=\\\\ln(x^2+1)+C]] a tedy [[math:y=C(x^2+1)]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q8',
    'diferencialni-rovnice-ode-pde-v1',
    8,
    '{"instruction":"Pro funkci spočítej obě parciální derivace prvního řádu:","math":"u(x,t)=x^2t+3t^2","category":"PDE — parciální derivace","hint":"Při derivování podle x považuj t za konstantu a naopak."}',
    '[{"id":"a","label":"[[math:u_x=2xt,\\\\quad u_t=x^2+6t]]"},{"id":"b","label":"[[math:u_x=2x+3t^2,\\\\quad u_t=x^2+6]]"},{"id":"c","label":"[[math:u_x=2xt+6t,\\\\quad u_t=x^2]]"},{"id":"d","label":"[[math:u_x=x^2,\\\\quad u_t=2xt+6t]]"}]',
    'a',
    'Při derivaci podle [[math:x]] je [[math:t]] konstanta, proto [[math:u_x=2xt]]. Při derivaci podle [[math:t]] je [[math:x]] konstanta, takže [[math:u_t=x^2+6t]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q9',
    'diferencialni-rovnice-ode-pde-v1',
    9,
    '{"instruction":"Pro funkci urči časovou a druhou prostorovou derivaci:","math":"u(x,t)=e^{-t}\\\\sin x","category":"PDE — druhé derivace","hint":"Nejprve derivuj podle t. Pro u_xx derivuj dvakrát podle x."}',
    '[{"id":"a","label":"[[math:u_t=-e^{-t}\\\\sin x,\\\\quad u_{xx}=-e^{-t}\\\\sin x]]"},{"id":"b","label":"[[math:u_t=e^{-t}\\\\sin x,\\\\quad u_{xx}=e^{-t}\\\\sin x]]"},{"id":"c","label":"[[math:u_t=-e^{-t}\\\\cos x,\\\\quad u_{xx}=-e^{-t}\\\\cos x]]"},{"id":"d","label":"[[math:u_t=-te^{-t}\\\\sin x,\\\\quad u_{xx}=e^{-t}\\\\cos x]]"}]',
    'a',
    'Derivace [[math:e^{-t}]] podle [[math:t]] je [[math:-e^{-t}]]. Dvakrát derivovaný sinus podle [[math:x]] dá [[math:-\\\\sin x]], takže obě derivace jsou [[math:-e^{-t}\\\\sin x]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q10',
    'diferencialni-rovnice-ode-pde-v1',
    10,
    '{"instruction":"Které tvrzení o rovnici je správné?","math":"u_t=\\\\alpha u_{xx}","category":"PDE — klasifikace","hint":"Řád rovnice určuje nejvyšší derivace, která se v ní vyskytuje."}',
    '[{"id":"a","label":"Je to parciální diferenciální rovnice druhého řádu."},{"id":"b","label":"Je to obyčejná diferenciální rovnice prvního řádu."},{"id":"c","label":"Je to parciální diferenciální rovnice prvního řádu."},{"id":"d","label":"Nejde o diferenciální rovnici."}]',
    'a',
    'Rovnice obsahuje parciální derivace a nejvyšší z nich je [[math:u_{xx}]], tedy derivace druhého řádu. Jde o klasickou rovnici vedení tepla.',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q11',
    'diferencialni-rovnice-ode-pde-v1',
    11,
    '{"instruction":"Rozhodni, zda je funkce řešením rovnice:","math":"u(x,t)=e^{-4t}\\\\sin(2x),\\\\qquad u_t=u_{xx}","category":"PDE — ověření řešení","hint":"Spočítej u_t a u_xx a porovnej je."}',
    '[{"id":"a","label":"Ano, protože [[math:u_t=u_{xx}=-4e^{-4t}\\\\sin(2x)]]."},{"id":"b","label":"Ne, protože [[math:u_t=-4e^{-4t}\\\\sin(2x)]] a [[math:u_{xx}=-2e^{-4t}\\\\sin(2x)]]."},{"id":"c","label":"Ano, protože obě derivace jsou nulové."},{"id":"d","label":"Ne, protože časová a prostorová derivace se nikdy nemohou rovnat."}]',
    'a',
    'Platí [[math:u_t=-4e^{-4t}\\\\sin(2x)]]. Dvojí derivace [[math:\\\\sin(2x)]] podle [[math:x]] také přinese faktor [[math:-4]], takže [[math:u_{xx}=-4e^{-4t}\\\\sin(2x)]].',
    2
  ),
  (
    'diferencialni-rovnice-ode-pde-v1-q12',
    'diferencialni-rovnice-ode-pde-v1',
    12,
    '{"instruction":"Při separaci proměnných pro rovnici vedení tepla předpokládáme u(x,t)=X(x)T(t). Co dostaneme po dosazení do u_t=αu_xx a vydělení αXT?","category":"PDE — separace proměnných","hint":"Levá strana musí záviset jen na t a pravá jen na x."}',
    '[{"id":"a","label":"[[math:\\\\frac{T''}{\\\\alpha T}=\\\\frac{X''''}{X}=\\\\text{konst.}]]"},{"id":"b","label":"[[math:\\\\frac{T}{X}=\\\\alpha\\\\frac{X}{T}]]"},{"id":"c","label":"[[math:\\\\frac{T''}{T}=\\\\alpha X'''']]"},{"id":"d","label":"[[math:X''T''=\\\\alpha XT]]"}]',
    'a',
    'Po dosazení je [[math:XT''=\\\\alpha X''''T]]. Po vydělení [[math:\\\\alpha XT]] dostaneme [[math:\\\\frac{T''}{\\\\alpha T}=\\\\frac{X''''}{X}]]. Jedna strana závisí jen na čase a druhá jen na prostoru, proto se obě musí rovnat konstantě.',
    2
  );