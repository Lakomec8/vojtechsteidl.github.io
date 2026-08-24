import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");

function patchFile(path, replacements) {
  let text = readFileSync(path, "utf8");
  for (const [search, replacement, label] of replacements) {
    if (!text.includes(search)) throw new Error(`Patch not found (${label}) in ${path}`);
    text = text.replace(search, replacement);
  }
  writeFileSync(path, text);
}

patchFile(resolve(repoRoot, "assets/student-portal.js"), [
  [
    '    const materials = Array.isArray(data.materials) ? data.materials : [];',
    `    const materials = (Array.isArray(data.materials) ? data.materials : [])\n      .slice()\n      .sort(\n        (first, second) =>\n          (parseDate(second.date)?.getTime() || 0) -\n          (parseDate(first.date)?.getTime() || 0),\n      );`,
    "sort material list by date",
  ],
]);

patchFile(resolve(appRoot, "src/entry.ts"), [
  [
    `function cleanPdfName(name: string): string {\n  const cleaned = name.normalize("NFKC").replace(/[\\\\/]+/g, "-").replace(/[\\u0000-\\u001f]/g, "").trim();\n  if (!cleaned || cleaned === "." || cleaned === "..") throw new PortalError(400, "Invalid filename.");\n  if (!cleaned.toLowerCase().endsWith(".pdf")) throw new PortalError(400, "Only PDF files are allowed.");\n  return cleaned.slice(0, 180);\n}`,
    `function cleanPdfName(name: string): string {\n  const cleaned = name.normalize("NFKC").replace(/[\\\\/]+/g, "-").replace(/[\\u0000-\\u001f]/g, "").trim();\n  if (!cleaned || cleaned === "." || cleaned === "..") throw new PortalError(400, "Invalid filename.");\n  if (!cleaned.toLowerCase().endsWith(".pdf")) throw new PortalError(400, "Only PDF files are allowed.");\n  return cleaned.slice(0, 180);\n}\n\nfunction portalToday(): string {\n  const parts = new Intl.DateTimeFormat("en-GB", {\n    timeZone: "Europe/Prague",\n    year: "numeric",\n    month: "2-digit",\n    day: "2-digit",\n  }).formatToParts(new Date());\n  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));\n  return \\`\\${value.year}-\\${value.month}-\\${value.day}\\`;\n}\n\nfunction materialDate(item: Record<string, unknown>): string {\n  const value = String(item?.date || "").trim();\n  return /^\\d{4}-\\d{2}-\\d{2}$/.test(value) ? value : "";\n}\n\nfunction normalizeMaterials(\n  materials: Array<Record<string, unknown>>,\n): Array<Record<string, unknown>> {\n  const sorted = materials\n    .map((material, index) => ({ material, index }))\n    .sort((first, second) => {\n      const byDate = materialDate(second.material).localeCompare(materialDate(first.material));\n      return byDate || first.index - second.index;\n    })\n    .map(({ material }) => material);\n\n  const transientBadges = new Set(["Aktuální PDF", "Aktuální materiál", "Nové PDF"]);\n  for (const material of sorted) {\n    if (transientBadges.has(String(material.badge || ""))) material.badge = "PDF";\n  }\n\n  const latest = sorted.find((material) => material?.url);\n  if (latest) {\n    const url = String(latest.url || "").toLowerCase();\n    latest.badge = url.includes(".pdf") ? "Aktuální PDF" : "Aktuální materiál";\n  }\n\n  return sorted;\n}`,
    "portal date and material normalization helpers",
  ],
  [
    '  const today = new Date().toISOString().slice(0, 10);',
    '  const today = portalToday();',
    "portal-local upload date",
  ],
  [
    `  for (const material of materials) {\n    if (material.badge === "Aktuální PDF") material.badge = "PDF";\n  }\n  if (existingIndex >= 0) materials.splice(existingIndex, 1);\n  profile.materials = [item, ...materials];\n  profile.incrementLessonCountOnMaterialAdd = true;\n\n  const externalLessons = Array.isArray(profile.externalLessons)\n    ? profile.externalLessons as Array<Record<string, unknown>>\n    : [];\n  const calendarAlreadyCounted = externalLessons.some(\n    (lesson) => lesson?.date === date && lesson?.counted === true,\n  );\n\n  if (isNew && !sameDateAlreadyExists && !calendarAlreadyCounted) {\n    const lessons = Array.isArray(profile.lessons) ? profile.lessons : [];\n    const current = Number(profile.completedLessonsCount ?? lessons.length);\n    profile.completedLessonsCount = Math.max(Number.isFinite(current) ? current : 0, lessons.length) + 1;\n  }`,
    `  if (existingIndex >= 0) materials.splice(existingIndex, 1);\n  profile.materials = normalizeMaterials([item, ...materials]);\n  profile.incrementLessonCountOnMaterialAdd = true;\n\n  const lessons = Array.isArray(profile.lessons) ? profile.lessons : [];\n  const detailedLessonAlreadyExists = lessons.some((lesson) => lesson?.date === date);\n  const externalLessons = Array.isArray(profile.externalLessons)\n    ? profile.externalLessons as Array<Record<string, unknown>>\n    : [];\n  const calendarAlreadyExists = externalLessons.some((lesson) => lesson?.date === date);\n\n  if (\n    isNew &&\n    !sameDateAlreadyExists &&\n    !detailedLessonAlreadyExists &&\n    !calendarAlreadyExists\n  ) {\n    const current = Number(profile.completedLessonsCount ?? lessons.length);\n    profile.completedLessonsCount = Math.max(Number.isFinite(current) ? current : 0, lessons.length) + 1;\n  }`,
    "deduplicate completed lesson count across all sources",
  ],
]);

patchFile(resolve(appRoot, "scripts/apply-profile-patch.mjs"), [
  [
    `  profile.externalLessons = externalLessons;\n\n  if (counted) {`,
    `  externalLessons.sort((first, second) =>\n    String(second?.date || "").localeCompare(String(first?.date || "")),\n  );\n  profile.externalLessons = externalLessons;\n\n  if (counted) {`,
    "sort calendar lessons by date",
  ],
]);

console.log("Applied chronology code fixes.");
