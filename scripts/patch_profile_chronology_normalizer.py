#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "cloudflare-portal/scripts/apply-profile-patch.mjs"
text = path.read_text(encoding="utf-8")

marker = '''function normalizedDate(value) {
  const date = String(value || "").trim();
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw new Error("lessonEvent.date must be YYYY-MM-DD");
  return date;
}

function applyLessonEvent'''

replacement = '''function normalizedDate(value) {
  const date = String(value || "").trim();
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw new Error("lessonEvent.date must be YYYY-MM-DD");
  return date;
}

function sortableDate(value) {
  const date = String(value || "").trim();
  return /^\\d{4}-\\d{2}-\\d{2}$/.test(date) ? date : "";
}

function normalizeProfileChronology(profile) {
  if (Array.isArray(profile.materials)) {
    profile.materials = profile.materials
      .map((material, index) => ({ material, index }))
      .sort((first, second) => {
        const byDate = sortableDate(second.material?.date).localeCompare(
          sortableDate(first.material?.date),
        );
        return byDate || first.index - second.index;
      })
      .map(({ material }) => material);

    const transientBadges = new Set(["Aktuální PDF", "Aktuální materiál", "Nové PDF"]);
    for (const material of profile.materials) {
      if (transientBadges.has(String(material?.badge || ""))) material.badge = "PDF";
    }

    const latest = profile.materials.find((material) => material?.url);
    if (latest) {
      const url = String(latest.url || "").toLowerCase();
      latest.badge = url.includes(".pdf") ? "Aktuální PDF" : "Aktuální materiál";
    }
  }

  if (Array.isArray(profile.externalLessons)) {
    profile.externalLessons.sort((first, second) =>
      sortableDate(second?.date).localeCompare(sortableDate(first?.date)),
    );
  }
}

function applyLessonEvent'''

if marker in text:
    text = text.replace(marker, replacement, 1)
elif replacement not in text:
    raise RuntimeError("Could not insert normalizeProfileChronology")

old = 'const payload = JSON.stringify(profile);'
new = 'normalizeProfileChronology(profile);\n\nconst payload = JSON.stringify(profile);'
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise RuntimeError("Could not call normalizeProfileChronology")

path.write_text(text, encoding="utf-8")
print("Patched D1 profile chronology normalizer.")
