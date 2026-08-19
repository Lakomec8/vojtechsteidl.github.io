import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const mappingPath = join(appRoot, "student-emails.json");
const outputPath = join(appRoot, "seed.private.sql");

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

let mapping;
try {
  mapping = JSON.parse(await readFile(mappingPath, "utf8"));
} catch {
  throw new Error(
    "Create cloudflare-portal/student-emails.json from student-emails.example.json first.",
  );
}

if (!Array.isArray(mapping.students) || mapping.students.length === 0) {
  throw new Error("student-emails.json must contain a non-empty students array.");
}

const statements = ["BEGIN TRANSACTION;"];

for (const entry of mapping.students) {
  const { id, email, source, materialPath = id } = entry;
  if (!id || !email || !source) {
    throw new Error("Every student mapping needs id, email and source.");
  }

  const profilePath = resolve(repoRoot, source);
  if (!profilePath.startsWith(`${repoRoot}/`) && profilePath !== repoRoot) {
    throw new Error(`Refusing source outside repository: ${source}`);
  }

  const payloadText = await readFile(profilePath, "utf8");
  const payload = JSON.parse(payloadText);
  const displayName = payload.studentName || id;

  statements.push(
    `INSERT INTO students (id, email, display_name, material_path, enabled) VALUES (${sqlString(id)}, ${sqlString(email.trim().toLowerCase())}, ${sqlString(displayName)}, ${sqlString(materialPath)}, 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, material_path=excluded.material_path, enabled=1, updated_at=CURRENT_TIMESTAMP;`,
  );
  statements.push(
    `INSERT INTO student_profiles (student_id, payload_json) VALUES (${sqlString(id)}, ${sqlString(JSON.stringify(payload))}) ON CONFLICT(student_id) DO UPDATE SET payload_json=excluded.payload_json, updated_at=CURRENT_TIMESTAMP;`,
  );
}

statements.push("COMMIT;");
await writeFile(outputPath, `${statements.join("\n")}\n`, { mode: 0o600 });
console.log(`Wrote private D1 seed to ${outputPath}`);
