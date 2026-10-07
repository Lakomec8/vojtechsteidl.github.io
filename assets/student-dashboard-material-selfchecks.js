(() => {
  "use strict";

  const materialList = document.getElementById("dashboardMaterialsList");
  const testList = document.getElementById("dashboardTestsList");
  if (!materialList || !testList) return;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function currentMaterial(materials) {
    const sorted = (Array.isArray(materials) ? materials : [])
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
      const link = node("a", "download", "Otevřít PDF");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      item.append(link);
    }
    materialList.append(item);
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

  function renderTests(assignments) {
    testList.replaceChildren();
    if (!assignments.length) {
      testList.append(node("div", "empty", "Zatím nemáš přiřazený žádný diagnostický test."));
      return;
    }

    for (const assignment of assignments) {
      const item = node("article", "item dashboard-test-card");
      const main = node("div", "item-main");
      main.append(
        node("h3", "", assignment.title || "Diagnostický test"),
        node("p", "", assignment.description || ""),
      );
      const meta = node("div", "self-check-meta");
      meta.append(
        node("span", "badge", assignment.topic || "Test"),
        node("span", "", `${assignment.question_count} otázek`),
        node("span", "", `asi ${assignment.estimated_minutes} min`),
      );
      main.append(meta);

      if (assignment.latest_score != null && assignment.latest_max_score != null) {
        const percent = Math.round((assignment.latest_score / assignment.latest_max_score) * 100);
        main.append(node("p", "dashboard-test-result",
          `Poslední výsledek: ${assignment.latest_score}/${assignment.latest_max_score} (${percent} %)`));
      } else {
        main.append(node("p", "dashboard-test-result", "Zatím bez výsledku"));
      }

      item.append(main);
      if (Number(assignment.available) === 1) {
        const button = node("button", "primary", assignment.latest_score == null ? "Spustit test" : "Zkusit znovu");
        button.type = "button";
        button.addEventListener("click", () => openTestInMaterials(assignment));
        item.append(button);
      }
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
      renderTests(Array.isArray(selfChecks.assignments) ? selfChecks.assignments : []);
    } catch (error) {
      materialList.replaceChildren(node("div", "empty", error.message));
      testList.replaceChildren(node("div", "empty", error.message));
    }
  }

  load();
})();
