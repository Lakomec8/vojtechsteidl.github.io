import { PortalError, principalForRequest, privateHeaders } from "./entry";

const ROOT = "/student-portal/admin/self-checks";
type Assignment = { id: string; student_id: string; display_name: string; test_id: string; title: string; topic: string };
type Attempt = { id: string; score: number; max_score: number; submitted_at: string; is_partial: number; answered_count: number | null; total_questions: number | null; full_max_score: number | null };
type Answer = { position: number; prompt: string; options_json: string; correct_answer: string; explanation: string; points: number; answer_value: string | null; is_correct: number | null; points_awarded: number | null };
type Option = { id: string; label: string };
type Prompt = { instruction: string; math: string; category: string };

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c] || c);
}
function markedText(value: unknown): string {
  return esc(value).replace(/\[\[math:(.*?)\]\]/g, (_match, math: string) =>
    '<span data-tex="' + esc(math) + '">' + esc(math) + '</span>');
}
function readPrompt(raw: string): Prompt {
  try {
    const object: unknown = JSON.parse(raw);
    if (object && typeof object === "object" && !Array.isArray(object)) {
      const p = object as Record<string, unknown>;
      if (typeof p.instruction === "string") return {
        instruction: p.instruction,
        math: typeof p.math === "string" ? p.math : "",
        category: typeof p.category === "string" ? p.category : "",
      };
    }
  } catch { /* Older questions are plain text. */ }
  return { instruction: raw, math: "", category: "" };
}
function readOptions(raw: string): Option[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is Option => !!v && typeof v === "object" && typeof v.id === "string" && typeof v.label === "string");
  } catch { return []; }
}
function dateLabel(input: string): string {
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return input;
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague", day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(d);
}
function scoreLabel(score: number, max: number): string {
  return score + "/" + max + " b. (" + (max ? Math.round(100 * score / max) : 0) + " %)";
}
function resultUrl(assignmentId: string, attemptId?: string, errorsOnly = false): string {
  const path = ROOT + "/results/" + encodeURIComponent(assignmentId);
  return attemptId ? path + "?attempt=" + encodeURIComponent(attemptId) + (errorsOnly ? "&filter=errors" : "") : path;
}

function renderQuestion(q: Answer): string {
  const p = readPrompt(q.prompt);
  const options = readOptions(q.options_json);
  const chosen = q.answer_value ?? "";
  const status = q.is_correct === null ? "Bez odpovědi" : q.is_correct === 1 ? "Správně" : "Chybně";
  const type = q.is_correct === null ? "missing" : q.is_correct === 1 ? "correct" : "incorrect";
  const list = options.length ? '<ul class="options">' + options.map(o => {
    const isChosen = o.id === chosen, isCorrect = o.id === q.correct_answer;
    const state = isCorrect ? " correct-option" : isChosen ? " chosen-option" : "";
    const statusText = isChosen && isCorrect ? "Vybráno · správně" : isCorrect ? "Správná odpověď" : isChosen ? "Vybráno studentem" : "";
    return '<li class="option' + state + '"><b>' + esc(o.id.toUpperCase()) + '</b><span>' + markedText(o.label) +
      '</span>' + (statusText ? '<small>' + statusText + '</small>' : "") + '</li>';
  }).join("") + '</ul>'
  : '<p>Odpověď: ' + esc(chosen || "bez odpovědi") + ' · Správně: ' + esc(q.correct_answer) + '</p>';
  return '<article class="question ' + type + '"><div class="q-header"><span>Úloha ' + q.position + '</span>' +
    '<b class="pill">' + status + '</b><small class="pts">' + (q.points_awarded ?? 0) + '/' + q.points + ' b.</small></div>' +
    (p.category ? '<div class="category">' + esc(p.category) + '</div>' : '') +
    '<h3>' + markedText(p.instruction) + '</h3>' +
    (p.math ? '<div class="math" data-tex="' + esc(p.math) + '">' + esc(p.math) + '</div>' : "") +
    list + '<div class="explanation"><strong>Vysvětlení:</strong> ' + markedText(q.explanation || "Není uvedeno.") + '</div></article>';
}

const css = '*,*:before,*:after{box-sizing:border-box}body{margin:0;background:#f5f7f9;color:#203449;font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}main{width:min(1040px,calc(100% - 32px));margin:28px auto 75px}a{color:#2b597f;text-decoration:none}a:hover{text-decoration:underline}.back{font-weight:700}.head{margin:25px 0;border-bottom:1px solid #dbe3e9;padding-bottom:22px}.eyebrow{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#637689;font-weight:800}h1{margin:4px 0;font-size:clamp(24px,4vw,36px);letter-spacing:-.04em;line-height:1.25;color:#153048}h2{margin:0 0 12px;font-size:19px;color:#153048}h3{margin:3px 0 12px;font-size:17px;color:#18334b}.muted{color:#657a8c;margin:0}.panel,.question{border:1px solid #dbe3e9;border-radius:11px;padding:22px;background:#fff;margin:15px 0}.attempts,.focus,.toolbar{display:flex;flex-wrap:wrap;gap:8px}.attempts{margin-top:12px}.attempt{display:flex;flex-direction:column;min-width:175px;padding:10px 13px;border:1px solid #d8e1e8;border-radius:8px;font-size:13px;font-weight:750}.attempt small{color:#688095;font-weight:400;font-size:11px}.attempt.active{border-color:#366991;background:#edf4fa}.stats{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dbe3e9;border-radius:7px;overflow:hidden;margin:16px 0}.stat{padding:13px 18px}.stat+.stat{border-left:1px solid #dbe3e9}.stat span{display:block;font-size:12px;color:#68798a}.stat strong{font-size:23px;color:#18334b}.focus{margin-top:10px}.focus span{font-size:12px;border:1px solid #dbe3e9;background:#f7f9fb;border-radius:7px;padding:6px 10px}.toolbar{align-items:center;margin:24px 0 12px}.toolbar strong{margin-right:8px}.filter{background:white;padding:7px 12px;border:1px solid #cbd8e2;border-radius:7px;font-weight:750}.filter.active{background:#203f5c;color:white;border-color:#203f5c}.question.correct{border-left:4px solid #468065}.question.incorrect{border-left:4px solid #b85c42}.question.missing{border-left:4px solid #9aa4ad}.q-header{display:flex;gap:10px;align-items:center;margin-bottom:12px;font-size:12px;color:#5e7083}.pill{padding:3px 10px;border-radius:20px;background:#eef6f0;color:#276447}.incorrect .pill{background:#fff0eb;color:#9f4833}.missing .pill{background:#eceff2;color:#596977}.pts{margin-left:auto}.category{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6e8291;font-weight:700;margin-bottom:9px}.math{font-size:19px;color:#173f61;overflow-x:auto;margin-bottom:13px}.options{list-style:none;margin:12px 0;padding:0;display:grid;gap:7px}.option{display:flex;align-items:flex-start;gap:13px;padding:9px 11px;border:1px solid #e6ebf0;border-radius:7px}.option b{color:#586c7f}.option span{flex:1;min-width:0}.option small{font-size:11px;color:#62798b;text-align:right;font-weight:700}.option.correct-option{background:#edf8f1;border-color:#afd4bc}.option.chosen-option{background:#fff3ee;border-color:#e2b5a7}.explanation{font-size:13px;color:#43586b;background:#f7f9fb;padding:12px 15px;border-left:2px solid #9caebe;margin-top:15px}.note{font-size:12px;color:#6d7e8d;margin-top:20px}.empty{background:#fff;border:1px dashed #b5c4cf;border-radius:9px;padding:20px;color:#607385}.partial-warning{margin:12px 0;padding:12px 15px;border:1px solid #bcd1e5;border-radius:8px;background:#eef5fc;color:#23465e;font-size:13px}@media(max-width:600px){main{width:calc(100% - 20px)}.panel,.question{padding:15px}.stats{grid-template-columns:1fr}.stat+.stat{border-left:0;border-top:1px solid #dbe3e9}.option{flex-wrap:wrap}.option small{margin-left:27px;text-align:left}}';

export async function adminSelfCheckResults(request: Request, env: Env, assignmentId: string): Promise<Response> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  if (request.method !== "GET") throw new PortalError(405, "Method not allowed.");
  if (!assignmentId || assignmentId.length > 160) throw new PortalError(404, "Assignment was not found.");

  const assignment = await env.DB.prepare(
    "SELECT a.id, a.student_id, s.display_name, a.test_id, t.title, t.topic FROM self_check_assignments a " +
    "JOIN students s ON s.id = a.student_id JOIN self_check_tests t ON t.id = a.test_id " +
    "WHERE a.id = ?1 LIMIT 1"
  ).bind(assignmentId).first<Assignment>();
  if (!assignment) throw new PortalError(404, "Assignment was not found.");

  const history = await env.DB.prepare(
    "SELECT id, score, max_score, submitted_at, is_partial, answered_count, total_questions, full_max_score FROM self_check_attempts " +
    "WHERE assignment_id = ?1 AND student_id = ?2 AND test_id = ?3 ORDER BY submitted_at DESC, id DESC LIMIT 100"
  ).bind(assignment.id, assignment.student_id, assignment.test_id).all<Attempt>();
  const attempts = history.results || [];
  const url = new URL(request.url), requested = url.searchParams.get("attempt");
  const selected = requested ? attempts.find((item) => item.id === requested) : attempts[0];
  if (requested && !selected) throw new PortalError(404, "Attempt was not found.");
  const errorsOnly = url.searchParams.get("filter") === "errors";

  const results = selected ? await env.DB.prepare(
    "SELECT q.position, q.prompt, q.options_json, q.correct_answer, q.explanation, q.points, " +
    "ans.answer_value, ans.is_correct, ans.points_awarded FROM self_check_questions q " +
    "LEFT JOIN self_check_answers ans ON ans.question_id = q.id AND ans.attempt_id = ?1 " +
    "WHERE q.test_id = ?2 ORDER BY q.position"
  ).bind(selected.id, assignment.test_id).all<Answer>() : null;
  const allQuestions = results?.results || [];
  // Unanswered questions from a partial attempt are not errors and should
  // not disclose the solutions to questions the student never attempted.
  const answers = selected?.is_partial === 1
    ? allQuestions.filter((item) => item.is_correct !== null)
    : allQuestions;
  const correctCount = answers.filter((a) => a.is_correct === 1).length;
  const wrongCount = answers.filter((a) => a.is_correct === 0).length;

  const categoryStats = new Map<string, { total: number; wrong: number }>();
  for (const answer of answers) {
    const category = readPrompt(answer.prompt).category || "Ostatní úlohy";
    const counter = categoryStats.get(category) || { total: 0, wrong: 0 };
    counter.total++;
    if (answer.is_correct !== 1) counter.wrong++;
    categoryStats.set(category, counter);
  }
  const needsWork = [...categoryStats].filter(([, item]) => item.wrong > 0)
    .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total || b[1].wrong - a[1].wrong);
  const attemptChoices = attempts.map((item, index) =>
    '<a class="attempt' + (selected?.id === item.id ? ' active' : '') +
    '" href="' + resultUrl(assignment.id, item.id) + '"><span>Pokus ' + (attempts.length - index) +
    ' · ' + (item.is_partial === 1 ? 'Částečný · ' : 'Celý · ') + scoreLabel(item.score, item.max_score) + '</span><small>' + esc(dateLabel(item.submitted_at)) + '</small></a>'
  ).join("");

  const visible = errorsOnly ? answers.filter((a) => a.is_correct !== 1) : answers;
  const questionsHtml = visible.map(renderQuestion).join("") || '<div class="empty">' +
    (errorsOnly ? "Tento pokus neobsahuje žádné chybně zodpovězené otázky." : "K pokusu nejsou dostupné jednotlivé otázky.") + '</div>';
  const details = selected ?
    '<section class="panel"><h2>Výsledek pokusu</h2><p class="muted">' + esc(dateLabel(selected.submitted_at)) + '</p>' +
    (selected.is_partial === 1
      ? '<p class="partial-warning"><strong>Částečný pokus · ' + (selected.answered_count ?? answers.length) +
        '/' + (selected.total_questions ?? allQuestions.length) + ' úloh.</strong> ' +
        'Procento je jen ze zodpovězené části. Nevyplněné úlohy nejsou chyby; výsledek nevstupuje do studijního průměru.</p>'
      : '') +
    '<div class="stats"><div class="stat"><span>Skóre</span><strong>' + scoreLabel(selected.score, selected.max_score) + '</strong></div>' +
    '<div class="stat"><span>Správně</span><strong>' + correctCount + ' / ' + answers.length + '</strong></div>' +
    '<div class="stat"><span>Chyby</span><strong>' + wrongCount + '</strong></div></div>' +
    (needsWork.length ? '<h3>Témata k procvičení</h3><div class="focus">' +
      needsWork.map(([name, stat]) => '<span>' + esc(name) + ': <strong>' + stat.wrong + ' z ' + stat.total + ' chybně</strong></span>').join("") +
      '</div>' : '<p class="muted">Bez chyb.</p>') +
    '</section><div class="toolbar"><strong>Jednotlivé odpovědi</strong>' +
    '<a class="filter' + (!errorsOnly ? ' active' : '') + '" href="' + resultUrl(assignment.id, selected.id) +
    '">Všechny (' + answers.length + ')</a>' +
    '<a class="filter' + (errorsOnly ? ' active' : '') + '" href="' + resultUrl(assignment.id, selected.id, true) +
    '">Jen chyby (' + wrongCount + ')</a></div>' + questionsHtml +
    '<p class="note">Odpovědi, bodování a správnost jsou z uloženého pokusu. Zadání a vysvětlení se načítají z aktuálního znění testu.</p>'
    : '<div class="empty">Student zatím neodevzdal žádný pokus. Po dokončení se zde zobrazí jeho odpovědi.</div>';

  const page = '<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow,noarchive"><title>Rozbor self-checku | Administrace</title>' +
    '<link rel="stylesheet" href="/student-portal/assets/student-katex/katex.min.css?v=0.16.11"><style>' + css + '</style></head>' +
    '<body><main><a class="back" href="' + ROOT + '">← Zpět na self-checky</a>' +
    '<div class="head"><div class="eyebrow">Administrace · Detail odpovědí</div><h1>' +
    esc(assignment.display_name) + '</h1><p class="muted">' + esc(assignment.title) + ' · ' + esc(assignment.topic) + '</p></div>' +
    '<section class="panel"><h2>Historie pokusů</h2>' +
    (attempts.length ? '<div class="attempts">' + attemptChoices + '</div>' : '<p class="muted">Zatím bez pokusu.</p>') +
    (attempts.length === 100 ? '<p class="note">Zobrazeno posledních 100 pokusů.</p>' : '') +
    '</section>' + details + '</main>' +
    '<script src="/student-portal/assets/student-katex/katex.min.js?v=0.16.11"></script>' +
    '<script>if(window.katex){document.querySelectorAll("[data-tex]").forEach(function(el){try{window.katex.render(el.getAttribute("data-tex"),el,{throwOnError:false,trust:false,strict:"ignore"});}catch(e){}});}</script>' +
    '</body></html>';
  const headers = privateHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(page, { status: 200, headers });
}
