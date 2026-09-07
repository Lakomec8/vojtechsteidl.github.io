import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(appRoot, "dist");
const sourceAssets = join(appRoot, "static", "assets");
const distAssets = join(distRoot, "assets");
const katexDist = join(appRoot, "node_modules", "katex", "dist");
const katexTarget = join(distAssets, "katex");

await mkdir(distAssets, { recursive: true });
await cp(join(sourceAssets, "student-self-checks-v2.css"), join(distAssets, "student-self-checks-v2.css"));
await cp(join(sourceAssets, "student-self-checks-v2.js"), join(distAssets, "student-self-checks-v2.js"));

const v2Source = await readFile(join(sourceAssets, "student-self-checks-v2.js"), "utf8");
new Function(v2Source);

await mkdir(katexTarget, { recursive: true });
await cp(join(katexDist, "katex.min.css"), join(katexTarget, "katex.min.css"));
await cp(join(katexDist, "katex.min.js"), join(katexTarget, "katex.min.js"));
await cp(join(katexDist, "fonts"), join(katexTarget, "fonts"), { recursive: true });

const portalPath = join(distRoot, "student-portal.html");
let html = await readFile(portalPath, "utf8");

html = html.replace(
  /\s*<link rel="stylesheet" href="assets\/student-self-checks-math\.css\?v=[^"]+">/,
  '\n  <link rel="stylesheet" href="assets/katex/katex.min.css?v=0.16.11">\n  <link rel="stylesheet" href="assets/student-self-checks-v2.css?v=20260907-1">',
);

html = html.replace(
  /\s*<script src="assets\/student-self-checks\.js\?v=[^"]+"><\/script>\s*<script src="assets\/student-self-checks-math\.js\?v=[^"]+"><\/script>/,
  '\n  <script src="assets/katex/katex.min.js?v=0.16.11"></script>\n  <script src="assets/student-self-checks-v2.js?v=20260907-1"></script>',
);

if (
  !html.includes("assets/katex/katex.min.css") ||
  !html.includes("assets/katex/katex.min.js") ||
  !html.includes("assets/student-self-checks-v2.css") ||
  !html.includes("assets/student-self-checks-v2.js") ||
  html.includes("assets/student-self-checks-math.js") ||
  /assets\/student-self-checks\.js\?/.test(html)
) {
  throw new Error("Self-check v2 asset patch did not produce the expected portal HTML.");
}

await writeFile(portalPath, html);
console.log("Prepared self-check v2 UI with bundled KaTeX assets.");
