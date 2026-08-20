import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const outputPath = join(appRoot, "profile-seed.sql");

const profiles = [
  { id: "vojta", source: "students/vojta.json" },
  { id: "natalie", source: "students/natalie.json" },
];

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = ["BEGIN TRANSACTION;"];

for (const profile of profiles) {
  const sourcePath = resolve(repoRoot, profile.source);
  const raw = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw);
  const compactJson = JSON.stringify(parsed);

  statements.push(
    `INSERT INTO student_profiles (student_id, payload_json) VALUES (${sqlString(profile.id)}, ${sqlString(compactJson)}) ON CONFLICT(student_id) DO UPDATE SET payload_json=excluded.payload_json, updated_at=CURRENT_TIMESTAMP;`,
  );
}

statements.push("COMMIT;");
await writeFile(outputPath, `${statements.join("\n")}\n`, { mode: 0o600 });
console.log(`Prepared D1 profile seed for ${profiles.length} students.`);
