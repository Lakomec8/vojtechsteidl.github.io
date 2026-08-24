#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def patch(path: Path, replacements: list[tuple[str, str, str]]) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new, label in replacements:
        if old not in text:
            if new in text:
                continue
            raise RuntimeError(f"Patch not found ({label}) in {path}")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")


patch(
    ROOT / "assets/student-portal.js",
    [
        (
            '    const materials = Array.isArray(data.materials) ? data.materials : [];',
            '''    const materials = (Array.isArray(data.materials) ? data.materials : [])
      .slice()
      .sort(
        (first, second) =>
          (parseDate(second.date)?.getTime() || 0) -
          (parseDate(first.date)?.getTime() || 0),
      );''',
            "sort material list by date",
        ),
    ],
)

entry = ROOT / "cloudflare-portal/src/entry.ts"
helpers = r'''  return cleaned.slice(0, 180);
}

function portalToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function materialDate(item: Record<string, unknown>): string {
  const value = String(item?.date || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeMaterials(
  materials: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const sorted = materials
    .map((material, index) => ({ material, index }))
    .sort((first, second) => {
      const byDate = materialDate(second.material).localeCompare(materialDate(first.material));
      return byDate || first.index - second.index;
    })
    .map(({ material }) => material);

  const transientBadges = new Set(["Aktuální PDF", "Aktuální materiál", "Nové PDF"]);
  for (const material of sorted) {
    if (transientBadges.has(String(material.badge || ""))) material.badge = "PDF";
  }

  const latest = sorted.find((material) => material?.url);
  if (latest) {
    const url = String(latest.url || "").toLowerCase();
    latest.badge = url.includes(".pdf") ? "Aktuální PDF" : "Aktuální materiál";
  }

  return sorted;
}

async function profileRow'''
patch(
    entry,
    [
        (
            '''  return cleaned.slice(0, 180);
}

async function profileRow''',
            helpers,
            "portal date and material normalization helpers",
        ),
        (
            '  const today = new Date().toISOString().slice(0, 10);',
            '  const today = portalToday();',
            "portal-local upload date",
        ),
        (
            '''  for (const material of materials) {
    if (material.badge === "Aktuální PDF") material.badge = "PDF";
  }
  if (existingIndex >= 0) materials.splice(existingIndex, 1);
  profile.materials = [item, ...materials];
  profile.incrementLessonCountOnMaterialAdd = true;

  const externalLessons = Array.isArray(profile.externalLessons)
    ? profile.externalLessons as Array<Record<string, unknown>>
    : [];
  const calendarAlreadyCounted = externalLessons.some(
    (lesson) => lesson?.date === date && lesson?.counted === true,
  );

  if (isNew && !sameDateAlreadyExists && !calendarAlreadyCounted) {
    const lessons = Array.isArray(profile.lessons) ? profile.lessons : [];
    const current = Number(profile.completedLessonsCount ?? lessons.length);
    profile.completedLessonsCount = Math.max(Number.isFinite(current) ? current : 0, lessons.length) + 1;
  }''',
            '''  if (existingIndex >= 0) materials.splice(existingIndex, 1);
  profile.materials = normalizeMaterials([item, ...materials]);
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
  }''',
            "deduplicate completed lesson count across all sources",
        ),
    ],
)

patch(
    ROOT / "cloudflare-portal/scripts/apply-profile-patch.mjs",
    [
        (
            '''  profile.externalLessons = externalLessons;

  if (counted) {''',
            '''  externalLessons.sort((first, second) =>
    String(second?.date || "").localeCompare(String(first?.date || "")),
  );
  profile.externalLessons = externalLessons;

  if (counted) {''',
            "sort calendar lessons by date",
        ),
    ],
)

print("Applied chronology code fixes.")
