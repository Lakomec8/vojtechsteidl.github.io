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
  const typeInputs = form ? Array.from(form.querySelectorAll('input[name="booking_type"]')) : [];
  const timeSelect = document.getElementById("bookingStartAt");
  const typeSummary = document.getElementById("bookingTypeSummary");
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

  function renderTimeline(slots, week) {
    const hourMarks = [];
    for (let minute = timelineStart; minute <= timelineEnd; minute += 60) hourMarks.push(minute);
    calendarEl.innerHTML = dayOrder.map((day, dayIndex) => {
      const daySlots = slots.filter((slot) => slot.day === day);
      const date = dateForDay(week, dayIndex);
      const marks = hourMarks.map((minute) => {
        const top = ((minute - timelineStart) / timelineMinutes) * 100;
        const label = `${Math.floor(minute / 60).toString().padStart(2, "0")}:00`;
        return `<span class="calendar-hour" style="top:${top}%">${esc(label)}</span>`;
      }).join("");
      const events = daySlots.map((slot) => {
        const range = parseTimeRange(slot.time);
        if (!range) return "";
        const start = Math.max(timelineStart, range.start);
        const end = Math.min(timelineEnd, range.end);
        if (end <= start) return "";
        const top = ((start - timelineStart) / timelineMinutes) * 100;
        const height = ((end - start) / timelineMinutes) * 100;
        const state = slot.kind === "full" ? "full" : "join";
        const occupancy = state === "join" ? `${Number(slot.people)}/${Number(slot.capacity)} míst` : "obsazeno";
        return `<article class="calendar-event ${state}" style="top:${top}%;height:calc(${height}% - 3px)">
          <span class="calendar-event-time">${esc(slot.time)}</span><strong>${esc(slot.title)}</strong><small>${esc(occupancy)}</small>
        </article>`;
      }).join("");
      return `<section class="calendar-day">
        <div class="calendar-day-head"><div class="calendar-day-title"><span class="calendar-day-abbr">${esc(dayAbbreviations[day])}</span> <span class="calendar-day-name">${esc(day)} · ${esc(date)}</span></div><span class="calendar-day-count">${daySlots.length} ${lessonCountLabel(daySlots.length)}</span></div>
        <div class="calendar-time-track" aria-label="${esc(day)} ${esc(date)}">${marks}${events}</div>
      </section>`;
    }).join("");
    calendarEl.dataset.live = "true";
  }

  const selectedType = () => typeInputs.find((input) => input.checked)?.value || "diagnostic_30";

  function formatBookingOption(option) {
    const date = new Intl.DateTimeFormat("cs-CZ", { timeZone: PRAGUE_TIME_ZONE, weekday: "long", day: "numeric", month: "numeric" })
      .format(new Date(option.startAt));
    return `${date} · ${option.time}`;
  }

  function renderBookingOptions() {
    if (!timeSelect || !currentData) return;
    const type = selectedType();
    const options = currentData.availability?.[type] || [];
    const previous = timeSelect.value;
    timeSelect.innerHTML = `<option value="">${options.length ? "Vyberte volný čas" : "Pro tento typ teď není volný čas"}</option>` + options.map((option) =>
      `<option value="${esc(option.startAt)}">${esc(formatBookingOption(option))}</option>`
    ).join("");
    if (options.some((option) => option.startAt === previous)) timeSelect.value = previous;
    timeSelect.disabled = options.length === 0;
    if (typeSummary) {
      const configuration = currentData.bookingTypes?.[type];
      typeSummary.textContent = configuration ? `${configuration.duration} minut · ${configuration.price} · online` : "";
    }
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
    const diagnostic = data.availability?.diagnostic_30?.length || 0;
    const lesson = data.availability?.lesson_60?.length || 0;
    weekSummary.textContent = `${diagnostic} možností pro 30 minut zdarma · ${lesson} možností pro 60minutovou lekci`;
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
        if (timeSelect) { timeSelect.innerHTML = '<option value="">Dostupnost nelze ověřit</option>'; timeSelect.disabled = true; }
        if (weekSummary) weekSummary.textContent = "Aktuální termíny se nepodařilo ověřit.";
        renderLiveStatus(false);
      }).finally(() => { refreshInFlight = null; });
    return refreshInFlight;
  }

  typeInputs.forEach((input) => input.addEventListener("change", renderBookingOptions));
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
      if (typeInputs[0]) typeInputs[0].checked = true;
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
