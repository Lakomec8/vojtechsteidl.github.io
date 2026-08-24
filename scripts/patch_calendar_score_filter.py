#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "assets/student-portal.js"
text = path.read_text(encoding="utf-8")
old = '''    // Historie používá jeden chronologický pohled napříč detailními hodinami,
    // kalendářem a materiály. Jedno datum = jedna absolvovaná hodina.
'''
new = '''    // Historie seskupuje pedagogické záznamy a materiály podle data pouze pro
    // zobrazení. Počet absolvovaných hodin se z historie nikdy neodvozuje.
'''
if old not in text:
    raise RuntimeError("history comment patch not found")
text = text.replace(old, new, 1)
old = '''    const scoredLessons = lessons.filter((lesson) =>
      Number.isFinite(Number(lesson.score)),
    );
'''
new = '''    const calendarLessonDateSet = new Set(
      externalLessons.map((lesson) => lesson?.date).filter(Boolean),
    );
    const scoredLessons = lessons.filter(
      (lesson) =>
        Number.isFinite(Number(lesson.score)) &&
        calendarLessonDateSet.has(lesson?.date),
    );
'''
if old not in text:
    raise RuntimeError("score filter patch not found")
text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")
print("Patched score filtering against calendar lessons.")
