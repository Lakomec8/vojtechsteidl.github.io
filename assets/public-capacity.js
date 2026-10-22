(() => {
  const calendarEl = document.getElementById("weeklyCalendar");
  if (!calendarEl) return;
  const API_BASE = window.__CAPACITY_API_BASE || "https://capacity.vojtechsteidl.eu";
  const PRAGUE_TIME_ZONE = "Europe/Prague";
  const dayOrder = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
  const dayAbbreviations = { Pondělí: "PO", Úterý: "ÚT", Středa: "ST", Čtvrtek: "ČT", Pátek: "PÁ" };
  const lessonCountLabel = (n) => n === 1 ? "lekce" : n >= 2 && n <= 4 ? "lekce" : "lekcí";
  const refreshIntervalMs = 15 * 60 * 1000;
  const timelineStart = 13 * 60;
  const timelineEnd = 20 * 60 + 30;
  const timelineMinutes = timelineEnd - timelineStart;
  const weekLabel = document.getElementById("calendarWeekLabel");
  const weekSummary = document.getElementById("calendarWeekSummary");
  const liveStatus = document.getElementById("calendarLiveStatus");
  const form = document.getElementById("slotBookingForm");
  const status = document.getElementById("slotBookingStatus");
  const typeInputs = Array.from(document.querySelectorAll('.calendar-booking-type input[name="booking_type"]'));
  const timeSelect = document.getElementById("bookingStartAt");
  const panel = document.getElementById("rezervace-terminu");
  const selectedTitle = document.getElementById("bookingSelectedTitle");
  const selectedMeta = document.getElementById("bookingSelectedMeta");
  const dismiss = document.getElementById("bookingDismiss");
  const actionStatus = document.getElementById("calendarActionStatus");
  let selectedWindowKey = null;
  let currentWindows = [];
  let currentData = null;
  let refreshInFlight = null;
  let lastRefreshAt = 0;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
  const minutes = (value) => {
    const [hour, minute] = String(value).split(":").map(Number);
    return hour * 60 + minute;
  };
  const parseTimeRange = (value) => {
    const [start, end] = String(value).split("–");
    if (!start || !end) return null;
    const startMinute = minutes(start);
    const endMinute = minutes(end);
    return Number.isFinite(startMinute) && Number.isFinite(endMinute) && endMinute > startMinute
      ? { start: startMinute, end: endMinute }
      : null;
  };

  function dateForDay(week, dayIndex) {
    if (typeof week?.startDate !== "string") return "";
    const [year, month, day] = week.startDate.split("-").map(Number);
    if (!year || !month || !day) return "";
    return new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, day: "numeric", month: "numeric" })
      .format(new Date(Date.UTC(year, month - 1, day + dayIndex, 12)));
  }

  const selectedType = () => typeInputs.find((input) => input.checked)?.value || "diagnostic_30";
  const shortTitle = (value) => String(value).length > 27 ? String(value).slice(0, 26).trimEnd() + "…" : String(value);

  // Collapse overlapping 15-minute candidate starts into distinct, genuinely
  // available calendar windows. Only API-confirmed availability becomes clickable.
  function groupAvailableWindows(options) {
    const groups = [];
    const ordered = [...options].sort((a, b) => a.startAt.localeCompare(b.startAt));
    for (const option of ordered) {
      const range = parseTimeRange(option.time);
      if (!range || !dayOrder.includes(option.day) || !Number.isFinite(Date.parse(option.startAt))) continue;
      const previous = groups[groups.length - 1];
      if (previous && previous.day === option.day && range.start <= previous.lastStart + 15 && range.start > previous.lastStart) {
        previous.lastStart = range.start;
        previous.end = Math.max(previous.end, range.end);
        previous.options.push(option);
      } else {
        groups.push({ key: option.startAt, day: option.day, start: range.start, lastStart: range.start, end: range.end, options: [option] });
      }
    }
    return groups;
  }

  function timelineExtent(slots, windows) {
    const times = [...slots.map((slot) => parseTimeRange(slot.time)),
      ...windows.map((w) => ({ start: w.start, end: w.end }))].filter(Boolean);
    return {
      start: Math.min(timelineStart, ...times.map((x) => Math.floor(x.start / 60) * 60)),
      end: Math.max(timelineEnd, ...times.map((x) => Math.ceil(x.end / 60) * 60)),
    };
  }

  function renderTimeline(slots, week) {
    const type = selectedType();
    currentWindows = groupAvailableWindows(currentData?.availability?.[type] || []);
    const extent = timelineExtent(slots, currentWindows);
    const span = extent.end - extent.start;
    const heightPx = Math.max(430, Math.round(430 * span / timelineMinutes));
    const marks = [];
    for (let m = extent.start; m <= extent.end; m += 60) marks.push(m);
    calendarEl.innerHTML = dayOrder.map((day, dayIndex) => {
      const daySlots = slots.filter((slot) => slot.day === day);
      const windows = currentWindows.filter((w) => w.day === day);
      const date = dateForDay(week, dayIndex);
      const guides = marks.map((minute) => {
        const top = ((minute - extent.start) / span) * 100;
        const label = `${Math.floor(minute / 60).toString().padStart(2, "0")}:00`;
        return `<span class="calendar-hour" style="top:${top}%">${esc(label)}</span>`;
      }).join("");
      const events = daySlots.map((slot) => {
        const range = parseTimeRange(slot.time);
        if (!range) return "";
        const top = ((Math.max(extent.start, range.start) - extent.start) / span) * 100;
        const bottom = Math.min(extent.end, range.end);
        if (bottom <= extent.start || top >= 100) return "";
        const blockHeight = ((bottom - Math.max(extent.start, range.start)) / span) * 100;
        const state = slot.kind === "full" ? "full" : "join";
        const occupancy = state === "join" && Number.isFinite(Number(slot.people)) && Number.isFinite(Number(slot.capacity))
          ? `${Number(slot.people)}/${Number(slot.capacity)} míst` : "Probíhá výuka";
        return `<article class="calendar-event ${state}" title="${esc(slot.title)} · ${esc(slot.time)}" style="top:${top}%;height:calc(${blockHeight}% - 3px)">
          <span class="calendar-event-time">${esc(slot.time)}</span><strong>${esc(shortTitle(slot.title))}</strong><small>${esc(occupancy)}</small>
        </article>`;
      }).join("");
      const bookable = windows.map((w) => {
        const top = ((w.start - extent.start) / span) * 100;
        const blockHeight = ((w.end - w.start) / span) * 100;
        const formatMinutes = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        const period = `${formatMinutes(w.start)}–${formatMinutes(w.end)}`;
        const index = currentWindows.indexOf(w);
        const isSelected = selectedWindowKey === w.key ? " is-selected" : "";
        return `<button type="button" class="calendar-window${isSelected}" data-book-window="${index}"
          aria-label="${esc(day)} ${esc(date)}, volný čas ${esc(period)}. Vybrat rezervaci."
          title="Rezervovat · ${esc(period)}" style="top:${top}%;height:calc(${blockHeight}% - 3px)">
          <span class="calendar-window-time">${esc(period)}</span><span class="calendar-window-label">Volno · vybrat →</span>
        </button>`;
      }).join("");
      return `<section class="calendar-day">
        <div class="calendar-day-head"><div class="calendar-day-title"><span class="calendar-day-abbr">${esc(dayAbbreviations[day])}</span><span class="calendar-day-name">${esc(day)} · ${esc(date)}</span></div><span class="calendar-day-count">${daySlots.length} ${lessonCountLabel(daySlots.length)}</span></div>
        <div class="calendar-time-track" aria-label="${esc(day)} ${esc(date)}" style="height:${heightPx}px">${guides}${events}${bookable}</div>
      </section>`;
    }).join("");
    calendarEl.dataset.live = "true";
  }

  function formatBookingOption(option) {
    const date = new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, weekday: "long", day: "numeric", month: "numeric" })
      .format(new Date(option.startAt));
    return `${date} · ${option.time}`;
  }

  function renderBookingOptions() {
    if (!timeSelect || !currentData) return;
    const current = currentWindows.find((w) => w.key === selectedWindowKey);
    if (!current) {
      if (selectedWindowKey && panel && !panel.classList.contains("is-complete")) {
        panel.hidden = true;
        if (actionStatus) actionStatus.textContent = "Vybraný termín už není volný. Vyberte prosím jiný zelený blok.";
      }
      selectedWindowKey = null;
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Klikněte na volné místo v kalendáři</option>';
      return;
    }
    const previous = timeSelect.value;
    timeSelect.innerHTML = current.options.map((option) =>
      `<option value="${esc(option.startAt)}">${esc(formatBookingOption(option))}</option>`
    ).join("");
    timeSelect.value = current.options.some((option) => option.startAt === previous) ? previous : current.options[0].startAt;
    timeSelect.disabled = false;
    if (selectedTitle) selectedTitle.textContent = selectedType() === "diagnostic_30"
      ? "30 minut zdarma · online" : "60 minut · 450 Kč · online";
    if (selectedMeta) selectedMeta.textContent = `${current.day} · ${current.options.length} ${current.options.length === 1 ? "dostupný začátek" : "možností začátku"}`;
  }

  function pickWindow(index) {
    const chosen = currentWindows[index];
    if (!chosen || !currentData || !panel) return;
    selectedWindowKey = chosen.key;
    panel.hidden = false;
    panel.classList.remove("is-complete");
    if (status) { status.textContent = ""; status.className = "form-status"; }
    if (actionStatus) actionStatus.textContent = "";
    renderBookingOptions();
    calendarEl.querySelectorAll(".calendar-window").forEach((button) =>
      button.classList.toggle("is-selected", button.dataset.bookWindow === String(index)));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
  }

  function renderWeekLabel(week) {
    if (!weekLabel || typeof week?.startDate !== "string" || typeof week?.endDate !== "string") return;
    const format = (value, includeYear) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, day: "numeric", month: "numeric", ...(includeYear ? { year: "numeric" } : {}) })
        .format(new Date(Date.UTC(year, month - 1, day, 12)));
    };
    weekLabel.textContent = `Následující týden · ${format(week.startDate, false)}–${format(week.endDate, true)}`;
  }

  function renderSummary(data) {
    if (!weekSummary) return;
    const choices = currentWindows.length;
    weekSummary.textContent = choices
      ? `${choices} ${choices === 1 ? "volný časový úsek" : "volných časových úseků"} · klikněte na zelený blok`
      : "Pro tento typ lekce aktuálně není volný termín";
  }

  function renderLiveStatus(isLive, syncedAt) {
    if (!liveStatus) return;
    const synced = typeof syncedAt === "string" ? new Date(syncedAt) : null;
    const hasTimestamp = synced && !Number.isNaN(synced.getTime());
    liveStatus.textContent = isLive && hasTimestamp
      ? `Kapacita aktualizována v ${new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(synced)}`
      : "Dostupnost nelze bezpečně ověřit";
    liveStatus.dataset.state = isLive && hasTimestamp ? "live" : "fallback";
  }

  function validPayload(data) {
    return data && Array.isArray(data.slots) && data.timeZone === PRAGUE_TIME_ZONE
      && Array.isArray(data.availability?.diagnostic_30) && Array.isArray(data.availability?.lesson_60)
      && data.slots.every((slot) => typeof slot.day === "string" && typeof slot.time === "string" && typeof slot.title === "string");
  }

  function refreshCapacity() {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = fetch(`${API_BASE}/api/public-capacity?ts=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((response) => { if (!response.ok) throw new Error("capacity-api"); return response.json(); })
      .then((data) => {
        if (!validPayload(data)) throw new Error("capacity-payload");
        currentData = data;
        renderTimeline(data.slots, data.week);
        renderWeekLabel(data.week);
        renderSummary(data);
        renderLiveStatus(true, data.calendarSyncedAt);
        renderBookingOptions();
        lastRefreshAt = Date.now();
      }).catch(() => {
        currentData = null;
        calendarEl.dataset.live = "false";
        calendarEl.innerHTML = '<p class="calendar-empty" role="status">Dostupnost nyní nelze ověřit. Rezervaci proto dočasně nepřijímám.</p>';
        currentWindows = [];
        selectedWindowKey = null;
        if (panel && !panel.classList.contains("is-complete")) panel.hidden = true;
        if (timeSelect) { timeSelect.innerHTML = '<option value="">Dostupnost nelze ověřit</option>'; timeSelect.disabled = true; }
        if (weekSummary) weekSummary.textContent = "Aktuální termíny se nepodařilo ověřit.";
        renderLiveStatus(false);
      }).finally(() => { refreshInFlight = null; });
    return refreshInFlight;
  }

  typeInputs.forEach((input) => input.addEventListener("change", () => {
    selectedWindowKey = null;
    if (panel) { panel.hidden = true; panel.classList.remove("is-complete"); }
    if (actionStatus) actionStatus.textContent = "";
    if (status) status.textContent = "";
    if (currentData) {
      renderTimeline(currentData.slots, currentData.week);
      renderSummary(currentData);
      renderBookingOptions();
    }
  }));
  calendarEl.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-book-window]") : null;
    if (button) pickWindow(Number(button.dataset.bookWindow));
  });
  dismiss?.addEventListener("click", () => {
    selectedWindowKey = null;
    panel.hidden = true;
    panel.classList.remove("is-complete");
    if (currentData) renderTimeline(currentData.slots, currentData.week);
    if (actionStatus) actionStatus.textContent = "";
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const original = button.textContent;
    const payload = {
      bookingType: selectedType(), startAt: formData.get("start_at"), name: formData.get("name"),
      email: formData.get("email"), grade: formData.get("grade"), topic: formData.get("topic"),
      note: formData.get("note"), website: formData.get("website"),
    };
    button.disabled = true;
    button.textContent = "Rezervuji…";
    status.textContent = "";
    status.className = "form-status";
    try {
      const response = await fetch(`${API_BASE}/api/public-bookings`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? "slot-unavailable" : "booking-failed");
      const when = new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, weekday: "long", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
        .format(new Date(result.booking.startAt));
      const management = result.bookingId && result.cancellationToken
        ? `<a class="booking-management-link" href="/sprava-rezervace/?id=${encodeURIComponent(result.bookingId)}&amp;token=${encodeURIComponent(result.cancellationToken)}" rel="nofollow">Zrušit rezervaci nejpozději 24 hodin předem →</a>`
        : "";
      status.innerHTML = `<strong>Termín je uložený a rezervovaný.</strong> ${esc(result.booking.label)} · ${esc(when)}. Kód: <strong>${esc(result.confirmationCode)}</strong>. ${management}<small>Odkaz na správu rezervace si uložte. O případné změně vás budu informovat e-mailem.</small>`;
      status.classList.add("success");
      form.reset();
      selectedWindowKey = null;
      panel?.classList.add("is-complete");
      if (selectedTitle) selectedTitle.textContent = "Rezervace je potvrzená";
      if (selectedMeta) selectedMeta.textContent = "Podrobnosti najdete ve svém e-mailu.";
      await refreshCapacity();
    } catch (error) {
      status.textContent = error instanceof Error && error.message === "slot-unavailable"
        ? "Tento čas mezitím obsadil někdo jiný. Nabídku jsem obnovil; vyberte prosím jiný termín."
        : "Rezervaci se nepodařilo bezpečně potvrdit. Zkuste to znovu nebo napište na info@vojtechsteidl.eu.";
      status.classList.add("error");
      await refreshCapacity();
    } finally { button.disabled = false; button.textContent = original; }
  });

  calendarEl.innerHTML = '<p class="calendar-empty" role="status">Dostupnost termínů ověřuji v Google Kalendáři…</p>';
  refreshCapacity();
  window.setInterval(refreshCapacity, refreshIntervalMs);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastRefreshAt >= refreshIntervalMs) refreshCapacity();
  });
})();
