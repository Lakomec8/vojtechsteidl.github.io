(async function () {
  const nextDateElement = document.getElementById("nextDate");
  const nextCopyElement = document.getElementById("nextDateCopy");
  const app = document.getElementById("app");

  if (!nextDateElement || !nextCopyElement || !app) return;

  const waitForPortal = async () => {
    const deadline = Date.now() + 10000;
    while (app.hidden && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const lessonStart = (lesson) => {
    const raw = String(lesson?.start || "").trim();
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const date = String(lesson?.date || "").trim();
    const time = String(lesson?.startTime || "00:00").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
    const parsed = new Date(`${date}T${time}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const lessonEnd = (lesson) => {
    const raw = String(lesson?.end || "").trim();
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

  try {
    const response = await fetch("./api/profile", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("profile request failed");

    const profile = await response.json();
    const now = new Date();
    const lessons = (Array.isArray(profile.calendarUpcomingLessons)
      ? profile.calendarUpcomingLessons
      : [])
      .map((lesson) => ({ lesson, start: lessonStart(lesson) }))
      .filter(({ start }) => start && start.getTime() >= now.getTime())
      .sort((first, second) => first.start.getTime() - second.start.getTime());

    await waitForPortal();

    const next = lessons[0] || null;
    if (!next) {
      nextDateElement.textContent = "–";
      nextCopyElement.textContent = "–";
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
    nextCopyElement.textContent = "–";
    console.warn("Následující hodinu se nepodařilo načíst z kalendářních dat.", error);
  }
})();
