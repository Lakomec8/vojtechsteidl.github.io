(() => {
  "use strict";

  const materialList = document.getElementById("dashboardMaterialsList");
  const interactiveList = document.getElementById("dashboardInteractiveList");
  const testList = document.getElementById("dashboardTestsList");
  if (!materialList || !interactiveList || !testList) return;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function currentMaterial(materials) {
    const sorted = (Array.isArray(materials) ? materials : [])
      .filter((item) => item.kind !== "interactive" && !/\/interactive-notes\//i.test(String(item.url || "")))
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return sorted.find((material) => String(material.badge || "")
      .trim()
      .toLocaleLowerCase("cs") === "aktuální pdf") || sorted[0] || null;
  }

  async function api(url) {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!response.ok) throw new Error("Přehled se nepodařilo načíst.");
    return response.json();
  }

  function renderMaterial(profile) {
    materialList.replaceChildren();
    const material = currentMaterial(profile.materials);
    if (!material) {
      materialList.append(node("div", "empty", "Zatím tu není žádný aktuální PDF materiál."));
      return;
    }

    const item = node("article", "item");
    const main = node("div", "item-main");
    main.append(
      node("h3", "", material.title || "Výukový materiál"),
      node("p", "", material.meta || material.date || ""),
    );
    item.append(main, node("span", "badge", material.badge || "Aktuální PDF"));

    const url = String(material.url || "").trim();
    if (url) {
      const isPdf = /\.pdf(?:[?#].*)?$/i.test(url) || /pdf/i.test(String(material.badge || ""));
      const link = node("a", "download", isPdf ? "Otevřít PDF" : "Spustit interaktivní materiál");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      item.append(link);
    }
    materialList.append(item);
  }

  function renderInteractive(profile) {
    interactiveList.replaceChildren();
    const notes = (Array.isArray(profile.materials) ? profile.materials : [])
      .filter((material) => material.kind === "interactive" ||
        /\/interactive-notes\//i.test(String(material.url || "")))
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const latest = notes[0];
    if (!latest) {
      interactiveList.append(node("div", "empty", "Zatím tu není přiřazený žádný interaktivní zápis."));
      return;
    }

    const item = node("article", "item dashboard-interactive-card");
    const main = node("div", "item-main");
    main.append(
      node("h3", "", latest.title || "Interaktivní zápis"),
      node("p", "", latest.meta || latest.date || "Matematická laboratoř"),
    );
    item.append(main, node("span", "badge", "Interaktivní zápis"));
    const url = String(latest.url || "").trim();
    // Only open existing lesson pages; do not execute untrusted custom URLs.
    if (/^\/interactive-notes\/[a-z0-9-]+\/?(?:[?#].*)?$/i.test(url) ||
        /^https:\/\/(?:www\.)?vojtechsteidl\.eu\/interactive-notes\/[a-z0-9-]+\/?(?:[?#].*)?$/i.test(url)) {
      const link = node("a", "secondary resource-lesson-link", "Otevřít zápis ↗");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      item.append(link);
    }
    if (notes.length > 1) {
      item.append(node("p", "resource-other-count",
        "Další přiřazené zápisy: " + (notes.length - 1)));
    }
    interactiveList.append(item);
  }

  function openTestInMaterials(assignment) {
    document.querySelector('[data-view="materials"]')?.click();
    const list = document.getElementById("selfChecksList");
    const startedAt = Date.now();

    const tryOpen = () => {
      const card = [...(list?.querySelectorAll(".self-check-card") || [])]
        .find((item) => item.querySelector("h3")?.textContent?.trim() === assignment.title);
      const button = card?.querySelector(".self-check-start");
      if (button) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => button.click(), 120);
        return;
      }
      if (Date.now() - startedAt < 4000) window.setTimeout(tryOpen, 120);
    };
    tryOpen();
  }

  function showSavedResult(assignment) {
    window.dispatchEvent(new CustomEvent("student:self-check-open-saved-result", {
      detail: { assignmentId: assignment.id },
    }));
  }

  function renderTests(assignments) {
    testList.replaceChildren();
    const rows = Array.isArray(assignments) ? assignments : [];
    const latestAssigned = rows.slice().sort((a, b) =>
      String(b.assigned_at || "").localeCompare(String(a.assigned_at || "")))[0];
    const latestCompleted = rows
      .filter((a) => a.latest_score != null && a.latest_max_score != null)
      .sort((a, b) => String(b.latest_submitted_at || "").localeCompare(
        String(a.latest_submitted_at || "")))[0];
    const metric = document.getElementById("selfCheckScore")?.closest(".metric");
    if (metric) {
      metric.querySelector("#dashboardLastTestReview")?.remove();
      if (latestCompleted) {
        const review = node("button", "secondary metric-review", "Zobrazit odpovědi");
        review.id = "dashboardLastTestReview";
        review.type = "button";
        review.addEventListener("click", () => showSavedResult(latestCompleted));
        metric.append(review);
      }
    }
    const displayed = [latestAssigned];
    // When a newer test is awaiting completion, retain the last completed
    // test alongside it so that past mistakes remain accessible.
    if (latestCompleted && latestCompleted.id !== latestAssigned?.id) {
      displayed.push(latestCompleted);
    }
    if (!latestAssigned) {
      testList.append(node("div", "empty", "Zatím nemáš přiřazený žádný diagnostický test."));
      return;
    }

    for (const [index, assignment] of displayed.entries()) {
      const item = node("article", "item dashboard-test-card");
      const main = node("div", "item-main");
      if (index === 1) main.append(node("span", "dashboard-test-kicker", "POSLEDNÍ VYHODNOCENÝ POKUS"));
      main.append(
        node("h3", "", assignment.title || "Diagnostický test"),
        node("p", "", String(assignment.description || "")
          .replace(/\[\[calculator:[^\]]+\]\]/gi, "").trim()),
      );
      const meta = node("div", "self-check-meta");
      meta.append(
        node("span", "badge", assignment.topic || "Test"),
        node("span", "", String(assignment.question_count) + " otázek"),
        node("span", "", "asi " + assignment.estimated_minutes + " min"),
      );
      main.append(meta);

      const completed = assignment.latest_score != null && assignment.latest_max_score != null;
      if (completed) {
        const percent = assignment.latest_max_score > 0
          ? Math.round(assignment.latest_score / assignment.latest_max_score * 100) : 0;
        const partial = Number(assignment.latest_is_partial) === 1;
        const label = partial ? "Částečný výsledek" : "Poslední výsledek";
        main.append(node("p", "dashboard-test-result",
          label + ": " + assignment.latest_score + "/" + assignment.latest_max_score + " (" + percent + " %)"));
        if (partial) {
          const completedQuestions = assignment.latest_answered_count ?? "?";
          const totalQuestions = assignment.latest_total_questions ?? assignment.question_count;
          main.append(node("p", "dashboard-test-partial",
            completedQuestions + "/" + totalQuestions + " úloh · procento pouze ze zodpovězené části"));
        }
      } else {
        main.append(node("p", "dashboard-test-result", "Zatím bez výsledku"));
      }

      item.append(main);
      const buttons = node("div", "dashboard-test-actions");
      if (completed) {
        const review = node("button", "secondary dashboard-review-button", "Zobrazit odpovědi");
        review.type = "button";
        review.addEventListener("click", () => showSavedResult(assignment));
        buttons.append(review);
      }
      if (Number(assignment.available) === 1) {
        const launch = node("button", "primary", completed ? "Zkusit znovu" : "Spustit test");
        launch.type = "button";
        launch.addEventListener("click", () => openTestInMaterials(assignment));
        buttons.append(launch);
      }
      if (buttons.childNodes.length) item.append(buttons);
      testList.append(item);
    }
  }

  async function load() {
    try {
      const [profile, selfChecks] = await Promise.all([
        api("./api/profile"),
        api("./api/self-checks"),
      ]);
      renderMaterial(profile);
      renderInteractive(profile);
      renderTests(Array.isArray(selfChecks.assignments) ? selfChecks.assignments : []);
    } catch (error) {
      materialList.replaceChildren(node("div", "empty", error.message));
      interactiveList.replaceChildren(node("div", "empty", error.message));
      testList.replaceChildren(node("div", "empty", error.message));
    }
  }

  window.addEventListener("student:self-check-submitted", async () => {
    try {
      const saved = await api("./api/self-checks");
      renderTests(saved.assignments);
    } catch {
      // The existing dashboard remains visible; another visit reloads the result.
    }
  });

  load();
})();
