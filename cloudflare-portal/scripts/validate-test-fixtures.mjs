import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const profile = JSON.parse(
  await readFile(join(appRoot, "fixtures", "vojta2.profile.json"), "utf8"),
);

if (profile.studentName !== "Vojta2") {
  throw new Error("Vojta2 fixture must use studentName=Vojta2.");
}
for (const key of ["lessons", "materials", "tasks", "timeline", "upcoming", "links"]) {
  if (!Array.isArray(profile[key])) {
    throw new Error(`Vojta2 fixture field ${key} must be an array.`);
  }
}

const sqlTemplate = await readFile(
  join(appRoot, "sql", "vojta2-test.sql.template"),
  "utf8",
);
if (!sqlTemplate.includes("__VOJTA2_EMAIL__")) {
  throw new Error("Vojta2 SQL template must keep the private email placeholder.");
}

const mapping = JSON.parse(
  await readFile(join(appRoot, "student-emails.example.json"), "utf8"),
);
const testEntry = mapping.students?.find((entry) => entry.id === "vojta2");
if (!testEntry) {
  throw new Error("student-emails.example.json must contain the Vojta2 test mapping.");
}
if (testEntry.email !== "replace-in-private-config@example.com") {
  throw new Error("Never commit the real Vojta2 test email; keep the documented placeholder.");
}
if (testEntry.source !== "cloudflare-portal/fixtures/vojta2.profile.json") {
  throw new Error("Vojta2 mapping must point to the controlled fixture profile.");
}

console.log("Vojta2 test fixture is valid and contains no private email mapping.");
