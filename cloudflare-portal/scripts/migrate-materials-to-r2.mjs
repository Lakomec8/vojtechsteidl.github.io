import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const materialsRoot = resolve(repoRoot, "Materials");
const bucket = process.env.R2_BUCKET || "vojtechsteidl-student-materials";

for (const required of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
  if (!process.env[required]) throw new Error(`Missing ${required}`);
}

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function contentType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

const files = filesUnder(materialsRoot);
if (!files.length) throw new Error("No material files found to migrate.");

console.log(`Migrating ${files.length} files to R2 bucket ${bucket}...`);
for (const file of files) {
  const key = relative(materialsRoot, file).split(sep).join("/");
  if (key.split("/").some((part) => part === "." || part === ".." || !part)) {
    throw new Error(`Invalid R2 key: ${key}`);
  }
  const size = statSync(file).size;
  console.log(`Uploading ${key} (${size} bytes)`);
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucket}/${key}`,
      `--file=${file}`,
      `--content-type=${contentType(file)}`,
      "--remote",
    ],
    {
      cwd: appRoot,
      env: process.env,
      stdio: "inherit",
    },
  );
}

console.log(`Migration complete: ${files.length} objects uploaded to ${bucket}.`);
