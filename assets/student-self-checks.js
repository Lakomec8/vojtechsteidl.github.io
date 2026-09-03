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
      // The error below is intentionally generic when the server did not return JSON.
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
      note.append(
        node("strong", "", "Administrátorský náhled"),
        document.createTextNode(" — test můžeš vyplnit, ale výsledek se studentovi neuloží."),
      );
      list.append(note);
    }

    if (!payload.assignments?.length) {
      list.append(node("div", "empty", "Zatím nemáš přiřazený žádný self-check."));
      return;
    }

    for (const assignment of payload.assignments) {
      const card = node("article", "self-check-card");
      const main = node("div", "self-check-card-main");
      const heading = node("h3", "", assignment.title);
      const description = node("p", "", assignment.description);
      const meta = node("div", "self-check-meta");
      meta.append(
        node("span", "badge", assignment.topic),
        node("span", "", `${assignment.question_count} otázek`),
        node("span", "", `asi ${assignment.estimated_minutes} min`),
      );
      if (assignment.due_at) meta.append(node("span", "", `do ${formatDate(assignment.due_at)}`));
      const latest = node("p", "self-check-latest", latestResult(assignment));
      if (assignment.latest_submitted_at) latest.append(` · ${formatDate(assignment.latest_submitted_at)}`);
      if (!assignment.available) meta.append(node("span", "badge good", "Dokončeno"));
      main.append(heading, description, meta, latest);

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
    title.textContent = "Načítám test…";
    topic.textContent = "Self-check";
    content.replaceChildren(node("div", "empty", "Načítám otázky…"));
    showDialog();

    try {
      const payload = await api(`./api/self-checks/${encodeURIComponent(assignmentId)}`);
      preview = Boolean(payload.preview);
      renderTest(payload);
    } catch (error) {
      content.replaceChildren(node("div", "self-check-error", error.message));
    }
  }

  function renderTest(payload) {
    const assignment = payload.assignment;
    title.textContent = assignment.title;
    topic.textContent = assignment.topic;
    content.replaceChildren();

    const intro = node("div", "self-check-intro");
    intro.append(node("p", "", assignment.description));
    const meta = node("div", "self-check-meta");
    meta.append(
      node("span", "", `${assignment.questionCount} otázek`),
      node("span", "", `${assignment.maxScore} bodů`),
      node("span", "", `asi ${assignment.estimatedMinutes} min`),
    );
    intro.append(meta);
    if (preview) intro.append(node("div", "self-check-preview-note", "Náhled administrátora: odeslaný výsledek se neuloží."));

    const form = node("form", "self-check-form");
    for (const question of payload.questions) {
      const fieldset = node("fieldset", "self-check-question");
      const legend = node("legend", "", `${question.position}. ${question.prompt}`);
      fieldset.append(legend);
      for (const option of question.options) {
        const label = node("label", "self-check-option");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option.id;
        input.required = true;
        label.append(input, node("span", "", option.label));
        fieldset.append(label);
      }
      form.append(fieldset);
    }

    const submit = node("button", "primary self-check-submit", preview ? "Vyhodnotit náhled" : "Vyhodnotit test");
    submit.type = "submit";
    form.append(submit);
    form.addEventListener("submit", submitTest);
    content.append(intro, form);
  }

  async function submitTest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.textContent = "Vyhodnocuji…";

    const answers = {};
    for (const [name, value] of new FormData(form).entries()) answers[name] = String(value);

    try {
      const payload = await api(`./api/self-checks/${encodeURIComponent(activeAssignmentId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      renderResult(payload);
      if (!payload.preview) {
        loadAssignments();
        window.dispatchEvent(new CustomEvent("student:self-check-submitted", {
          detail: { summary: payload.selfCheckSummary },
        }));
      }
    } catch (error) {
      const message = node("div", "self-check-error", error.message);
      form.prepend(message);
      submit.disabled = false;
      submit.textContent = preview ? "Vyhodnotit náhled" : "Vyhodnotit test";
    }
  }

  function answerLabel(result, answerId) {
    return result.options.find((option) => option.id === answerId)?.label || answerId;
  }

  function renderResult(payload) {
    content.replaceChildren();
    const summary = node("section", "self-check-result-summary");
    summary.append(
      node("span", "", "Výsledek"),
      node("strong", "", `${payload.score}/${payload.maxScore}`),
      node("b", "", `${payload.percent} %`),
    );
    const feedback = payload.percent >= 80
      ? "Výborně. Téma máš pevně v ruce."
      : payload.percent >= 50
        ? "Dobrý základ. Projdi si vysvětlení u chyb a zkus test znovu."
        : "Tady se vyplatí vrátit k základům a potom zkusit další pokus.";
    summary.append(node("p", "", feedback));
    if (payload.preview) summary.append(node("div", "self-check-preview-note", "Toto byl administrátorský náhled. Výsledek nebyl uložen do historie studenta."));
    content.append(summary);

    const details = node("div", "self-check-results");
    for (const result of payload.results) {
      const item = node("article", `self-check-answer ${result.correct ? "correct" : "incorrect"}`);
      item.append(node("h3", "", `${result.position}. ${result.prompt}`));
      const chosen = node("p", "", `Tvoje odpověď: ${answerLabel(result, result.answer)}`);
      item.append(chosen);
      if (!result.correct) item.append(node("p", "self-check-correct-answer", `Správně: ${answerLabel(result, result.correctAnswer)}`));
      item.append(node("p", "self-check-explanation", result.explanation));
      details.append(item);
    }
    content.append(details);

    const actions = node("div", "actions self-check-result-actions");
    const retry = node("button", "secondary", "Zkusit znovu");
    retry.type = "button";
    retry.addEventListener("click", () => openAssignment(activeAssignmentId));
    const done = node("button", "primary", "Hotovo");
    done.type = "button";
    done.addEventListener("click", closeDialog);
    actions.append(retry, done);
    content.append(actions);
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
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  loadAssignments();
})();
