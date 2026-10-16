import { nextWeekWindow, slotIsAvailable, busyMinutesOnDay, isCalendarSyncFresh } from "../src/public-capacity.ts";

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
console.log("Public capacity next-week, sync freshness, and busy-slot filtering are valid.");
