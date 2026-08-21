import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runD1(sql) {
  const stdout = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "d1", "execute", "DB", "--remote", "--json", "--command", sql],
    {
      cwd: appRoot,
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout);
}

function resultRows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) return batch.results;
    if (Array.isArray(batch?.result?.results)) return batch.result.results;
    if (Array.isArray(batch?.result)) {
      for (const nested of batch.result) {
        if (Array.isArray(nested?.results)) return nested.results;
      }
    }
  }
  return [];
}

function decodePointerToken(token) {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function pointerParts(pointer) {
  return pointer
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map(decodePointerToken);
}

function getTarget(root, pointer) {
  if (!pointer || pointer === "/") return root;
  let current = root;
  for (const token of pointerParts(pointer)) {
    current = Array.isArray(current) ? current[Number(token)] : current[token];
  }
  return current;
}

function setValue(root, pointer, value) {
  const parts = pointerParts(pointer);
  if (!parts.length) throw new Error("Root replacement is not supported");
  let parent = root;
  for (const token of parts.slice(0, -1)) {
    parent = Array.isArray(parent) ? parent[Number(token)] : parent[token];
  }
  const last = parts.at(-1);
  if (Array.isArray(parent)) parent[Number(last)] = value;
  else parent[last] = value;
}

if (process.argv.length !== 3) {
  fail("Usage: node scripts/apply-profile-patch.mjs <patch.json>");
}

for (const required of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
  if (!process.env[required]) fail(`Missing required environment variable: ${required}`);
}

const patchPath = resolve(process.cwd(), process.argv[2]);
const patch = JSON.parse(readFileSync(patchPath, "utf8"));
const studentId = String(patch.studentId || "").trim();
if (!/^[A-Za-z0-9._-]+$/.test(studentId)) fail("Invalid studentId");

const select = runD1(
  `SELECT payload_json FROM student_profiles WHERE student_id = ${sqlString(studentId)} LIMIT 1;`,
);
const row = resultRows(select)[0];
if (!row?.payload_json) fail(`D1 profile not found for student: ${studentId}`);

const profile = JSON.parse(row.payload_json);

for (const [pointer, value] of Object.entries(patch.set || {})) {
  setValue(profile, pointer, value);
}

for (const operation of patch.prepend || []) {
  const target = getTarget(profile, operation.path);
  if (!Array.isArray(target)) {
    throw new TypeError(`Prepend target is not a list: ${operation.path}`);
  }
  if (!target.some((item) => JSON.stringify(item) === JSON.stringify(operation.value))) {
    target.unshift(operation.value);
  }
}

const payload = JSON.stringify(profile);
runD1(
  `UPDATE student_profiles\n` +
    `SET payload_json = json(${sqlString(payload)}), updated_at = CURRENT_TIMESTAMP\n` +
    `WHERE student_id = ${sqlString(studentId)};`,
);

const verify = runD1(
  `SELECT student_id, json_extract(payload_json, '$.studentName') AS student_name, updated_at ` +
    `FROM student_profiles WHERE student_id = ${sqlString(studentId)} LIMIT 1;`,
);
const verified = resultRows(verify)[0];
if (!verified?.student_id) fail(`D1 verification failed for student: ${studentId}`);

console.log(`Updated D1 profile for ${studentId} (${verified.student_name || "profile"}).`);
