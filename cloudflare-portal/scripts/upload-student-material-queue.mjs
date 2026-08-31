import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function run(args, options = {}) {
  return execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", args, {
    cwd: appRoot,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
}

function runD1(sql) {
  return JSON.parse(run(["wrangler", "d1", "execute", "DB", "--remote", "--json", "--command", sql]));
}

function rows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) return batch.results;
    if (Array.isArray(batch?.result?.results)) return batch.result.results;
    if (Array.isArray(batch?.result)) {
      for (const nested of batch.result) if (Array.isArray(nested?.results)) return nested.results;
    }
  }
  return [];
}

function sourceList(item) {
  if (Array.isArray(item.sources) && item.sources.length) {
    return item.sources.map((value) => String(value || "").trim()).filter(Boolean);
  }
  const single = String(item.source || "").trim();
  return single ? [single] : [];
}

if (process.argv.length !== 3) fail("Usage: node scripts/upload-student-material-queue.mjs <META.json>");
for (const required of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
  if (!process.env[required]) fail(`Missing required environment variable: ${required}`);
}

const metaPath = resolve(process.cwd(), process.argv[2]);
const queueDir = dirname(metaPath);
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
const displayName = String(meta.displayName || "").trim();
if (!displayName) fail("displayName is required");
if (!Array.isArray(meta.files) || !meta.files.length) fail("files[] is required");

const student = rows(runD1(
  `SELECT id, display_name, material_path FROM students WHERE display_name = ${sqlString(displayName)} COLLATE NOCASE AND enabled = 1 LIMIT 1;`,
))[0];
if (!student?.id || !student?.material_path) fail(`Student not found: ${displayName}`);

const tempDir = mkdtempSync(join(tmpdir(), "student-material-upload-"));
const patch = { studentId: student.id, prepend: [] };
const uploadedKeys = [];

try {
  for (const item of meta.files) {
    const sources = sourceList(item);
    const fileName = String(item.fileName || "").trim();
    const title = String(item.title || "").trim();
    const date = String(item.date || "").trim();
    if (!sources.length || !fileName || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("Invalid file metadata");
    if (!fileName.toLowerCase().endsWith(".pdf") || /[\\/]/.test(fileName)) fail(`Invalid PDF filename: ${fileName}`);

    const b64 = sources
      .map((source) => readFileSync(resolve(queueDir, source), "utf8"))
      .join("")
      .replace(/\s+/g, "");
    const bytes = Buffer.from(b64, "base64");
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") fail(`Decoded file is not a PDF: ${fileName}`);

    const localPath = join(tempDir, fileName);
    writeFileSync(localPath, bytes);
    const key = `${student.material_path}/${fileName}`;
    run(["wrangler", "r2", "object", "put", `vojtechsteidl-student-materials/${key}`, `--file=${localPath}`, "--content-type=application/pdf", "--remote"]);
    uploadedKeys.push(key);

    patch.prepend.push({
      path: "/materials",
      value: {
        title,
        meta: `PDF • ${date}`,
        badge: "PDF",
        badgeClass: "pdf",
        url: `/student-portal/Materials/${encodeURIComponent(student.material_path)}/${encodeURIComponent(fileName)}`,
        date,
        source: "r2-queued-upload",
        r2Key: key,
      },
    });
  }

  const patchPath = join(tempDir, "patch.json");
  writeFileSync(patchPath, JSON.stringify(patch, null, 2));
  execFileSync(process.execPath, [resolve(appRoot, "scripts/apply-profile-patch.mjs"), patchPath], {
    cwd: appRoot,
    env: process.env,
    stdio: "inherit",
  });
  console.log(`Uploaded ${meta.files.length} material(s) for ${student.display_name} (${student.id}).`);
} catch (error) {
  console.error("Upload failed; uploaded R2 objects may require manual cleanup:", uploadedKeys);
  throw error;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
