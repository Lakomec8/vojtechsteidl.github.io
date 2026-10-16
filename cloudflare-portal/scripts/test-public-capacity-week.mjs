import { nextWeekWindow } from "../src/public-capacity.ts";

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

console.log("Public capacity next-week calculation is valid.");
