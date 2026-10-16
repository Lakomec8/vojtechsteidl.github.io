(() => {
  const compactEl = document.getElementById("compactCapacity");
  const calendarEl = document.getElementById("weeklyCalendar");
  if (!compactEl && !calendarEl) return;

  const selection = document.getElementById("slotSelection");
  const selectedTitle = document.getElementById("selectedSlotTitle");
  const selectedMeta = document.getElementById("selectedSlotMeta");
  const selectedId = document.getElementById("selectedSlotId");
  const selectedInfo = document.getElementById("selectedSlotInfo");
  const weekLabel = document.getElementById("calendarWeekLabel");
  const weekSummary = document.getElementById("calendarWeekSummary");
  const liveStatus = document.getElementById("calendarLiveStatus");
  const dayOrder = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
  const refreshIntervalMs = 15 * 60 * 1000;
  let currentSlots = [];
  let refreshInFlight = null;
  let lastRefreshAt = 0;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);

  function renderCompact(slots) {
    if (!compactEl) return;
    const visible = slots.filter((slot) => slot.kind !== "full").slice(0, 3);
    if (!visible.length) {
      compactEl.innerHTML = '<p class="compact-capacity-empty">Následující týden je momentálně bez volné kapacity.</p>';
      compactEl.dataset.live = "true";
      return;
    }
    compactEl.innerHTML = visible.map((slot) => {
      const when = [slot.day, slot.time].filter(Boolean).join(" · ");
      return `<a class="compact-capacity-card" href="/skupinove-doucovani-matematiky/">
        <small>${esc(when)}</small>
        <strong>${esc(slot.title)}</strong>
        <span>${slot.flexible ? "Volno" : slot.kind === "free" ? "Volný termín" : `${Number(slot.people)}/${Number(slot.capacity)} míst`}</span>
      </a>`;
    }).join("");
    compactEl.dataset.live = "true";
  }

  function selectSlot(slot) {
    if (!selection || !selectedTitle || !selectedMeta || !selectedId || !selectedInfo) return;
    selectedTitle.textContent = slot.title;
    const capacityText = slot.flexible ? "" : (slot.kind === "free" ? "volný termín" : `${slot.people}/${slot.capacity} míst`);
    selectedMeta.textContent = [slot.day, slot.time, capacityText].filter(Boolean).join(" · ");
    selectedId.value = slot.id;
    selectedInfo.value = [slot.day, slot.time, slot.title, capacityText].filter(Boolean).join(" | ");
    selection.hidden = false;
    selection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function dateForDay(week, dayIndex) {
    if (typeof week?.startDate !== "string") return "";
    const [year, month, day] = week.startDate.split("-").map(Number);
    if (!year || !month || !day) return "";
    const date = new Date(Date.UTC(year, month - 1, day + dayIndex, 12));
    return new Intl.DateTimeFormat("cs-CZ", {
      timeZone: "Europe/Prague",
      day: "numeric",
      month: "numeric",
    }).format(date);
  }

  function renderFull(slots, week) {
    if (!calendarEl) return;
    currentSlots = slots;
    calendarEl.innerHTML = dayOrder.map((day, dayIndex) => {
      const daySlots = slots.filter((slot) => slot.day === day);
      const body = daySlots.length ? daySlots.map((slot) => {
        const state = slot.kind === "free" ? "free" : slot.kind === "full" ? "full" : "join";
        const action = state === "free" ? (slot.flexible ? "Domluvit" : "Vybrat slot") : state === "full" ? "Plno" : "Přidat se";
        const control = state === "full"
          ? '<span class="calendar-slot-action disabled">Plno</span>'
          : `<button type="button" class="calendar-slot-action" data-public-slot-id="${esc(slot.id)}">${esc(action)}</button>`;
        const time = slot.time ? `<div class="calendar-slot-time">${esc(slot.time)}</div>` : "";
        return `<article class="calendar-slot ${state}">
          ${time}
          <strong>${esc(slot.title)}</strong>
          <div class="calendar-slot-foot">${slot.flexible ? "" : `<span>${Number(slot.people)}/${Number(slot.capacity)}</span>`}${control}</div>
        </article>`;
      }).join("") : '<div class="calendar-empty">—</div>';
      const date = dateForDay(week, dayIndex);
      return `<section class="calendar-day"><h3>${esc(day)}${date ? `<span class="calendar-day-date">${esc(date)}</span>` : ""}</h3><div class="calendar-day-slots">${body}</div></section>`;
    }).join("");
    calendarEl.dataset.live = "true";
  }

  if (calendarEl) {
    calendarEl.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-public-slot-id]") : null;
      if (!target) return;
      const slot = currentSlots.find((item) => item.id === target.getAttribute("data-public-slot-id"));
      if (slot) selectSlot(slot);
    });
  }

  function validSlots(slots) {
    return Array.isArray(slots) && slots.every((slot) =>
      typeof slot.id === "string" &&
      typeof slot.day === "string" &&
      typeof slot.time === "string" &&
      typeof slot.title === "string" &&
      ["free", "join", "full"].includes(slot.kind) &&
      Number.isFinite(Number(slot.people)) &&
      Number.isFinite(Number(slot.capacity))
    );
  }

  function renderWeekLabel(week) {
    if (!weekLabel || typeof week?.startDate !== "string" || typeof week?.endDate !== "string") return;
    const format = (value, includeYear) => {
      const [year, month, day] = value.split("-").map(Number);
      if (!year || !month || !day) return value;
      return new Intl.DateTimeFormat("cs-CZ", {
        timeZone: "Europe/Prague",
        day: "numeric",
        month: "numeric",
        ...(includeYear ? { year: "numeric" } : {}),
      }).format(new Date(Date.UTC(year, month - 1, day, 12)));
    };
    weekLabel.textContent = `Následující týden · ${format(week.startDate, false)}–${format(week.endDate, true)}`;
  }

  function renderSummary(slots) {
    if (!weekSummary) return;
    const free = slots.filter((slot) => slot.kind === "free").length;
    const joinable = slots.filter((slot) => slot.kind === "join").length;
    weekSummary.textContent = `${free} ${free === 1 ? "volný termín" : free >= 2 && free <= 4 ? "volné termíny" : "volných termínů"} · ${joinable} ${joinable === 1 ? "skupina s místem" : joinable >= 2 && joinable <= 4 ? "skupiny s místem" : "skupin s místem"}`;
  }

  function renderLiveStatus(isLive, syncedAt) {
    if (!liveStatus) return;
    const synced = typeof syncedAt === "string" ? new Date(syncedAt) : null;
    const hasTimestamp = synced && !Number.isNaN(synced.getTime());
    liveStatus.textContent = isLive && hasTimestamp
      ? `Google Kalendář · synchronizováno ${new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }).format(synced)}`
      : isLive ? "Google Kalendář · čekám na první synchronizaci" : "Google Kalendář · dostupnost nelze ověřit";
    liveStatus.dataset.state = isLive && hasTimestamp ? "live" : "fallback";
  }

  function refreshCapacity() {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = fetch(`https://capacity.vojtechsteidl.eu/api/public-capacity?ts=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("capacity-api");
        return response.json();
      })
      .then((data) => {
        if (!validSlots(data.slots)) throw new Error("capacity-payload");
        renderCompact(data.slots);
        renderFull(data.slots, data.week);
        renderWeekLabel(data.week);
        renderSummary(data.slots);
        renderLiveStatus(true, data.calendarSyncedAt);
        lastRefreshAt = Date.now();
      })
      .catch(() => {
        currentSlots = [];
        if (compactEl) {
          compactEl.dataset.live = "false";
          compactEl.innerHTML = '<p role="status">Dostupnost nelze ověřit. Kontaktujte mě pro výběr termínu.</p>';
        }
        if (calendarEl) {
          calendarEl.dataset.live = "false";
          calendarEl.innerHTML = '<p class="calendar-empty" role="status">Dostupnost nelze ověřit. Kontaktujte mě pro výběr termínu.</p>';
        }
        if (selection) selection.hidden = true;
        renderLiveStatus(false);
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  }

  currentSlots = [];
  if (compactEl) compactEl.innerHTML = '<p role="status">Ověřuji dostupnost termínů…</p>';
  if (calendarEl) calendarEl.innerHTML = '<p class="calendar-empty" role="status">Ověřuji dostupnost termínů…</p>';
  refreshCapacity();
  window.setInterval(refreshCapacity, refreshIntervalMs);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastRefreshAt >= refreshIntervalMs) refreshCapacity();
  });
})();
