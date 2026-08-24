(() => {
  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);

  const token = sessionStorage.getItem("student_token");

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatShortDate = (value) => {
    const date = parseDate(value);
    if (!date) return value ? String(value) : "";
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "numeric",
    }).format(date);
  };

  const renderFeaturedMaterial = async () => {
    try {
      const profileUrl = token
        ? `students/${encodeURIComponent(token)}.json?featured=${Date.now()}`
        : "./api/profile";
      const response = await fetch(profileUrl, {
        cache: "no-store",
        ...(token ? {} : { credentials: "same-origin" }),
      });
      if (!response.ok) return;

      const data = await response.json();
      const materials = (Array.isArray(data.materials) ? data.materials : [])
        .map((material, index) => ({ material, index }))
        .sort((first, second) => {
          const byDate =
            (parseDate(second.material?.date)?.getTime() || 0) -
            (parseDate(first.material?.date)?.getTime() || 0);
          return byDate || first.index - second.index;
        })
        .map(({ material }) => material);

      // Datum hodiny je zdroj pravdy pro to, co je aktuální. Tím zůstane
      // nástěnka správná i při dodatečném nahrání staršího dokumentu.
      const material =
        materials.find((item) => item?.url) || data.featuredMaterial || null;
      if (!material?.url) return;

      const target = document.getElementById("lastLesson");
      if (!target) return;

      const url = escapeHtml(material.url);
      target.innerHTML = `
        <div class="item">
          <div class="item-main">
            <h3>${escapeHtml(material.title || "Aktuální materiál")}</h3>
            <p>${escapeHtml(material.meta || "Studijní materiál")}</p>
          </div>
          <span class="badge">${escapeHtml(material.badge || "Soubor")}</span>
        </div>
        <div class="actions">
          <a class="secondary" href="${url}" target="_blank" rel="noopener">Otevřít</a>
          <a class="download" href="${url}" download>Stáhnout</a>
        </div>
      `;

      const cardTitle = target.closest(".card")?.querySelector("h2");
      if (cardTitle) cardTitle.textContent = "Aktuální materiál";

      const historyButton = document.querySelector(
        '#dashboard .hero button[data-open="history"]',
      );
      if (historyButton) {
        historyButton.dataset.open = "materials";
        historyButton.textContent = "Zobrazit materiály";
      }
    } catch (error) {
      console.warn("Aktuální materiál se nepodařilo zobrazit na nástěnce.", error);
    }
  };

  let attempts = 0;
  const waitForPortal = () => {
    const app = document.getElementById("app");
    const target = document.getElementById("lastLesson");
    if (app && !app.hidden && target) {
      renderFeaturedMaterial();
      return;
    }

    attempts += 1;
    if (attempts < 100) window.setTimeout(waitForPortal, 100);
  };

  waitForPortal();
})();
