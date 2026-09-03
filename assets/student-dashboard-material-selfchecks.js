(() => {
  "use strict";

  const target = document.getElementById("dashboardMaterialsList");
  if (!target) return;

  const STOP_WORDS = new Set([
    "diagnostika", "self", "check", "test", "rychly", "rychla", "zaklad",
    "zaklady", "matematika", "material", "materialy", "stredni", "skola",
  ]);

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokens(value) {
    const values = normalize(value)
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
    const set = new Set(values);

    const geometryHints = [
      "planimetrie", "trojuhelnik", "trojuhelniky", "mnohouhelnik",
      "mnohouhelniky", "pythagorova", "kosinova", "sinova", "heronuv",
      "kruznice", "ctverec", "lichobeznik",
    ];
    if (geometryHints.some((hint) => values.some((token) => token.startsWith(hint)))) {
      set.add("planimetrie");
    }

    return set;
  }

  function matchingAssignment(material, assignments) {
    const materialText = [material.title, material.meta, material.badge].filter(Boolean).join(" ");
    const materialTokens = tokens(materialText);
    const materialTitle = normalize(material.title);
    let best = null;
    let bestScore = 0;

    for (const assignment of assignments) {
      if (Number(assignment.available) !== 1) continue;
      const assignmentText = [assignment.title, assignment.topic].filter(Boolean).join(" ");
      const assignmentTokens = tokens(assignmentText);
      const assignmentTopic = normalize(assignment.topic);
      let overlap = 0;
      let strongMatch = false;

      for (const token of assignmentTokens) {
        if (!materialTokens.has(token)) continue;
        overlap += 1;
        if (token.length >= 7 || token === "planimetrie") strongMatch = true;
      }

      let score = overlap;
      if (materialTitle && assignmentTopic && (
        materialTitle.includes(assignmentTopic) || assignmentTopic.includes(materialTitle)
      )) score += 4;

      const acceptable = score >= 2 || (score >= 1 && (materialTokens.size <= 2 || strongMatch));
      if (acceptable && score > bestScore) {
        best = assignment;
        bestScore = score;
      }
    }

    return best;
  }

  async function api(url) {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!response.ok) throw new Error("Přehled materiálů se nepodařilo načíst.");
    return response.json();
  }

  function openAssignedSelfCheck(assignment) {
    document.querySelector('[data-view="tasks"]')?.click();
    const list = document.getElementById("selfChecksList");
    const startedAt = Date.now();

    const tryOpen = () => {
      const cards = [...(list?.querySelectorAll(".self-check-card") || [])];
      const card = cards.find((item) =>
        item.querySelector("h3")?.textContent?.trim() === assignment.title,
      );
      const button = card?.querySelector(".self-check-start");
      if (button) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => button.click(), 120);
        return;
      }
      if (Date.now() - startedAt < 3000) window.setTimeout(tryOpen, 120);
    };

    tryOpen();
  }

  function materialAction(material) {
    const url = String(material.url || "").trim();
    if (!url) return null;
    const isPdf =
      material.badgeClass === "pdf" ||
      /pdf/i.test(String(material.badge || "")) ||
      /\.pdf(?:[?#].*)?$/i.test(url);
    const link = node("a", "secondary", isPdf ? "Otevřít materiál" : "Spustit zápis");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
  }

  function render(materials, assignments) {
    target.replaceChildren();
    const shown = materials.slice(0, 6);

    if (!shown.length) {
      target.append(node("div", "empty", "Zatím tu nejsou žádné materiály."));
      return;
    }

    for (const material of shown) {
      const item = node("div", "item");
      const main = node("div", "item-main");
      main.append(
        node("h3", "", material.title || "Výukový materiál"),
        node("p", "", material.meta || material.date || ""),
      );

      const actions = node("div", "actions");
      const materialLink = materialAction(material);
      if (materialLink) actions.append(materialLink);

      const assignment = matchingAssignment(material, assignments);
      if (assignment) {
        const label = assignment.latest_score === null
          ? "Spustit test"
          : "Zkusit test znovu";
        const button = node("button", "primary", label);
        button.type = "button";
        button.addEventListener("click", () => openAssignedSelfCheck(assignment));
        actions.append(button);

        if (assignment.latest_score !== null && assignment.latest_max_score !== null) {
          main.append(node(
            "p",
            "self-check-latest",
            `Poslední test: ${assignment.latest_score}/${assignment.latest_max_score}`,
          ));
        }
      }

      if (actions.childElementCount) main.append(actions);
      item.append(main, node("span", "badge", material.badge || "Materiál"));
      target.append(item);
    }
  }

  async function load() {
    try {
      const [profile, selfChecks] = await Promise.all([
        api("./api/profile"),
        api("./api/self-checks"),
      ]);
      const materials = (Array.isArray(profile.materials) ? profile.materials : [])
        .slice()
        .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));
      const assignments = Array.isArray(selfChecks.assignments) ? selfChecks.assignments : [];
      render(materials, assignments);
    } catch (error) {
      target.replaceChildren(node("div", "empty", error.message));
    }
  }

  load();
})();
