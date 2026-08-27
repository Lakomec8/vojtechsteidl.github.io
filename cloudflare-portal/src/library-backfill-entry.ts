import { createRemoteJWKSet, jwtVerify } from "jose";
import libraryEntry from "./library-entry";

const HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const PREFIX = "/student-portal";
const R2_PREFIX = "library/matematika/";
const BACKFILL_ROUTE = `${PREFIX}/admin/library/backfill-pdf`;
const MAX_BACKFILL_PDFS = 300;

type Student = { id: string; display_name: string; material_path: string };
type WorkerRequest = Parameters<typeof libraryEntry.fetch>[0];

class BackfillError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function privateHeaders(headers = new Headers()): Headers {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return headers;
}

function plain(message: string, status: number): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { status, headers });
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: privateHeaders(new Headers({ Location: location })),
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function cleanPdfName(name: string): string {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\\/]+/g, "-")
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new BackfillError(400, "Invalid PDF filename.");
  }
  if (!cleaned.toLowerCase().endsWith(".pdf")) {
    throw new BackfillError(400, "Only PDF files can be backfilled.");
  }
  return cleaned.slice(0, 180);
}

function titleFor(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function suffixFor(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "student";
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

async function authenticatedEmail(request: Request, env: Env): Promise<string> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new BackfillError(403, "Authentication required.");
  if (!env.TEAM_DOMAIN?.startsWith("https://") || !env.POLICY_AUD) {
    throw new BackfillError(503, "Access configuration is incomplete.");
  }

  try {
    const jwks = createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });
    if (typeof payload.email !== "string" || !payload.email.trim()) {
      throw new BackfillError(403, "Authenticated identity has no email.");
    }
    return payload.email.trim().toLowerCase();
  } catch (error) {
    if (error instanceof BackfillError) throw error;
    throw new BackfillError(403, "Invalid authentication token.");
  }
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  const email = await authenticatedEmail(request, env);
  const admin = await env.DB.prepare(
    `SELECT email FROM portal_admins WHERE email = ?1 COLLATE NOCASE AND enabled = 1 LIMIT 1`,
  ).bind(email).first<{ email: string }>();
  if (!admin) throw new BackfillError(403, "Administrator access is required.");
}

async function listAll(bucket: R2Bucket, prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

function chooseTargetKey(fileName: string, student: Student, usedKeys: Set<string>): { key: string; collision: boolean } {
  const direct = R2_PREFIX + fileName;
  if (!usedKeys.has(direct)) return { key: direct, collision: false };

  const stem = fileName.replace(/\.pdf$/i, "");
  const suffix = suffixFor(student.material_path || student.id);
  let counter = 1;
  while (true) {
    const extra = counter === 1 ? `--${suffix}` : `--${suffix}-${counter}`;
    const maxStemLength = Math.max(1, 180 - extra.length - 4);
    const candidate = R2_PREFIX + `${stem.slice(0, maxStemLength)}${extra}.pdf`;
    if (!usedKeys.has(candidate)) return { key: candidate, collision: true };
    counter += 1;
  }
}

async function backfill(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  const bucket = env.MATERIALS;
  if (!bucket) throw new BackfillError(503, "Private material storage is not configured yet.");

  const students = (await env.DB.prepare(
    `SELECT id, display_name, material_path FROM students WHERE enabled = 1 ORDER BY display_name COLLATE NOCASE`,
  ).all<Student>()).results || [];

  const libraryObjects = (await listAll(bucket, R2_PREFIX))
    .filter((object) => object.key.toLowerCase().endsWith(".pdf"));
  const usedKeys = new Set(libraryObjects.map((object) => object.key));
  const hashes = new Set<string>();

  for (const object of libraryObjects) {
    const body = await bucket.get(object.key);
    if (!body) continue;
    const bytes = await body.arrayBuffer();
    hashes.add(await sha256(bytes));
  }

  const sources: Array<{ student: Student; object: R2Object }> = [];
  for (const student of students) {
    const prefix = `${student.material_path}/`;
    const objects = await listAll(bucket, prefix);
    for (const object of objects) {
      if (object.key.startsWith(R2_PREFIX)) continue;
      if (!object.key.toLowerCase().endsWith(".pdf")) continue;
      sources.push({ student, object });
    }
  }

  if (sources.length > MAX_BACKFILL_PDFS) {
    throw new BackfillError(409, `Backfill found ${sources.length} PDFs; safety limit is ${MAX_BACKFILL_PDFS}.`);
  }

  let imported = 0;
  let duplicates = 0;
  let collisions = 0;
  let missing = 0;

  for (const { student, object } of sources) {
    const body = await bucket.get(object.key);
    if (!body) {
      missing += 1;
      continue;
    }

    const bytes = await body.arrayBuffer();
    const digest = await sha256(bytes);
    if (hashes.has(digest)) {
      duplicates += 1;
      continue;
    }

    const sourceName = object.key.split("/").at(-1) || `${student.id}.pdf`;
    const fileName = cleanPdfName(sourceName);
    const target = chooseTargetKey(fileName, student, usedKeys);
    if (target.collision) collisions += 1;

    await bucket.put(target.key, bytes, {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: {
        title: titleFor(fileName),
        originalName: fileName,
        category: "matematika",
        source: "student-material-backfill",
        importedFrom: object.key,
        sha256: digest,
        importedAt: new Date().toISOString(),
      },
    });

    usedKeys.add(target.key);
    hashes.add(digest);
    imported += 1;
  }

  const params = new URLSearchParams({
    backfilled: String(imported),
    duplicates: String(duplicates),
    collisions: String(collisions),
    scanned: String(sources.length),
    missing: String(missing),
  });
  return redirect(`${PREFIX}/admin/library?${params.toString()}`);
}

async function enhanceLibraryManager(response: Response, url: URL): Promise<Response> {
  if (response.status !== 200 || !(response.headers.get("Content-Type") || "").includes("text/html")) {
    return response;
  }

  let body = await response.text();
  const marker = `<section class="box"><h2>Materiály</h2>`;
  if (body.includes(marker) && !body.includes(BACKFILL_ROUTE)) {
    const importBox = `<section class="box"><h2>Převzít dosavadní PDF</h2><p class="muted">Projdu soukromé PDF všech aktivních studentů a zkopíruju unikátní soubory do společné knihovny. Existující studentské odkazy se nemění.</p><form class="upload" method="post" action="${BACKFILL_ROUTE}"><button type="submit">Importovat existující PDF</button></form></section>`;
    body = body.replace(marker, importBox + marker);
  }

  if (url.searchParams.has("backfilled")) {
    const imported = Number(url.searchParams.get("backfilled")) || 0;
    const duplicates = Number(url.searchParams.get("duplicates")) || 0;
    const collisions = Number(url.searchParams.get("collisions")) || 0;
    const scanned = Number(url.searchParams.get("scanned")) || 0;
    const missing = Number(url.searchParams.get("missing")) || 0;
    const detail = `Import dokončen: ${imported} nových PDF, ${duplicates} duplicit přeskočeno, ${collisions} kolizí názvu bezpečně přejmenováno, ${scanned} PDF zkontrolováno${missing ? `, ${missing} zdrojových souborů chybělo` : ""}.`;
    const firstBox = `<section class="box">`;
    if (body.includes(firstBox)) {
      body = body.replace(firstBox, `<div class="notice">${escapeHtml(detail)}</div>${firstBox}`);
    }
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (HOSTS.has(url.hostname) && url.pathname === BACKFILL_ROUTE) {
        return backfill(request, env);
      }

      const response = await libraryEntry.fetch(request as WorkerRequest, env);
      if (
        HOSTS.has(url.hostname) &&
        request.method === "GET" &&
        url.pathname === `${PREFIX}/admin/library`
      ) {
        return enhanceLibraryManager(response, url);
      }
      return response;
    } catch (error) {
      if (error instanceof BackfillError) return plain(error.message, error.status);
      console.error(JSON.stringify({ event: "library_backfill_error", path: url.pathname }));
      return plain("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
