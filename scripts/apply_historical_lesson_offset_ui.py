#!/usr/bin/env python3
from pathlib import Path

path = Path('assets/student-portal.js')
text = path.read_text(encoding='utf-8')
old = '''    // Jediný zdroj pravdy pro počet absolvovaných hodin je Google Calendar.\n    // Každá synchronizovaná proběhlá kalendářní událost = jedna absolvovaná hodina.\n    const completedLessonsCount = externalLessons.length;\n'''
new = '''    // Nové absolvované hodiny se počítají výhradně z Google Calendar.\n    // historicalLessonCountOffset slouží jen jako jednorázový historický základ\n    // pro studenty, jejichž starší lekce nechceme zpětně doplňovat do kalendáře.\n    const historicalLessonCountOffsetRaw = Number(data.historicalLessonCountOffset);\n    const historicalLessonCountOffset = Number.isFinite(historicalLessonCountOffsetRaw)\n      ? Math.max(0, Math.round(historicalLessonCountOffsetRaw))\n      : 0;\n    const completedLessonsCount = historicalLessonCountOffset + externalLessons.length;\n'''
if old not in text:
    raise SystemExit('Target snippet not found in assets/student-portal.js')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
