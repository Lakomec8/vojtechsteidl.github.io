import { nextWeekWindow, slotIsAvailable } from "../src/public-capacity.ts";

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

console.log("Public capacity next-week calculation and busy-slot filtering are valid.");
