(() => {
  "use strict";

  const list = document.getElementById("selfChecksList");
  const dialog = document.getElementById("selfCheckDialog");
  const content = document.getElementById("selfCheckContent");
  const title = document.getElementById("selfCheckTitle");
  const topic = document.getElementById("selfCheckTopic");
  const close = document.getElementById("selfCheckClose");
  if (!list || !dialog || !content || !title || !topic || !close) return;

  let preview = false;
  let activeAssignmentId = "";
  let activePayload = null;
  let currentQuestionIndex = 0;
  const answers = new Map();

  if (window.location.hash === "#tasks") {
    document.querySelector('[data-view="tasks"]')?.click();
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }).format(date);
  }

  function parseDescription(raw = "") {
    const metadata = { calculator: "" };
    const text = String(raw).replace(/\[\[calculator:([^\]]+)\]\]/gi, (_, value) => {
      metadata.calculator = value.trim();
      return "";
    }).trim();
    return { text, ...metadata };
  }

  function parsePrompt(raw = "") {
    const source = String(raw).trim();
    if (source.startsWith("{") && source.endsWith("}")) {
      try {
        const parsed = JSON.parse(source);
        if (parsed && typeof parsed === "object") {
          return {
            instruction: typeof parsed.instruction === "string" ? parsed.instruction.trim() : "",
            math: typeof parsed.math === "string" ? parsed.math.trim() : "",
            category: typeof parsed.category === "string" ? parsed.category.trim() : "",
            hint: typeof parsed.hint === "string" ? parsed.hint.trim() : "",
            legacy: "",
          };
        }
      } catch {
        // Fall through to legacy rendering.
      }
    }

    const equationMatch = source.match(/^(Vyřeš (?:rovnici|nerovnici))\s+(.+?)\.?$/i);
    if (equationMatch) {
      return {
        instruction: `${equationMatch[1]}:`,
        math: legacyToTex(equationMatch[2]),
        category: "",
        hint: "",
        legacy: "",
      };
    }

    return { instruction: "", math: "", category: "", hint: "", legacy: source };
  }

  function legacyToTex(value = "") {
    return String(value)
      .replaceAll("²", "^2")
      .replaceAll("³", "^3")
      .replaceAll("≤", "\\le")
      .replaceAll("≥", "\\ge")
      .replaceAll("≠", "\\ne")
      .replaceAll("·", "\\cdot ")
      .replaceAll("∞", "\\infty")
      .replace(/\|([^|]+)\|/g, "\\left|$1\\right|");
  }

  function renderMath(target, tex, displayMode = true) {
    if (!target) return;
    if (window.katex?.render) {
      try {
        window.katex.render(tex, target, {
          displayMode,
          throwOnError: false,
          strict: "ignore",
          trust: false,
        });
        return;
      } catch {
        // Fall back to readable text below.
      }
    }
    target.textContent = tex;
  }

  function appendRichText(target, raw) {
    const text = String(raw || "");
    const pattern = /\[\[math:([\s\S]*?)\]\]/g;
    let last = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > last) target.append(document.createTextNode(text.slice(last, match.index)));
      const math = node("span", "self-check-v2-inline-math");
      renderMath(math, match[1], false);
      target.append(math);
      last = pattern.lastIndex;
    }
    if (last < text.length) target.append(document.createTextNode(text.slice(last)));
  }

  function looksMathematical(label = "") {
    const value = String(label).trim();
    if (/^\[\[math:[\s\S]+\]\]$/.test(value)) return true;
    if (/^[xabycrS]\s*[=<>≤≥]/i.test(value)) return true;
    if (/[=≤≥]|\^|²|³|√|\{[-+0-9x;]/.test(value) && value.length < 90) return true;
    return false;
  }

  function renderOptionValue(target, label) {
    const value = String(label || "");
    const explicit = value.match(/^\[\[math:([\s\S]+)\]\]$/);
    if (explicit) {
      renderMath(target, explicit[1], false);
      return;
    }
    if (looksMathematical(value)) {
      renderMath(target, legacyToTex(value), false);
      return;
    }
    target.textContent = value;
  }

  async function api(url, options) {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      ...options,
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Generic error below when the server did not return JSON.
    }
    if (!response.ok) throw new Error(payload?.error || "Self-check se nepodařilo načíst.");
    return payload;
  }

  function showMessage(message, className = "empty") {
    list.replaceChildren(node("div", className, message));
  }

  function latestResult(assignment) {
    if (assignment.latest_score === null || assignment.latest_max_score === null) return "Zatím bez pokusu";
    const percent = Math.round((assignment.latest_score / assignment.latest_max_score) * 100);
    return `Poslední výsledek ${assignment.latest_score}/${assignment.latest_max_score} (${percent} %)`;
  }

  function renderAssignments(payload) {
    preview = Boolean(payload.preview);
    list.replaceChildren();

    if (preview) {
      const note = node("div", "self-check-preview-note");
      note.append(node("strong", "", "Administrátorský náhled"), document.createTextNode(" — test můžeš projít, výsledek se studentovi neuloží."));
      list.append(note);
    }

    if (!payload.assignments?.length) {
      list.append(node("div", "empty", "Zatím nemáš přiřazený žádný self-check."));
      return;
    }

    for (const assignment of payload.assignments) {
      const description = parseDescription(assignment.description);
      const card = node("article", "self-check-card");
      const main = node("div", "self-check-card-main");
      const heading = node("h3", "", assignment.title);
      const copy = node("p", "", description.text);
      const meta = node("div", "self-check-meta");
      meta.append(
        node("span", "badge", assignment.topic),
        node("span", "", `${assignment.question_count} úloh`),
        node("span", "", `${assignment.max_score} bodů`),
        node("span", "", `asi ${assignment.estimated_minutes} min`),
      );
      if (description.calculator) meta.append(node("span", "", description.calculator));
      if (assignment.due_at) meta.append(node("span", "", `do ${formatDate(assignment.due_at)}`));
      const latest = node("p", "self-check-latest", latestResult(assignment));
      if (assignment.latest_submitted_at) latest.append(` · ${formatDate(assignment.latest_submitted_at)}`);
      if (!assignment.available) meta.append(node("span", "badge good", "Dokončeno"));
      main.append(heading, copy, meta, latest);
      card.append(main);
      if (assignment.available) {
        const button = node("button", "primary self-check-start", assignment.latest_score === null ? "Spustit test" : "Zkusit znovu");
        button.type = "button";
        button.addEventListener("click", () => openAssignment(assignment.id));
        card.append(button);
      }
      list.append(card);
    }
  }

  function showDialog() {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  async function openAssignment(assignmentId) {
    activeAssignmentId = assignmentId;
    activePayload = null;
    currentQuestionIndex = 0;
    answers.clear();
    title.textContent = "Načítám test…";
    topic.textContent = "Diagnostika";
    content.replaceChildren(node("div", "empty", "Načítám otázky…"));
    showDialog();

    try {
      const payload = await api(`./api/self-checks/${encodeURIComponent(assignmentId)}`);
      preview = Boolean(payload.preview);
      activePayload = payload;
      renderTestShell();
    } catch (error) {
      content.replaceChildren(node("div", "self-check-error", error.message));
    }
  }

  function questionCategory(question) {
    return parsePrompt(question.prompt).category || activePayload?.assignment?.topic || "Ostatní";
  }

  function coverageData(questions) {
    const map = new Map();
    for (const question of questions || []) {
      const category = questionCategory(question);
      const row = map.get(category) || { category, count: 0, points: 0 };
      row.count += 1;
      row.points += Number(question.points || 0);
      map.set(category, row);
    }
    return [...map.values()];
  }

  function buildHero(assignment) {
    const description = parseDescription(assignment.description);
    const hero = node("section", "self-check-v2-hero");
    const main = node("div", "self-check-v2-title-row");
    const icon = node("div", "self-check-v2-icon", "▥");
    const copy = node("div");
    copy.append(node("p", "self-check-v2-eyebrow", "Diagnostický test"));
    copy.append(node("h3", "", assignment.title));
    copy.append(node("p", "self-check-v2-description", description.text));
    main.append(icon, copy);

    const stats = node("div", "self-check-v2-stats");
    const statQuestion = node("div", "self-check-v2-stat");
    statQuestion.append(node("strong", "", String(assignment.questionCount)), node("span", "", "úloh"));
    const statPoints = node("div", "self-check-v2-stat");
    statPoints.append(node("strong", "", String(assignment.maxScore)), node("span", "", "bodů"));
    const statTime = node("div", "self-check-v2-stat");
    statTime.append(node("strong", "", String(assignment.estimatedMinutes)), node("span", "", "cca minut"));
    stats.append(statQuestion, statPoints, statTime);
    if (description.calculator) stats.append(node("div", "self-check-v2-policy", description.calculator));
    hero.append(main, stats);
    return hero;
  }

  function buildCoverage(questions) {
    const section = node("section", "self-check-v2-coverage");
    section.append(node("h4", "", "Co test pokrývá?"));
    const grid = node("div", "self-check-v2-coverage-grid");
    for (const row of coverageData(questions)) {
      const card = node("article", "self-check-v2-coverage-card");
      card.append(node("strong", "", row.category), node("span", "", `${row.count} ${row.count === 1 ? "úloha" : row.count < 5 ? "úlohy" : "úloh"} · ${row.points} b.`));
      grid.append(card);
    }
    section.append(grid);
    return section;
  }

  function renderTestShell() {
    if (!activePayload) return;
    const assignment = activePayload.assignment;
    title.textContent = assignment.title;
    topic.textContent = assignment.topic;
    content.replaceChildren();

    const shell = node("div", "self-check-v2-shell");
    shell.append(buildHero(assignment));
    const progressHost = node("div", "self-check-v2-progress-host");
    const questionHost = node("div", "self-check-v2-question-host");
    shell.append(progressHost, questionHost, buildCoverage(activePayload.questions));
    if (preview) shell.prepend(node("div", "self-check-preview-note", "Náhled administrátora: odeslaný výsledek se neuloží."));
    content.append(shell);
    renderQuestion();
  }

  function buildProgress() {
    const questions = activePayload.questions;
    const wrap = node("div", "self-check-v2-progress-wrap");
    const prev = node("button", "self-check-v2-nav prev", "← Předchozí");
    prev.type = "button";
    prev.disabled = currentQuestionIndex === 0;
    prev.addEventListener("click", () => goToQuestion(currentQuestionIndex - 1));

    const steps = node("div", "self-check-v2-progress");
    questions.forEach((question, index) => {
      const step = node("button", `self-check-v2-step${index === currentQuestionIndex ? " active" : ""}${answers.has(question.id) ? " answered" : ""}`, String(index + 1));
      step.type = "button";
      step.setAttribute("aria-label", `Přejít na úlohu ${index + 1}`);
      step.addEventListener("click", () => goToQuestion(index));
      steps.append(step);
    });

    const next = node("button", "self-check-v2-nav next", currentQuestionIndex === questions.length - 1 ? "Vyhodnotit" : "Další →");
    next.type = "button";
    next.addEventListener("click", () => {
      if (currentQuestionIndex === questions.length - 1) submitActiveTest();
      else goToQuestion(currentQuestionIndex + 1);
    });
    wrap.append(prev, steps, next);
    return wrap;
  }

  function goToQuestion(index) {
    if (!activePayload) return;
    const max = activePayload.questions.length - 1;
    currentQuestionIndex = Math.max(0, Math.min(index, max));
    renderQuestion();
  }

  function renderQuestion() {
    if (!activePayload) return;
    const progressHost = content.querySelector(".self-check-v2-progress-host");
    const questionHost = content.querySelector(".self-check-v2-question-host");
    if (!progressHost || !questionHost) return;
    progressHost.replaceChildren(buildProgress());

    const question = activePayload.questions[currentQuestionIndex];
    const parsed = parsePrompt(question.prompt);
    const card = node("section", "self-check-v2-question");
    const head = node("div", "self-check-v2-question-head");
    const titleWrap = node("div", "self-check-v2-question-title");
    titleWrap.append(node("h4", "", `Úloha ${question.position}`));
    if (parsed.category) titleWrap.append(node("span", "self-check-v2-category", parsed.category));
    head.append(titleWrap, node("span", "self-check-v2-points", `${question.points} ${question.points === 1 ? "bod" : question.points < 5 ? "body" : "bodů"}`));
    card.append(head);

    const prompt = node("div", "self-check-v2-prompt");
    if (parsed.instruction) prompt.append(node("p", "self-check-v2-instruction", parsed.instruction));
    if (parsed.math) {
      const math = node("div", "self-check-v2-math");
      renderMath(math, parsed.math, true);
      prompt.append(math);
    } else if (parsed.legacy) {
      prompt.append(node("p", "self-check-v2-legacy", parsed.legacy));
    }
    card.append(prompt);

    const options = node("div", "self-check-v2-options");
    question.options.forEach((option, optionIndex) => {
      const label = node("label", "self-check-v2-option");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = option.id;
      input.checked = answers.get(question.id) === option.id;
      input.addEventListener("change", () => {
        answers.set(question.id, option.id);
        renderQuestion();
      });
      const letter = node("span", "self-check-v2-letter", String.fromCharCode(65 + optionIndex));
      const optionContent = node("span", "self-check-v2-option-content");
      renderOptionValue(optionContent, option.label);
      label.append(input, letter, optionContent);
      options.append(label);
    });
    card.append(options);

    if (parsed.hint) {
      const details = node("details", "self-check-v2-hint");
      details.append(node("summary", "", "Tip · zobrazit nápovědu"));
      const hint = node("p");
      appendRichText(hint, parsed.hint);
      details.append(hint);
      card.append(details);
    }

    const bottom = node("div", "self-check-v2-bottom-nav");
    const prev = node("button", "self-check-v2-nav prev", "← Předchozí");
    prev.type = "button";
    prev.disabled = currentQuestionIndex === 0;
    prev.addEventListener("click", () => goToQuestion(currentQuestionIndex - 1));
    const nextText = currentQuestionIndex === activePayload.questions.length - 1 ? (preview ? "Vyhodnotit náhled" : "Vyhodnotit test") : "Další →";
    const next = node("button", "self-check-v2-nav next", nextText);
    next.type = "button";
    next.addEventListener("click", () => {
      if (currentQuestionIndex === activePayload.questions.length - 1) submitActiveTest();
      else goToQuestion(currentQuestionIndex + 1);
    });
    bottom.append(prev, next);
    card.append(bottom);
    questionHost.replaceChildren(card);
  }

  async function submitActiveTest() {
    if (!activePayload) return;
    const firstUnanswered = activePayload.questions.findIndex((question) => !answers.has(question.id));
    if (firstUnanswered !== -1) {
      currentQuestionIndex = firstUnanswered;
      renderQuestion();
      const host = content.querySelector(".self-check-v2-question");
      host?.append(node("div", "self-check-v2-validation", "Nejdřív odpověz na všechny úlohy."));
      return;
    }

    const payloadAnswers = {};
    for (const [questionId, answer] of answers.entries()) payloadAnswers[questionId] = answer;
    const questionHost = content.querySelector(".self-check-v2-question-host");
    questionHost?.replaceChildren(node("div", "empty", "Vyhodnocuji test…"));

    try {
      const payload = await api(`./api/self-checks/${encodeURIComponent(activeAssignmentId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payloadAnswers }),
      });
      renderResult(payload);
      if (!payload.preview) {
        loadAssignments();
        window.dispatchEvent(new CustomEvent("student:self-check-submitted", { detail: { summary: payload.selfCheckSummary } }));
      }
    } catch (error) {
      renderQuestion();
      const host = content.querySelector(".self-check-v2-question");
      host?.prepend(node("div", "self-check-error", error.message));
    }
  }

  function answerLabel(result, answerId) {
    return result.options.find((option) => option.id === answerId)?.label || answerId;
  }

  function resultBreakdown(results) {
    const map = new Map();
    for (const result of results || []) {
      const category = parsePrompt(result.prompt).category || activePayload?.assignment?.topic || "Ostatní";
      const row = map.get(category) || { category, awarded: 0, points: 0 };
      row.awarded += Number(result.pointsAwarded || 0);
      row.points += Number(result.points || 0);
      map.set(category, row);
    }
    return [...map.values()].map((row) => ({ ...row, percent: row.points ? Math.round((row.awarded / row.points) * 100) : 0 }));
  }

  function resultFeedback(percent) {
    if (percent >= 85) return "Výborný výsledek. Základ pro přijímačkové rovnice je velmi pevný.";
    if (percent >= 65) return "Dobrý základ. Zaměř se na nejslabší oblast a pak test zopakuj.";
    if (percent >= 45) return "Část postupů funguje, ale některé typy úloh ještě potřebují upevnit.";
    return "Vyplatí se vrátit k postupu po jednotlivých krocích a procvičit základní typy rovnic.";
  }

  function renderAnswerLine(label, value, className = "") {
    const p = node("p", `self-check-v2-answer-line ${className}`.trim());
    p.append(node("strong", "", `${label}: `));
    const span = node("span");
    renderOptionValue(span, value);
    p.append(span);
    return p;
  }

  function renderResult(payload) {
    content.replaceChildren();
    const shell = node("div", "self-check-v2-shell");
    const hero = node("section", "self-check-v2-result-hero");
    const score = node("div", "self-check-v2-score");
    score.append(node("strong", "", `${payload.score}/${payload.maxScore}`), node("span", "", `${payload.percent} %`));
    const copy = node("div", "self-check-v2-result-copy");
    copy.append(node("h3", "", "Výsledek diagnostiky"), node("p", "", resultFeedback(payload.percent)));
    hero.append(score, copy);
    shell.append(hero);

    const breakdown = resultBreakdown(payload.results);
    const grid = node("div", "self-check-v2-breakdown");
    for (const row of breakdown) {
      const card = node("article", "self-check-v2-breakdown-card");
      card.append(node("strong", "", row.category), node("b", "", `${row.percent} %`), node("span", "", `${row.awarded}/${row.points} bodů`));
      grid.append(card);
    }
    shell.append(grid);

    const weakest = [...breakdown].sort((a, b) => a.percent - b.percent || b.points - a.points)[0];
    if (weakest) {
      const priority = node("div", "self-check-v2-priority");
      priority.append(node("strong", "", `Priorita: ${weakest.category}. `), document.createTextNode("Projdi vysvětlení u chyb v této oblasti a potom zkus další pokus."));
      shell.append(priority);
    }
    if (payload.preview) shell.append(node("div", "self-check-preview-note", "Administrátorský náhled: výsledek nebyl uložen do historie studenta."));

    const details = node("div", "self-check-v2-results");
    for (const result of payload.results) {
      const parsed = parsePrompt(result.prompt);
      const item = node("article", `self-check-v2-answer ${result.correct ? "correct" : "incorrect"}`);
      const head = node("div", "self-check-v2-answer-head");
      head.append(node("h4", "", `Úloha ${result.position}${parsed.category ? ` · ${parsed.category}` : ""}`), node("span", "self-check-v2-answer-state", result.correct ? "Správně" : "K opravě"));
      item.append(head);
      if (parsed.math) {
        const math = node("div", "self-check-v2-answer-math");
        renderMath(math, parsed.math, true);
        item.append(math);
      } else if (parsed.legacy) {
        item.append(node("p", "self-check-v2-answer-line", parsed.legacy));
      }
      item.append(renderAnswerLine("Tvoje odpověď", answerLabel(result, result.answer)));
      if (!result.correct) item.append(renderAnswerLine("Správně", answerLabel(result, result.correctAnswer), "self-check-correct-answer"));
      const explanation = node("div", "self-check-v2-explanation");
      appendRichText(explanation, result.explanation);
      item.append(explanation);
      details.append(item);
    }
    shell.append(details);

    const actions = node("div", "self-check-v2-result-actions");
    const retry = node("button", "secondary", "Zkusit znovu");
    retry.type = "button";
    retry.addEventListener("click", () => openAssignment(activeAssignmentId));
    const done = node("button", "primary", "Hotovo");
    done.type = "button";
    done.addEventListener("click", closeDialog);
    actions.append(retry, done);
    shell.append(actions);
    content.append(shell);
  }

  async function loadAssignments() {
    try {
      const payload = await api("./api/self-checks");
      renderAssignments(payload);
    } catch (error) {
      showMessage(error.message, "self-check-error");
    }
  }

  close.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  loadAssignments();
})();
