(async function () {
  const nextDateElement = document.getElementById("nextDate");
  const nextCopyElement = document.getElementById("nextDateCopy");
  const app = document.getElementById("app");

  if (!nextDateElement || !nextCopyElement || !app) return;

  // Streamline the dashboard: keep only completed lessons, latest self-check
  // and the next lesson. The previous subjective/derived metrics remain in the
  // DOM for backwards compatibility but are not shown.
  ["overallScore", "activeCount"].forEach((id) => {
    const element = document.getElementById(id);
    const metric = element?.closest?.(".metric");
    if (metric) metric.hidden = true;
  });

  const waitForPortal = async () => {
    const deadline = Date.now() + 10000;
    while (app.hidden && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const lessonStart = (lesson) => {
    const raw = String(
      lesson?.start || lesson?.startsAt || lesson?.starts_at || "",
    ).trim();
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const date = String(lesson?.date || "").trim();
    const time = String(
      lesson?.startTime || lesson?.time || lesson?.start_time || "00:00",
    ).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
    const parsed = new Date(`${date}T${time}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const lessonEnd = (lesson) => {
    const raw = String(
      lesson?.end || lesson?.endsAt || lesson?.ends_at || "",
    ).trim();
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const formatDate = (date) =>
    new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "numeric",
      timeZone: "Europe/Prague",
    }).format(date);

  const formatTime = (date) =>
    new Intl.DateTimeFormat("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Prague",
    }).format(date);

  const renderSelfCheckFocus = (profile) => {
    const label = document.getElementById("readinessLabel");
    const value = document.getElementById("readinessValue");
    const fill = document.getElementById("readinessFill");
    const copy = document.getElementById("readinessCopy");
    if (!label || !value || !fill || !copy) return;

    const latest = profile?.selfCheckSummary?.latest || null;
    label.textContent = "Poslední self-check";

    if (!latest) {
      value.textContent = "–";
      fill.style.width = "0%";
      copy.textContent = "Zatím bez dokončeného testu";
      return;
    }

    const percent = Number(latest.percent);
    const safePercent = Number.isFinite(percent)
      ? Math.max(0, Math.min(100, Math.round(percent)))
      : 0;
    value.textContent = `${safePercent} %`;
    fill.style.width = `${safePercent}%`;
    copy.textContent = `${latest.score}/${latest.maxScore} bodů · ${latest.title}`;
  };

  try {
    const response = await fetch("./api/profile", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!response.ok) throw new Error("profile request failed");

    const profile = await response.json();
    const now = new Date();

    // Calendar-backed lessons are authoritative. `upcoming` is a safe fallback
    // for older/static profiles while all students transition to the D1 feed.
    const candidates = [
      ...(Array.isArray(profile.calendarUpcomingLessons)
        ? profile.calendarUpcomingLessons
        : []),
      ...(Array.isArray(profile.upcoming) ? profile.upcoming : []),
    ];

    const lessons = candidates
      .map((lesson) => ({ lesson, start: lessonStart(lesson) }))
      .filter(({ start }) => start && start.getTime() >= now.getTime())
      .sort((first, second) => first.start.getTime() - second.start.getTime());

    await waitForPortal();
    renderSelfCheckFocus(profile);

    const next = lessons[0] || null;
    if (!next) {
      nextDateElement.textContent = "–";
      nextCopyElement.textContent = "Další termín zatím není evidovaný";
      return;
    }

    const end = lessonEnd(next.lesson);
    nextDateElement.textContent = formatDate(next.start);
    nextCopyElement.textContent = end
      ? `${formatTime(next.start)}–${formatTime(end)}`
      : formatTime(next.start);
  } catch (error) {
    await waitForPortal();
    nextDateElement.textContent = "–";
    nextCopyElement.textContent = "Další termín se nepodařilo načíst";
    console.warn("Následující hodinu se nepodařilo načíst z kalendářních dat.", error);
  }
})();
