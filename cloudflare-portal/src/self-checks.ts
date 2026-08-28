import {
  PortalError,
  principalForRequest,
  privateHeaders,
  selectedStudentForPrincipal,
} from "./entry";

const HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const PREFIX = "/student-portal";
const API_ROOT = `${PREFIX}/api/self-checks`;
const ADMIN_ROOT = `${PREFIX}/admin/self-checks`;
const MAX_BODY_BYTES = 16 * 1024;

type Option = { id: string; label: string };

type AssignmentListRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  level: string;
  estimated_minutes: number;
  due_at: string | null;
  assigned_at: string;
  question_count: number;
  max_score: number;
  latest_score: number | null;
  latest_max_score: number | null;
  latest_submitted_at: string | null;
};

type AssignmentDetailRow = AssignmentListRow & {
  test_id: string;
};

type QuestionRow = {
  id: string;
  position: number;
  prompt: string;
  options_json: string;
  correct_answer: string;
  explanation: string;
  points: number;
};

type AdminAssignmentRow = {
  id: string;
  student_id: string;
  display_name: string;
  test_title: string;
  topic: string;
  due_at: string | null;
  assigned_at: string;
  latest_score: number | null;
  latest_max_score: number | null;
  latest_submitted_at: string | null;
};

function json(value: unknown, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers });
}

function html(body: string, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { status, headers });
}

function plain(message: string, status: number): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { status, headers });
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: privateHeaders(new Headers({ Location: location })),
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function parseOptions(raw: string): Option[] {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new PortalError(500, "Test contains invalid answer options.");
  }
  if (!Array.isArray(value) || value.length < 2) {
    throw new PortalError(500, "Test contains invalid answer options.");
  }
  const options: Option[] = [];
  const ids = new Set<string>();
  for (const option of value) {
    if (!option || typeof option !== "object") {
      throw new PortalError(500, "Test contains invalid answer options.");
    }
    const id = "id" in option && typeof option.id === "string" ? option.id.trim() : "";
    const label = "label" in option && typeof option.label === "string" ? option.label.trim() : "";
    if (!id || !label || ids.has(id)) {
      throw new PortalError(500, "Test contains invalid answer options.");
    }
    ids.add(id);
    options.push({ id, label });
  }
  return options;
}

function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  const url = new URL(request.url);
  if (origin !== `${url.protocol}//${url.host}`) {
    throw new PortalError(403, "Cross-origin request is not allowed.");
  }
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
}

async function assignmentForStudent(
  assignmentId: string,
  studentId: string,
  env: Env,
): Promise<AssignmentDetailRow> {
  const row = await env.DB.prepare(
    `SELECT a.id,
            a.test_id,
            t.title,
            t.description,
            t.subject,
            t.topic,
            t.level,
            t.estimated_minutes,
            a.due_at,
            a.assigned_at,
            COUNT(q.id) AS question_count,
            COALESCE(SUM(q.points), 0) AS max_score,
            latest.score AS latest_score,
            latest.max_score AS latest_max_score,
            latest.submitted_at AS latest_submitted_at
       FROM self_check_assignments a
       JOIN self_check_tests t ON t.id = a.test_id
       JOIN self_check_questions q ON q.test_id = t.id
       LEFT JOIN self_check_attempts latest
         ON latest.id = (
           SELECT id
             FROM self_check_attempts
            WHERE assignment_id = a.id
            ORDER BY submitted_at DESC, id DESC
            LIMIT 1
         )
      WHERE a.id = ?1
        AND a.student_id = ?2
        AND a.status = 'active'
        AND t.status = 'published'
      GROUP BY a.id
      LIMIT 1`,
  ).bind(assignmentId, studentId).first<AssignmentDetailRow>();
  if (!row) throw new PortalError(404, "Self-check was not found or is no longer active.");
  return row;
}

async function listAssignments(request: Request, env: Env): Promise<Response> {
  const principal = await principalForRequest(request, env);
  const student = await selectedStudentForPrincipal(request, env, principal);
  const result = await env.DB.prepare(
    `SELECT a.id,
            t.title,
            t.description,
            t.subject,
            t.topic,
            t.level,
            t.estimated_minutes,
            a.due_at,
            a.assigned_at,
            COUNT(q.id) AS question_count,
            COALESCE(SUM(q.points), 0) AS max_score,
            latest.score AS latest_score,
            latest.max_score AS latest_max_score,
            latest.submitted_at AS latest_submitted_at
       FROM self_check_assignments a
       JOIN self_check_tests t ON t.id = a.test_id
       JOIN self_check_questions q ON q.test_id = t.id
       LEFT JOIN self_check_attempts latest
         ON latest.id = (
           SELECT id
             FROM self_check_attempts
            WHERE assignment_id = a.id
            ORDER BY submitted_at DESC, id DESC
            LIMIT 1
         )
      WHERE a.student_id = ?1
        AND a.status = 'active'
        AND t.status = 'published'
      GROUP BY a.id
      ORDER BY CASE WHEN a.due_at IS NULL THEN 1 ELSE 0 END,
               a.due_at,
               a.assigned_at DESC`,
  ).bind(student.id).all<AssignmentListRow>();

  return json({
    preview: principal.isAdmin,
    student: { id: student.id, displayName: student.display_name },
    assignments: result.results || [],
  });
}

async function assignmentDetail(
  request: Request,
  env: Env,
  assignmentId: string,
): Promise<Response> {
  const principal = await principalForRequest(request, env);
  const student = await selectedStudentForPrincipal(request, env, principal);
  const assignment = await assignmentForStudent(assignmentId, student.id, env);
  const result = await env.DB.prepare(
    `SELECT id, position, prompt, options_json, correct_answer, explanation, points
       FROM self_check_questions
      WHERE test_id = ?1
      ORDER BY position`,
  ).bind(assignment.test_id).all<QuestionRow>();

  const questions = (result.results || []).map((question) => ({
    id: question.id,
    position: question.position,
    prompt: question.prompt,
    options: parseOptions(question.options_json),
    points: question.points,
  }));

  return json({
    preview: principal.isAdmin,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      topic: assignment.topic,
      level: assignment.level,
      estimatedMinutes: assignment.estimated_minutes,
      dueAt: assignment.due_at,
      questionCount: assignment.question_count,
      maxScore: assignment.max_score,
      latestScore: assignment.latest_score,
      latestMaxScore: assignment.latest_max_score,
      latestSubmittedAt: assignment.latest_submitted_at,
    },
    questions,
  });
}

async function submittedAnswers(request: Request): Promise<Record<string, string>> {
  const length = Number(request.headers.get("Content-Length") || "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    throw new PortalError(413, "Submitted self-check is too large.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new PortalError(413, "Submitted self-check is too large.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new PortalError(400, "Submitted answers are not valid JSON.");
  }
  if (!payload || typeof payload !== "object" || !("answers" in payload)) {
    throw new PortalError(400, "Submitted answers are missing.");
  }
  const rawAnswers = payload.answers;
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    throw new PortalError(400, "Submitted answers are invalid.");
  }
  const answers: Record<string, string> = {};
  for (const [questionId, answer] of Object.entries(rawAnswers)) {
    if (typeof answer !== "string" || questionId.length > 120 || answer.length > 120) {
      throw new PortalError(400, "Submitted answers are invalid.");
    }
    answers[questionId] = answer;
  }
  return answers;
}

async function submitAssignment(
  request: Request,
  env: Env,
  assignmentId: string,
): Promise<Response> {
  requireSameOrigin(request);
  const principal = await principalForRequest(request, env);
  const student = await selectedStudentForPrincipal(request, env, principal);
  const assignment = await assignmentForStudent(assignmentId, student.id, env);
  const answers = await submittedAnswers(request);
  const result = await env.DB.prepare(
    `SELECT id, position, prompt, options_json, correct_answer, explanation, points
       FROM self_check_questions
      WHERE test_id = ?1
      ORDER BY position`,
  ).bind(assignment.test_id).all<QuestionRow>();
  const questions = result.results || [];
  if (!questions.length) throw new PortalError(409, "This self-check has no questions.");
  if (Object.keys(answers).length !== questions.length) {
    throw new PortalError(400, "Answer every question before submitting the self-check.");
  }

  let score = 0;
  const graded = questions.map((question) => {
    const options = parseOptions(question.options_json);
    const answer = answers[question.id];
    if (!answer || !options.some((option) => option.id === answer)) {
      throw new PortalError(400, "One or more submitted answers are invalid.");
    }
    const correct = answer === question.correct_answer;
    const awarded = correct ? question.points : 0;
    score += awarded;
    return {
      questionId: question.id,
      position: question.position,
      prompt: question.prompt,
      answer,
      correctAnswer: question.correct_answer,
      options,
      correct,
      pointsAwarded: awarded,
      points: question.points,
      explanation: question.explanation,
    };
  });
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const submittedAt = new Date().toISOString();

  if (!principal.isAdmin) {
    const attemptId = crypto.randomUUID();
    const statements = [
      env.DB.prepare(
        `INSERT INTO self_check_attempts
          (id, assignment_id, student_id, test_id, score, max_score, submitted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      ).bind(attemptId, assignment.id, student.id, assignment.test_id, score, maxScore, submittedAt),
      ...graded.map((item) => env.DB.prepare(
        `INSERT INTO self_check_answers
          (attempt_id, question_id, answer_value, is_correct, points_awarded)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      ).bind(attemptId, item.questionId, item.answer, item.correct ? 1 : 0, item.pointsAwarded)),
    ];
    await env.DB.batch(statements);
  }

  console.log(JSON.stringify({
    event: "self_check_submitted",
    assignmentId: assignment.id,
    studentId: student.id,
    preview: principal.isAdmin,
    score,
    maxScore,
  }));

  return json({
    preview: principal.isAdmin,
    score,
    maxScore,
    percent: Math.round((score / maxScore) * 100),
    submittedAt,
    results: graded,
  });
}

function formatScore(score: number | null, maxScore: number | null): string {
  if (score === null || maxScore === null) return "Bez pokusu";
  return `${score}/${maxScore} (${Math.round((score / maxScore) * 100)} %)`;
}

async function adminPage(request: Request, env: Env, url: URL): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "GET") return plain("Method not allowed", 405);

  const [studentsResult, testsResult, assignmentsResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, display_name FROM students WHERE enabled = 1 ORDER BY display_name COLLATE NOCASE`,
    ).all<{ id: string; display_name: string }>(),
    env.DB.prepare(
      `SELECT t.id, t.title, t.topic, t.level, t.estimated_minutes, COUNT(q.id) AS question_count
         FROM self_check_tests t
         LEFT JOIN self_check_questions q ON q.test_id = t.id
        WHERE t.status = 'published'
        GROUP BY t.id
        ORDER BY t.topic COLLATE NOCASE, t.title COLLATE NOCASE`,
    ).all<{ id: string; title: string; topic: string; level: string; estimated_minutes: number; question_count: number }>(),
    env.DB.prepare(
      `SELECT a.id,
              a.student_id,
              s.display_name,
              t.title AS test_title,
              t.topic,
              a.due_at,
              a.assigned_at,
              latest.score AS latest_score,
              latest.max_score AS latest_max_score,
              latest.submitted_at AS latest_submitted_at
         FROM self_check_assignments a
         JOIN students s ON s.id = a.student_id
         JOIN self_check_tests t ON t.id = a.test_id
         LEFT JOIN self_check_attempts latest
           ON latest.id = (
             SELECT id FROM self_check_attempts
              WHERE assignment_id = a.id
              ORDER BY submitted_at DESC, id DESC LIMIT 1
           )
        WHERE a.status = 'active'
        ORDER BY a.assigned_at DESC`,
    ).all<AdminAssignmentRow>(),
  ]);

  const students = studentsResult.results || [];
  const tests = testsResult.results || [];
  const assignments = assignmentsResult.results || [];
  const notice = url.searchParams.get("assigned") === "1"
    ? `<div class="notice">Self-check byl studentovi přiřazen.</div>`
    : url.searchParams.get("existing") === "1"
      ? `<div class="notice">Tento self-check už student přiřazený má.</div>`
      : "";
  const studentOptions = students.map((student) =>
    `<option value="${escapeHtml(student.id)}">${escapeHtml(student.display_name)}</option>`,
  ).join("");
  const testOptions = tests.map((test) =>
    `<option value="${escapeHtml(test.id)}">${escapeHtml(test.title)} · ${test.question_count} otázek · ${test.estimated_minutes} min</option>`,
  ).join("");
  const testCards = tests.map((test) => `<article class="test-card">
    <div><strong>${escapeHtml(test.title)}</strong><span>${escapeHtml(test.topic)} · ${escapeHtml(test.level)}</span></div>
    <small>${test.question_count} otázek · přibližně ${test.estimated_minutes} min</small>
  </article>`).join("") || `<p class="empty">Knihovna zatím neobsahuje publikovaný self-check.</p>`;
  const assignmentRows = assignments.map((assignment) => {
    const lastAttempt = formatScore(assignment.latest_score, assignment.latest_max_score);
    const attemptDate = assignment.latest_submitted_at
      ? ` · ${escapeHtml(assignment.latest_submitted_at.slice(0, 10))}`
      : "";
    const due = assignment.due_at ? `Termín ${escapeHtml(assignment.due_at)}` : "Bez termínu";
    return `<article class="assignment">
      <div><strong>${escapeHtml(assignment.display_name)}</strong><span>${escapeHtml(assignment.test_title)}</span><small>${escapeHtml(assignment.topic)} · ${due} · Poslední výsledek: ${escapeHtml(lastAttempt)}${attemptDate}</small></div>
      <a href="${PREFIX}/admin/view/${encodeURIComponent(assignment.student_id)}#tasks">Otevřít náhled</a>
    </article>`;
  }).join("") || `<p class="empty">Zatím není přiřazen žádný self-check.</p>`;

  return html(`<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Self-checky | Administrace</title>
<style>
body{font-family:Inter,system-ui,sans-serif;background:#f4f7fb;color:#102a43;margin:0}.wrap{width:min(920px,calc(100% - 32px));margin:42px auto}.box{background:#fff;border:1px solid #d9e2ec;border-radius:18px;padding:24px;margin-bottom:20px}h1,h2{margin-top:0}a{color:#2563eb;font-weight:700}.muted,.empty{color:#627d98}.notice{padding:13px 16px;margin-bottom:18px;border-radius:12px;background:#ecfdf5;color:#166534}.form-grid{display:grid;grid-template-columns:1fr 1.4fr .8fr;gap:14px;align-items:end}label{display:grid;gap:7px;font-weight:700}select,input{width:100%;padding:11px;border:1px solid #bcccdc;border-radius:10px;background:#fff}button{padding:12px 16px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}.assignment,.test-card{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 0;border-top:1px solid #e7edf4}.assignment:first-of-type,.test-card:first-of-type{border-top:0}.assignment div,.test-card div{display:grid;gap:4px}.assignment span,.test-card span{font-weight:700}.assignment small,.test-card small{color:#627d98;line-height:1.5}@media(max-width:720px){.form-grid{grid-template-columns:1fr}.assignment,.test-card{align-items:flex-start;flex-direction:column}}
</style></head><body><main class="wrap">
<p><a href="${PREFIX}/admin">← Studentské zóny</a></p>
${notice}
<section class="box"><h1>Otestuj znalosti</h1><p class="muted">Přiřaď studentovi připravený self-check. V administrátorském náhledu ho můžeš celý projít; odeslání náhledu se nikdy neuloží jako studentův pokus.</p>
<form method="post" action="${ADMIN_ROOT}/assign" class="form-grid">
<label>Student<select name="studentId" required><option value="">Vyber studenta</option>${studentOptions}</select></label>
<label>Self-check<select name="testId" required><option value="">Vyber test</option>${testOptions}</select></label>
<label>Termín<input name="dueAt" type="date"></label>
<button type="submit">Přiřadit</button>
</form></section>
<section class="box"><h2>Knihovna testů</h2>${testCards}</section>
<section class="box"><h2>Aktivní přiřazení</h2>${assignmentRows}</section>
</main></body></html>`);
}

async function assignTest(request: Request, env: Env): Promise<Response> {
  requireSameOrigin(request);
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  const form = await request.formData();
  const studentId = String(form.get("studentId") || "").trim();
  const testId = String(form.get("testId") || "").trim();
  const dueAt = String(form.get("dueAt") || "").trim();
  if (!studentId || !testId) throw new PortalError(400, "Select a student and a self-check.");
  if (dueAt && (!/^\d{4}-\d{2}-\d{2}$/.test(dueAt) || Number.isNaN(Date.parse(`${dueAt}T00:00:00Z`)))) {
    throw new PortalError(400, "Invalid due date.");
  }

  const [student, test, existing] = await Promise.all([
    env.DB.prepare(`SELECT id FROM students WHERE id = ?1 AND enabled = 1 LIMIT 1`).bind(studentId).first<{ id: string }>(),
    env.DB.prepare(`SELECT id FROM self_check_tests WHERE id = ?1 AND status = 'published' LIMIT 1`).bind(testId).first<{ id: string }>(),
    env.DB.prepare(`SELECT id FROM self_check_assignments WHERE student_id = ?1 AND test_id = ?2 LIMIT 1`).bind(studentId, testId).first<{ id: string }>(),
  ]);
  if (!student || !test) throw new PortalError(404, "Student or self-check was not found.");

  if (existing) {
    await env.DB.prepare(
      `UPDATE self_check_assignments
          SET status = 'active', due_at = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2`,
    ).bind(dueAt || null, existing.id).run();
    return redirect(`${ADMIN_ROOT}?existing=1`);
  }

  await env.DB.prepare(
    `INSERT INTO self_check_assignments (id, student_id, test_id, due_at)
     VALUES (?1, ?2, ?3, ?4)`,
  ).bind(crypto.randomUUID(), studentId, testId, dueAt || null).run();
  return redirect(`${ADMIN_ROOT}?assigned=1`);
}

export async function enhanceAdminLandingWithSelfChecks(response: Response): Promise<Response> {
  if (response.status !== 200 || !(response.headers.get("Content-Type") || "").includes("text/html")) {
    return response;
  }
  const body = await response.text();
  if (!body.includes("Studentské zóny") || body.includes(ADMIN_ROOT)) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const marker = '<div class="notice">';
  if (!body.includes(marker)) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const enhanced = body.replace(
    marker,
    `<p style="margin:0 0 18px"><a href="${ADMIN_ROOT}" style="color:#2563eb;font-weight:700">Přiřadit self-checky →</a></p>${marker}`,
  );
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}

export async function handleSelfCheckRoute(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!HOSTS.has(url.hostname)) return null;

  try {
    if (url.pathname === API_ROOT) {
      if (request.method !== "GET") return plain("Method not allowed", 405);
      return listAssignments(request, env);
    }

    const submitMatch = url.pathname.match(/^\/student-portal\/api\/self-checks\/([^/]+)\/submit$/);
    if (submitMatch) {
      if (request.method !== "POST") return plain("Method not allowed", 405);
      return submitAssignment(request, env, decodeURIComponent(submitMatch[1]));
    }

    const detailMatch = url.pathname.match(/^\/student-portal\/api\/self-checks\/([^/]+)$/);
    if (detailMatch) {
      if (request.method !== "GET") return plain("Method not allowed", 405);
      return assignmentDetail(request, env, decodeURIComponent(detailMatch[1]));
    }

    if (url.pathname === ADMIN_ROOT || url.pathname === `${ADMIN_ROOT}/`) {
      return adminPage(request, env, url);
    }

    if (url.pathname === `${ADMIN_ROOT}/assign`) {
      return assignTest(request, env);
    }

    return null;
  } catch (error) {
    if (error instanceof PortalError) {
      if (url.pathname.startsWith(API_ROOT)) return json({ error: error.message }, error.status);
      return plain(error.message, error.status);
    }
    console.error(JSON.stringify({ event: "self_check_error", method: request.method, path: url.pathname }));
    if (url.pathname.startsWith(API_ROOT)) return json({ error: "Internal server error" }, 500);
    return plain("Internal server error", 500);
  }
}
