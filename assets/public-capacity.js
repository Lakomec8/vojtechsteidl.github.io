(() => {
  const calendarEl = document.getElementById("weeklyCalendar");
  const selection = document.getElementById("slotSelection");
  const selectedTitle = document.getElementById("selectedSlotTitle");
  const selectedMeta = document.getElementById("selectedSlotMeta");
  const selectedId = document.getElementById("selectedSlotId");
  const selectedInfo = document.getElementById("selectedSlotInfo");
  if (!calendarEl || !selection || !selectedTitle || !selectedMeta || !selectedId || !selectedInfo) return;

  const dayOrder = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
  let currentSlots = [];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);

  function selectSlot(slot) {
    selectedTitle.textContent = slot.title;
    selectedMeta.textContent = `${slot.day} · ${slot.time} · ${slot.people}/${slot.capacity} míst`;
    selectedId.value = slot.id;
    selectedInfo.value = `${slot.day} ${slot.time} | ${slot.title} | ${slot.people}/${slot.capacity}`;
    selection.hidden = false;
    selection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function render(slots) {
    currentSlots = slots;
    calendarEl.innerHTML = dayOrder.map((day) => {
      const daySlots = slots.filter((slot) => slot.day === day);
      const body = daySlots.length ? daySlots.map((slot) => {
        const state = slot.kind === "free" ? "free" : slot.kind === "full" ? "full" : "join";
        const action = state === "free" ? "Vybrat slot" : state === "full" ? "Plno" : "Přidat se";
        const control = state === "full"
          ? '<span class="calendar-slot-action disabled">Plno</span>'
          : `<button type="button" class="calendar-slot-action" data-public-slot-id="${esc(slot.id)}">${esc(action)}</button>`;
        return `<article class="calendar-slot ${state}">
          <div class="calendar-slot-time">${esc(slot.time)}</div>
          <strong>${esc(slot.title)}</strong>
          <div class="calendar-slot-foot"><span>${Number(slot.people)}/${Number(slot.capacity)}</span>${control}</div>
        </article>`;
      }).join("") : '<div class="calendar-empty">—</div>';
      return `<section class="calendar-day"><h3>${esc(day)}</h3><div class="calendar-day-slots">${body}</div></section>`;
    }).join("");
  }

  calendarEl.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-public-slot-id]") : null;
    if (!target) return;
    const slot = currentSlots.find((item) => item.id === target.getAttribute("data-public-slot-id"));
    if (slot) selectSlot(slot);
  });

  fetch("/api/public-capacity", {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) throw new Error("capacity-api");
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.slots) || !data.slots.length) return;
      const safe = data.slots.every((slot) =>
        typeof slot.id === "string" &&
        typeof slot.day === "string" &&
        typeof slot.time === "string" &&
        typeof slot.title === "string" &&
        ["free", "join", "full"].includes(slot.kind) &&
        Number.isFinite(Number(slot.people)) &&
        Number.isFinite(Number(slot.capacity))
      );
      if (!safe) return;
      render(data.slots);
      calendarEl.dataset.live = "true";
    })
    .catch(() => {
      calendarEl.dataset.live = "false";
    });
})();
