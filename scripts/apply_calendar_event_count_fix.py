#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path, old, new, label):
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"Patch not found: {label} in {path}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

portal = ROOT / "assets/student-portal.js"
replace_once(
    portal,
    '''    // Jediný zdroj pravdy pro počet absolvovaných hodin je Google Calendar.
    const calendarLessonDates = new Set(
      externalLessons.map((lesson) => lesson?.date).filter(Boolean),
    );
    const completedLessonsCount = calendarLessonDates.size;
''',
    '''    // Jediný zdroj pravdy pro počet absolvovaných hodin je Google Calendar.
    // Každá synchronizovaná proběhlá kalendářní událost = jedna absolvovaná hodina.
    const completedLessonsCount = externalLessons.length;
''',
    "UI event count",
)

entry = ROOT / "cloudflare-portal/src/entry.ts"
replace_once(
    entry,
    '''  profile.completedLessonsCount = new Set(
    externalLessons.map((lesson) => String(lesson?.date || "")).filter(Boolean),
  ).size;
''',
    '''  profile.completedLessonsCount = externalLessons.length;
''',
    "upload stored event count",
)

patcher = ROOT / "cloudflare-portal/scripts/apply-profile-patch.mjs"
replace_once(
    patcher,
    '''    profile.completedLessonsCount = new Set(
      profile.externalLessons.map((lesson) => sortableDate(lesson?.date)).filter(Boolean),
    ).size;
''',
    '''    profile.completedLessonsCount = profile.externalLessons.length;
''',
    "normalizer event count",
)
replace_once(
    patcher,
    '''  const sameDayExternal = externalLessons.filter((item) => item?.date === date);
  if (sameDayExternal.length > 0) {
    throw new Error(
      `Another external lesson already exists for ${date}; refusing an ambiguous automatic count update.`,
    );
  }

''',
    '''''',
    "allow multiple lessons same day",
)
replace_once(
    patcher,
    '''  profile.completedLessonsCount = new Set(
    externalLessons.map((lesson) => sortableDate(lesson?.date)).filter(Boolean),
  ).size;
''',
    '''  profile.completedLessonsCount = externalLessons.length;
''',
    "calendar sync event count",
)

audit = ROOT / "cloudflare-portal/scripts/audit-student-portal.mjs"
replace_once(
    audit,
    '''  const calendarDates = new Set(externalLessons.map(dateOf).filter(Boolean));
  const expectedCompleted = calendarDates.size;
''',
    '''  const expectedCompleted = externalLessons.length;
''',
    "audit event count",
)

print("Applied calendar-event lesson count fix.")
