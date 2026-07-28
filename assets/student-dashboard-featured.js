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
  if (!token) return;

  const renderFeaturedMaterial = async () => {
    try {
      const response = await fetch(
        `students/${encodeURIComponent(token)}.json?featured=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;

      const data = await response.json();
      const materials = Array.isArray(data.materials) ? data.materials : [];
      const material = data.featuredMaterial || materials[0] || null;
      if (!material?.url) return;

      const target = document.getElementById("lastLesson");
      if (!target) return;

      const url = escapeHtml(material.url);
      target.innerHTML = `
        <div class="item">
          <div class="item-main">
            <h3>${escapeHtml(material.title || "Aktuální materiál")}</h3>
            <p>${escapeHtml(material.meta || "PDF materiál")}</p>
          </div>
          <span class="badge">${escapeHtml(material.badge || "PDF")}</span>
        </div>
        <div class="actions">
          <a class="secondary" href="${url}" target="_blank" rel="noopener">Otevřít</a>
          <a class="download" href="${url}" download>Stáhnout PDF</a>
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

  const waitForPortal = () => {
    const app = document.getElementById("app");
    const target = document.getElementById("lastLesson");
    if (app && !app.hidden && target) {
      renderFeaturedMaterial();
      return;
    }
    window.setTimeout(waitForPortal, 100);
  };

  waitForPortal();
})();
