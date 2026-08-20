import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "..");
const dist = join(appRoot, "dist");
const portalUrl = "https://vojtechsteidl.eu/student-portal/";

const rootFiles = [
  "index.html",
  "style.css",
  "foto.jpg",
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "student-portal.html",
];

const publicDirectories = [
  "assets",
  "doucovani-fyziky",
  "doucovani-matematiky",
  "priprava-na-maturitu-z-matematiky",
  "pro-skoly",
  "interactive-notes",
  "materialy-zdarma",
  // Student materials are included in the private deployment artifact,
  // but every portal material request is authorized by the Worker first.
  "Materials",
];

async function copyRequired(source, destination) {
  await cp(source, destination, { recursive: true });
}

function replaceOrFail(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Build patch failed: ${label}`);
  }
  return source.replace(search, replacement);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of rootFiles) {
  await copyRequired(join(repoRoot, file), join(dist, file));
}

for (const directory of publicDirectories) {
  await copyRequired(join(repoRoot, directory), join(dist, directory));
}

// Public entry points target the Access-protected path on the main domain.
const indexPath = join(dist, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
indexHtml = indexHtml.replaceAll(
  'href="student-portal.html"',
  `href="${portalUrl}"`,
);
indexHtml = indexHtml.replaceAll(
  'href="https://portal.vojtechsteidl.eu"',
  `href="${portalUrl}"`,
);

// Remove the old hard-coded student aliases from the deployed HTML if they
// are still present on the source branch.
indexHtml = indexHtml.replace(
  'const studentAliases={demo:"demo123",evelin:"evelina",evelin123:"evelina"},studentKey=studentAliases[enteredPassword]||enteredPassword,targetJson="students/"+encodeURIComponent(studentKey)+".json";',
  'const studentKey="cloudflare-access",targetJson="./api/profile";',
);
await writeFile(indexPath, indexHtml);

// Keep the dashboard UI but replace filename-based access with the
// authenticated API endpoint below /student-portal/.
const portalJsPath = join(dist, "assets", "student-portal.js");
let portalJs = await readFile(portalJsPath, "utf8");
portalJs = replaceOrFail(
  portalJs,
  '  const token = sessionStorage.getItem("student_token");',
  '  const token = "cloudflare-access";',
  "remove client-side student token",
);
portalJs = replaceOrFail(
  portalJs,
  '    const response = await fetch(\n      `students/${encodeURIComponent(token)}.json?ts=${Date.now()}`,\n      { cache: "no-store" },\n    );',
  '    const response = await fetch("./api/profile", {\n      cache: "no-store",\n      credentials: "same-origin",\n    });',
  "route profile reads through authenticated API",
);
portalJs = replaceOrFail(
  portalJs,
  '    const storageKey = `student-portal:${token}:`;',
  '    const storageKey = `student-portal:${data.studentId || "student"}:`;',
  "scope local task state to authenticated student",
);
portalJs = replaceOrFail(
  portalJs,
  '    $("logout").addEventListener("click", () => {\n      sessionStorage.removeItem("student_token");\n      window.location.href = "index.html";\n    });',
  '    $("logout").addEventListener("click", () => {\n      window.location.href = "/cdn-cgi/access/logout";\n    });',
  "use Cloudflare Access logout",
);
await writeFile(portalJsPath, portalJs);

await writeFile(
  join(dist, "_headers"),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`,
);

console.log(`Built allowlisted deployment artifact at ${dist}`);
