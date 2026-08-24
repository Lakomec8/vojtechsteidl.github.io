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
    '''    const completedLessonsCount = Number.isFinite(Number(data.completedLessonsCount))
      ? Math.max(0, Math.round(Number(data.completedLessonsCount)))
      : lessons.length;
''',
    '''''',
    "remove stored lesson count",
)
replace_once(
    portal,
    '''    const externalLessons = (Array.isArray(data.externalLessons) ? data.externalLessons : [])
      .slice()
      .sort(
        (first, second) =>
          (parseDate(second.date)?.getTime() || 0) -
          (parseDate(first.date)?.getTime() || 0),
      );
''',
    '''    const externalLessons = (Array.isArray(data.externalLessons) ? data.externalLessons : [])
      .slice()
      .sort(
        (first, second) =>
          (parseDate(second.date)?.getTime() || 0) -
          (parseDate(first.date)?.getTime() || 0),
      );
    // Jediný zdroj pravdy pro počet absolvovaných hodin je Google Calendar.
    const calendarLessonDates = new Set(
      externalLessons.map((lesson) => lesson?.date).filter(Boolean),
    );
    const completedLessonsCount = calendarLessonDates.size;
''',
    "calendar-only UI count",
)
replace_once(
    portal,
    '''    const lastLesson = historyEntries[0] || null;
''',
    '''    const lastLesson = externalLessons[0] || null;
''',
    "last lesson date from calendar",
)

entry = ROOT / "cloudflare-portal/src/entry.ts"
replace_once(
    entry,
    '''  profile.materials = normalizeMaterials([item, ...materials]);
  profile.incrementLessonCountOnMaterialAdd = true;

  const lessons = Array.isArray(profile.lessons) ? profile.lessons : [];
  const detailedLessonAlreadyExists = lessons.some((lesson) => lesson?.date === date);
  const externalLessons = Array.isArray(profile.externalLessons)
    ? profile.externalLessons as Array<Record<string, unknown>>
    : [];
  const calendarAlreadyExists = externalLessons.some((lesson) => lesson?.date === date);

  if (
    isNew &&
    !sameDateAlreadyExists &&
    !detailedLessonAlreadyExists &&
    !calendarAlreadyExists
  ) {
    const current = Number(profile.completedLessonsCount ?? lessons.length);
    profile.completedLessonsCount = Math.max(Number.isFinite(current) ? current : 0, lessons.length) + 1;
  }
''',
    '''  profile.materials = normalizeMaterials([item, ...materials]);
  profile.incrementLessonCountOnMaterialAdd = false;

  // PDF upload nikdy nemění počet absolvovaných hodin. Ten je odvozen pouze
  // z lekcí synchronizovaných z Google Calendar.
  const externalLessons = Array.isArray(profile.externalLessons)
    ? profile.externalLessons as Array<Record<string, unknown>>
    : [];
  profile.completedLessonsCount = new Set(
    externalLessons.map((lesson) => String(lesson?.date || "")).filter(Boolean),
  ).size;
''',
    "material upload must not count lesson",
)

patcher = ROOT / "cloudflare-portal/scripts/apply-profile-patch.mjs"
replace_once(
    patcher,
    '''  if (Array.isArray(profile.externalLessons)) {
    profile.externalLessons.sort((first, second) =>
      sortableDate(second?.date).localeCompare(sortableDate(first?.date)),
    );
  }
}
''',
    '''  if (Array.isArray(profile.externalLessons)) {
    profile.externalLessons.sort((first, second) =>
      sortableDate(second?.date).localeCompare(sortableDate(first?.date)),
    );
    profile.completedLessonsCount = new Set(
      profile.externalLessons.map((lesson) => sortableDate(lesson?.date)).filter(Boolean),
    ).size;
  } else {
    profile.completedLessonsCount = 0;
  }
  profile.incrementLessonCountOnMaterialAdd = false;
}
''',
    "normalize stored count from calendar",
)
replace_once(
    patcher,
    '''  const materials = Array.isArray(profile.materials) ? profile.materials : [];
  const lessons = Array.isArray(profile.lessons) ? profile.lessons : [];
  const representedByMaterial = materials.some((item) => item?.date === date);
  const representedByDetailedLesson = lessons.some((item) => item?.date === date);
  const counted = !representedByMaterial && !representedByDetailedLesson;

  externalLessons.unshift({
    id: key,
    date,
    source: "google-calendar",
    durationHours,
    counted,
  });
''',
    '''  externalLessons.unshift({
    id: key,
    date,
    source: "google-calendar",
    durationHours,
    counted: true,
  });
''',
    "calendar events always count",
)
replace_once(
    patcher,
    '''  if (counted) {
    const current = Number(profile.completedLessonsCount ?? lessons.length);
    profile.completedLessonsCount = Math.max(Number.isFinite(current) ? current : 0, lessons.length) + 1;
  }

''',
    '''  profile.completedLessonsCount = new Set(
    externalLessons.map((lesson) => sortableDate(lesson?.date)).filter(Boolean),
  ).size;

''',
    "recompute count after calendar sync",
)

print("Applied calendar-only lesson count fix.")
