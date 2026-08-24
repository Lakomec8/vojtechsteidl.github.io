#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
portal = ROOT / "assets/student-portal.js"
text = portal.read_text(encoding="utf-8")

marker = '''    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];'''
replacement = '''    const externalLessons = (Array.isArray(data.externalLessons) ? data.externalLessons : [])
      .slice()
      .sort(
        (first, second) =>
          (parseDate(second.date)?.getTime() || 0) -
          (parseDate(first.date)?.getTime() || 0),
      );

    // Historie používá jeden chronologický pohled napříč detailními hodinami,
    // kalendářem a materiály. Jedno datum = jedna absolvovaná hodina.
    const historyByDate = new Map();
    for (const lesson of lessons) {
      if (lesson?.date) historyByDate.set(lesson.date, { ...lesson });
    }
    for (const externalLesson of externalLessons) {
      const date = externalLesson?.date;
      if (!date || historyByDate.has(date)) continue;
      const duration = Number(externalLesson.durationHours);
      historyByDate.set(date, {
        date,
        title: "Doučování",
        subject: "",
        summary: Number.isFinite(duration) ? `${duration} h doučování` : "Proběhlá lekce",
        topics: [],
      });
    }
    for (const material of materials) {
      const date = material?.date;
      if (!date) continue;
      const existing = historyByDate.get(date);
      if (existing) {
        if (!existing.material?.url && material?.url) existing.material = material;
        if (existing.title === "Doučování" && material?.title) existing.title = material.title;
        continue;
      }
      historyByDate.set(date, {
        date,
        title: material.title || "Výuková hodina",
        subject: "",
        summary: "Materiál přidaný k hodině.",
        topics: [],
        material,
      });
    }
    const historyEntries = [...historyByDate.values()].sort(
      (first, second) =>
        (parseDate(second.date)?.getTime() || 0) -
        (parseDate(first.date)?.getTime() || 0),
    );
    const unrepresentedHistoryCount = Math.max(
      0,
      completedLessonsCount - historyEntries.length,
    );

    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];'''
if marker in text:
    text = text.replace(marker, replacement, 1)
elif replacement not in text:
    raise RuntimeError("Could not insert unified lesson history")

old = '''    const lastLesson = lessons[0] || null;
    $("lastLessonDate").textContent = lastLesson
      ? `Poslední: ${lastLesson.displayDate || formatShortDate(lastLesson.date)}`
      : "Zatím bez záznamu";'''
new = '''    const lastLesson = historyEntries[0] || null;
    $("lastLessonDate").textContent = lastLesson
      ? `Poslední hodina: ${lastLesson.displayDate || formatShortDate(lastLesson.date)}`
      : "Zatím bez záznamu";'''
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise RuntimeError("Could not switch last lesson to unified history")

old = '''    $("historyList").innerHTML = lessons.length
      ? lessons.map(renderLesson).join("")
      : emptyState("Zatím tu není žádná absolvovaná hodina.");'''
new = '''    $("historyList").innerHTML = historyEntries.length || unrepresentedHistoryCount
      ? `${historyEntries.map(renderLesson).join("")}${
          unrepresentedHistoryCount
            ? emptyState(
                `${unrepresentedHistoryCount} dříve absolvovaná hodina je zahrnutá v celkovém počtu, ale nemá dochovaný detailní záznam.`,
              )
            : ""
        }`
      : emptyState("Zatím tu není žádná absolvovaná hodina.");'''
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise RuntimeError("Could not render unified lesson history")

portal.write_text(text, encoding="utf-8")

featured = ROOT / "assets/student-dashboard-featured.js"
text = featured.read_text(encoding="utf-8")
old = '''      const lastLessonDate = document.getElementById("lastLessonDate");
      if (lastLessonDate) {
        const displayDate = formatShortDate(material.date);
        lastLessonDate.textContent = displayDate
          ? `Poslední materiál: ${displayDate}`
          : "Poslední materiál je aktuální";
      }

'''
if old in text:
    text = text.replace(old, "", 1)
featured.write_text(text, encoding="utf-8")

print("Patched unified lesson history and dashboard date semantics.")
