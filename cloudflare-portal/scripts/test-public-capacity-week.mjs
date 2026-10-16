import { nextWeekWindow, slotIsAvailable, busyMinutesOnDay, isCalendarSyncFresh } from "../src/public-capacity.ts";
import { publicCategoryForCalendarTitle } from "../src/calendar-ingestion.ts";
import { readFileSync } from "node:fs";

const cases = [
  ["2026-10-16T12:00:00Z", "2026-10-19", "2026-10-23"],
  ["2026-10-19T08:00:00Z", "2026-10-26", "2026-10-30"],
  ["2026-10-25T23:30:00Z", "2026-11-02", "2026-11-06"],
];

for (const [now, expectedStart, expectedEnd] of cases) {
  const week = nextWeekWindow(new Date(now));
  if (week.startDate !== expectedStart || week.endDate !== expectedEnd) {
    throw new Error(JSON.stringify({ now, week, expectedStart, expectedEnd }));
  }
}

const availabilityCases = [
  ["15:15", "16:15", [], false, true],
  ["15:15", "16:15", [{ start: 15 * 60 + 30, end: 16 * 60 }], false, false],
  ["15:00", "19:00", [{ start: 16 * 60, end: 17 * 60 }], true, true],
  ["15:00", "19:00", [{ start: 15 * 60, end: 18 * 60 + 15 }], true, false],
];

for (const [start, end, occupied, flexible, expected] of availabilityCases) {
  const actual = slotIsAvailable(start, end, occupied, flexible);
  if (actual !== expected) {
    throw new Error(JSON.stringify({ start, end, occupied, flexible, expected, actual }));
  }
}

const now = new Date("2026-10-16T13:00:00Z");
for (const [value, expected] of [
  [null, false],
  ["2026-10-16T12:45:00Z", true],
  ["2026-10-16T11:00:00Z", false],
  ["2026-10-16T13:10:00Z", false],
]) {
  if (isCalendarSyncFresh(value, now) !== expected) throw new Error("Freshness check failed: " + value);
}
const overnight = { starts_at: "2026-10-19T22:00:00+02:00", ends_at: "2026-10-20T17:00:00+02:00" };
const nextDay = busyMinutesOnDay(overnight, "2026-10-20");
if (nextDay?.start !== 0 || nextDay?.end !== 1020) throw new Error("Overnight collision missed");
const classifications = [
  ["Kája - doučko", { label: "Matematika", capacity: 4 }],
  ["Fyzika Doučko", { label: "Fyzika", capacity: 4 }],
  ["Doučko - syn Veronika.", { label: "Matematika", capacity: 4 }],
  ["Zkušební hodina", { label: "Úvodní konzultace", capacity: 1 }],
  ["Eliška doučování", null],
  ["Soukromá událost", null],
];
for (const [title, expected] of classifications) {
  const actual = publicCategoryForCalendarTitle(title);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Public title classification failed for ${title}: ${JSON.stringify(actual)}`);
  }
}
// Seed the two existing one-off lesson IDs immediately, while the automatic
// registration handles newly added future tutoring lessons.
const migration = readFileSync(new URL("../migrations/0050_public_capacity_missing_lessons.sql", import.meta.url), "utf8");
for (const id of ["7feha3tiugdudsjdurtjlkkkks", "2b2suvsjh6e68sm04jh3ucavld"]) {
  if (!migration.includes(id)) throw new Error("Missing public mapping: " + id);
}
console.log("Public capacity week, collisions, tutoring mappings, and privacy tests are valid.");
