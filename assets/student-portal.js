(async function () {
  const $ = (id) => document.getElementById(id);
  const loader = $("loader");
  const app = $("app");
  const token = sessionStorage.getItem("student_token");

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);

  const escapeAttribute = escapeHtml;
  const emptyState = (message) => `<div class="empty">${escapeHtml(message)}</div>`;

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (value) => {
    const date = parseDate(value);
    return date
      ? new Intl.DateTimeFormat("cs-CZ", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }).format(date)
      : String(value || "");
  };

  const formatShortDate = (value) => {
    const date = parseDate(value);
    return date
      ? new Intl.DateTimeFormat("cs-CZ", {
          day: "numeric",
          month: "numeric",
        }).format(date)
      : "–";
  };

  const openView = (id) => {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === id);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.id === id);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showError = (message) => {
    document.body.innerHTML = `
      <main class="error">
        <h1>Studentský portál není dostupný</h1>
        <p>${escapeHtml(message)}</p>
        <a href="index.html">Zpět na hlavní stránku</a>
      </main>
    `;
  };

  const readCompletedTasks = (storageKey) => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}tasks`) || "{}");
    } catch (error) {
      console.warn("Uložený stav úkolů se nepodařilo načíst.", error);
      return {};
    }
  };

  const assessedLessonsCopy = (assessedCount, totalCount) => {
    if (!assessedCount) return "Zatím bez hodnocení";

    const assessedWord = assessedCount === 1
      ? "1 hodnocené hodiny"
      : `${assessedCount} hodnocených hodin`;

    return `Průměr z ${assessedWord} · ${assessedCount} z ${totalCount} celkem`;
  };

  try {
    if (!token) {
      throw new Error("Nejdřív se prosím přihlas na hlavní stránce.");
    }

    const response = await fetch(
      `students/${encodeURIComponent(token)}.json?ts=${Date.now()}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(
        "Účet se nepodařilo načíst. Vrať se na hlavní stránku a přihlas se znovu.",
      );
    }

    const data = await response.json();
    const lessons = (Array.isArray(data.lessons) ? data.lessons : [])
      .slice()
      .sort(
        (first, second) =>
          (parseDate(second.date)?.getTime() || 0) -
          (parseDate(first.date)?.getTime() || 0),
      );
    const completedLessonsCount = Number.isFinite(Number(data.completedLessonsCount))
      ? Math.max(0, Math.round(Number(data.completedLessonsCount)))
      : lessons.length;
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const links = Array.isArray(data.links) ? data.links : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (Array.isArray(data.upcoming) ? data.upcoming : [])
      .filter(
        (row) =>
          !row?.date ||
          (parseDate(row.date)?.getTime() || 0) >= today.getTime(),
      )
      .sort(
        (first, second) =>
          (parseDate(first.date)?.getTime() || Infinity) -
          (parseDate(second.date)?.getTime() || Infinity),
      );

    const storageKey = `student-portal:${token}:`;
    const completed = readCompletedTasks(storageKey);

    document.title = `Studentský portál | ${data.studentName || "Student"}`;
    $("name").textContent = data.studentName || "Student";
    $("initials").textContent = data.studentInitials || "S";
    $("priorityTitle").textContent =
      data.priority?.title || "Vše důležité pro výuku na jednom místě.";
    $("priorityText").textContent =
      data.priority?.text || data.progressText || "";
    $("priorityDeadline").textContent = data.priority?.deadline || "";

    const scoredLessons = lessons.filter((lesson) =>
      Number.isFinite(Number(lesson.score)),
    );
    const averageScore = scoredLessons.length
      ? scoredLessons.reduce(
          (sum, lesson) => sum + Number(lesson.score),
          0,
        ) / scoredLessons.length
      : null;
    const readinessConfig = data.readiness || {};

    const calculateReadiness = () => {
      const completedCount = tasks.filter((task) => completed[task.id]).length;
      const taskRatio = tasks.length ? completedCount / tasks.length : 0;
      let value;

      if (averageScore !== null && tasks.length) {
        value =
          averageScore *
            10 *
            (Number(readinessConfig.lessonWeight ?? 60) / 100) +
          taskRatio *
            100 *
            (Number(readinessConfig.taskWeight ?? 40) / 100);
      } else if (averageScore !== null) {
        value = averageScore * 10;
      } else if (tasks.length) {
        value = taskRatio * 100;
      } else {
        value = Number(data.progress) || 0;
      }

      return Math.max(0, Math.min(100, Math.round(value)));
    };

    const renderNextAction = () => {
      const activeTask = tasks.find((task) => !completed[task.id]);

      $("nextAction").innerHTML = activeTask
        ? `
          <div class="item">
            <div class="item-main">
              <h3>${escapeHtml(activeTask.title)}</h3>
              <p>${escapeHtml(activeTask.meta)}</p>
            </div>
            <span class="badge">Priorita</span>
          </div>
        `
        : emptyState(
            tasks.length
              ? "Všechny zadané úkoly jsou dokončené."
              : "Momentálně není potřeba nic dokončit.",
          );
    };

    const updateSummary = () => {
      const completedCount = tasks.filter((task) => completed[task.id]).length;
      const activeCount = tasks.length - completedCount;
      const readiness = calculateReadiness();

      $("readinessLabel").textContent =
        readinessConfig.label || "Studijní postup";
      $("readinessValue").textContent = `${readiness} %`;
      $("readinessFill").style.width = `${readiness}%`;
      $("readinessCopy").textContent = `${
        averageScore !== null
          ? `Hodiny ${averageScore.toFixed(1).replace(".0", "")}/10`
          : "Bez hodnocení hodin"
      } · ${
        tasks.length
          ? `${completedCount} z ${tasks.length} úkolů hotovo`
          : "Bez aktivních úkolů"
      }`;
      $("activeCount").textContent = activeCount;
      $("taskMetricCopy").textContent = tasks.length
        ? activeCount
          ? `${activeCount} zbývá dokončit`
          : "Všechny úkoly dokončeny"
        : "Žádný aktivní úkol";

      renderNextAction();
    };

    const materialButtons = (material) => {
      const url = escapeAttribute(material.url || "#");
      return `
        <div class="actions">
          <a class="secondary" href="${url}" target="_blank" rel="noopener">Otevřít</a>
          <a class="download" href="${url}" download>Stáhnout PDF</a>
        </div>
      `;
    };

    const renderLesson = (lesson) => {
      const topics = Array.isArray(lesson.topics) ? lesson.topics : [];
      const material = lesson.material || {};
      const score = Number.isFinite(Number(lesson.score))
        ? Number(lesson.score)
        : null;
      const searchable = [
        lesson.title,
        lesson.subject,
        lesson.summary,
        lesson.improvement,
        lesson.homework,
        ...topics,
      ]
        .join(" ")
        .toLocaleLowerCase("cs");

      return `
        <div data-searchable="${escapeAttribute(searchable)}">
          <div class="lesson-summary">
            <div class="lesson-date">${escapeHtml(
              lesson.displayDate || formatDate(lesson.date),
            )}</div>
            <div>
              <div class="lesson-title">${escapeHtml(
                lesson.title || "Výuková hodina",
              )}</div>
              <div class="lesson-date">${escapeHtml(
                [lesson.subject, lesson.subtitle].filter(Boolean).join(" · "),
              )}</div>
            </div>
            ${
              score !== null
                ? `
                  <div class="lesson-score">
                    <strong>${score}/10</strong>
                    <small>${escapeHtml(
                      lesson.scoreLabel || "Hodnocení",
                    )}</small>
                  </div>
                `
                : ""
            }
          </div>
          <details class="lesson-detail">
            <summary>Zobrazit detail hodiny</summary>
            <div class="lesson-body">
              <div>
                <h3>Co se probíralo</h3>
                ${
                  topics.length
                    ? `<ul>${topics
                        .map((topic) => `<li>${escapeHtml(topic)}</li>`)
                        .join("")}</ul>`
                    : `<p>${escapeHtml(
                        lesson.summary || "Záznam není doplněn.",
                      )}</p>`
                }
              </div>
              <div>
                <h3>Hodnocení</h3>
                <div class="note">
                  <strong>${
                    score !== null ? `${score}/10 — ` : ""
                  }${escapeHtml(
                    lesson.scoreLabel || "Průběžné hodnocení",
                  )}</strong><br>
                  ${escapeHtml(
                    lesson.improvement || "Bez dalšího doporučení.",
                  )}
                </div>
              </div>
            </div>
            <div class="lesson-body">
              <div>
                <h3>Domácí úkol</h3>
                <p>${escapeHtml(
                  lesson.homework || "Bez domácího úkolu.",
                )}</p>
              </div>
              <div>
                <h3>Materiál k hodině</h3>
                <p>${escapeHtml(
                  material.title || "Materiál není přiložen.",
                )}</p>
                ${material.url ? materialButtons(material) : ""}
              </div>
            </div>
          </details>
        </div>
      `;
    };

    $("lessonCount").textContent = completedLessonsCount;
    const lastLesson = lessons[0] || null;
    $("lastLessonDate").textContent = lastLesson
      ? `Poslední: ${lastLesson.displayDate || formatShortDate(lastLesson.date)}`
      : "Zatím bez záznamu";
    $("overallScore").textContent =
      averageScore !== null
        ? `${averageScore.toFixed(1).replace(".0", "")}/10`
        : "–";
    $("overallScoreCopy").textContent = assessedLessonsCopy(
      scoredLessons.length,
      completedLessonsCount,
    );

    const deadline = data.deadline || {};
    const nextEvent = upcoming[0] || null;
    const nextLessonDate = parseDate(data.nextLesson?.dateISO);
    const deadlineDate = parseDate(deadline.date);
    const nextDate =
      nextEvent?.date ||
      (nextLessonDate?.getTime() >= today.getTime()
        ? data.nextLesson.dateISO
        : null) ||
      (deadlineDate?.getTime() >= today.getTime() ? deadline.date : null);

    $("nextDate").textContent = formatShortDate(nextDate);
    $("nextDateCopy").textContent =
      nextEvent?.title ||
      (nextDate === data.nextLesson?.dateISO ? data.nextLesson?.topic : null) ||
      deadline.label ||
      "Termín není uveden";

    $("materialsList").innerHTML = materials.length
      ? materials
          .map(
            (material) => `
              <div class="item" data-searchable="${escapeAttribute(
                [material.title, material.meta, material.badge]
                  .join(" ")
                  .toLocaleLowerCase("cs"),
              )}">
                <div class="item-main">
                  <h3>${escapeHtml(material.title)}</h3>
                  <p>${escapeHtml(material.meta)}</p>
                  ${materialButtons(material)}
                </div>
                <span class="badge">${escapeHtml(
                  material.badge || "Soubor",
                )}</span>
              </div>
            `,
          )
          .join("")
      : emptyState("Zatím tu nejsou žádné materiály.");

    $("historyList").innerHTML = lessons.length
      ? lessons.map(renderLesson).join("")
      : emptyState("Zatím tu není žádná absolvovaná hodina.");

    if (lastLesson) {
      const lastMaterial = lastLesson.material || {};
      $("lastLesson").innerHTML = `
        <div class="item">
          <div class="item-main">
            <h3>${escapeHtml(lastLesson.title)}</h3>
            <p>${escapeHtml(
              (lastLesson.displayDate || formatDate(lastLesson.date)) +
                (lastLesson.score != null
                  ? ` · zvládnutí ${lastLesson.score}/10`
                  : "") +
                (lastLesson.improvement
                  ? ` · ${lastLesson.improvement}`
                  : ""),
            )}</p>
          </div>
          ${
            lastLesson.score != null
              ? `<span class="badge good">${escapeHtml(
                  lastLesson.score,
                )}/10</span>`
              : ""
          }
        </div>
        <div class="actions">
          <button class="primary" data-open="history">Detail hodiny</button>
          ${
            lastMaterial.url
              ? `<a class="download" href="${escapeAttribute(
                  lastMaterial.url,
                )}" download>Stáhnout PDF</a>`
              : ""
          }
        </div>
      `;
    } else {
      $("lastLesson").innerHTML = emptyState(
        "Zatím tu není žádná absolvovaná hodina.",
      );
    }

    const renderTasks = () => {
      $("tasksList").innerHTML = tasks.length
        ? tasks
            .map(
              (task) => `
                <div
                  class="item task ${completed[task.id] ? "done" : ""}"
                  data-task="${escapeAttribute(task.id)}"
                  data-searchable="${escapeAttribute(
                    [task.title, task.meta]
                      .join(" ")
                      .toLocaleLowerCase("cs"),
                  )}"
                  role="button"
                  tabindex="0"
                  aria-pressed="${String(Boolean(completed[task.id]))}"
                >
                  <span class="check">✓</span>
                  <div class="item-main">
                    <h3>${escapeHtml(task.title)}</h3>
                    <p>${escapeHtml(task.meta)}</p>
                  </div>
                  <span class="badge">${escapeHtml(
                    task.badge || "Úkol",
                  )}</span>
                </div>
              `,
            )
            .join("")
        : emptyState("Zatím tu nejsou žádné úkoly.");
    };

    renderTasks();

    $("tasksList").addEventListener("click", (event) => {
      const task = event.target.closest("[data-task]");
      if (!task) return;

      completed[task.dataset.task] = !completed[task.dataset.task];
      localStorage.setItem(`${storageKey}tasks`, JSON.stringify(completed));
      renderTasks();
      updateSummary();
    });

    $("tasksList").addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const task = event.target.closest("[data-task]");
      if (!task) return;

      event.preventDefault();
      task.click();
    });

    if (averageScore !== null && tasks.length) {
      const formula = $("formula");
      formula.hidden = false;
      formula.innerHTML = `
        <strong>Jak se počítá připravenost:</strong>
        hodnocení hodin tvoří ${Number(
          readinessConfig.lessonWeight ?? 60,
        )} % výsledku a dokončení úkolů ${Number(
          readinessConfig.taskWeight ?? 40,
        )} %.
      `;
    }

    $("upcomingList").innerHTML = upcoming.length
      ? upcoming
          .map(
            (row) => `
              <div class="item" data-searchable="${escapeAttribute(
                [row.title, row.meta].join(" ").toLocaleLowerCase("cs"),
              )}">
                <div class="item-main">
                  <h3>${escapeHtml(row.title)}</h3>
                  <p>${escapeHtml(row.meta)}</p>
                </div>
                <span class="badge">${escapeHtml(
                  row.badge || "Termín",
                )}</span>
              </div>
            `,
          )
          .join("")
      : emptyState("Zatím nejsou žádné další termíny.");

    $("timelineList").innerHTML = timeline.length
      ? timeline
          .map(
            (row) => `
              <div class="item" data-searchable="${escapeAttribute(
                [row.title, row.desc, row.month, row.day]
                  .join(" ")
                  .toLocaleLowerCase("cs"),
              )}">
                <div class="item-main">
                  <h3>${escapeHtml(
                    [row.month, row.day, row.title]
                      .filter(Boolean)
                      .join(" · "),
                  )}</h3>
                  <p>${escapeHtml(row.desc)}</p>
                </div>
                <span class="badge">${escapeHtml(
                  row.badge || "Historie",
                )}</span>
              </div>
            `,
          )
          .join("")
      : emptyState("Zatím tu není žádná historie.");

    $("linksList").innerHTML = links.length
      ? links
          .map(
            (link) => `
              <div class="item" data-searchable="${escapeAttribute(
                [link.title, link.desc].join(" ").toLocaleLowerCase("cs"),
              )}">
                <div class="item-main">
                  <h3>${escapeHtml(link.title)}</h3>
                  <p>${escapeHtml(link.desc)}</p>
                  <div class="actions">
                    <a
                      class="secondary"
                      href="${escapeAttribute(link.url || "#")}"
                      target="_blank"
                      rel="noopener"
                    >Otevřít odkaz</a>
                  </div>
                </div>
              </div>
            `,
          )
          .join("")
      : emptyState("Zatím tu nejsou žádné odkazy.");

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => openView(button.dataset.view));
    });

    document.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => openView(button.dataset.open));
    });

    $("search").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLocaleLowerCase("cs");
      document.querySelectorAll("[data-searchable]").forEach((row) => {
        row.hidden = Boolean(query) && !row.dataset.searchable.includes(query);
      });
    });

    $("logout").addEventListener("click", () => {
      sessionStorage.removeItem("student_token");
      window.location.href = "index.html";
    });

    updateSummary();
    app.hidden = false;
  } catch (error) {
    showError(error.message || "Došlo k neočekávané chybě.");
  } finally {
    loader.classList.add("hidden");
  }
})();
