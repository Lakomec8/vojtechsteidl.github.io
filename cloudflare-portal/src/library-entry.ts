import { createRemoteJWKSet, jwtVerify } from "jose";
import portalWorker from "./entry";

const HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const ROOT = "/student-portal/";
const PREFIX = "/student-portal";
const R2_PREFIX = "library/matematika/";
const ROUTE_PREFIX = `${PREFIX}/Library/matematika/`;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Student = { id: string; display_name: string; material_path: string };
type Principal = { student: Student | null; isAdmin: boolean };
type WorkerRequest = Parameters<typeof portalWorker.fetch>[0];

class PortalError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const TITLES: Record<string, string> = {
  "01": "01 — Algebraické úpravy",
  "02": "02 — Mocniny a odmocniny",
  "03": "03 — Rovnice a nerovnice",
  "04": "04 — Kvadratické rovnice a nerovnice",
  "05": "05 — Funkce — velký přehled",
  "06": "06 — Goniometrie",
  "07": "07 — Planimetrie",
  "08": "08 — Stereometrie",
  "09": "09 — Derivace",
  "10": "10 — Integrály",
  "11": "11 — Matice a soustavy lineárních rovnic",
  "12": "12 — Pravděpodobnost a statistika",
};

function headers(existing = new Headers()): Headers {
  existing.set("Cache-Control", "private, no-store, max-age=0");
  existing.set("Pragma", "no-cache");
  existing.set("X-Content-Type-Options", "nosniff");
  existing.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return existing;
}

function plain(message: string, status: number): Response {
  const h = headers();
  h.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { status, headers: h });
}

function html(body: string): Response {
  const h = headers();
  h.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { headers: h });
}

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: headers(new Headers({ Location: location })) });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[c] || c);
}

function cleanPdfName(name: string): string {
  const cleaned = name.normalize("NFKC").replace(/[\\/]+/g, "-").replace(/[\u0000-\u001f]/g, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") throw new PortalError(400, "Invalid filename.");
  if (!cleaned.toLowerCase().endsWith(".pdf")) throw new PortalError(400, "Only PDF files are allowed.");
  return cleaned.slice(0, 180);
}

function titleFor(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "");
  const number = base.match(/^(\d{2})(?:[-_\s]|$)/)?.[1];
  return (number && TITLES[number]) || base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function today(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function materialDate(item: Record<string, unknown>): string {
  const value = String(item.date || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeMaterials(materials: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const sorted = materials
    .map((material, index) => ({ material, index }))
    .sort((a, b) => materialDate(b.material).localeCompare(materialDate(a.material)) || a.index - b.index)
    .map(({ material }) => material);
  const current = new Set(["Aktuální PDF", "Aktuální materiál", "Nové PDF"]);
  for (const material of sorted) if (current.has(String(material.badge || ""))) material.badge = "PDF";
  const latest = sorted.find((material) => material.url);
  if (latest) latest.badge = String(latest.url).toLowerCase().includes(".pdf") ? "Aktuální PDF" : "Aktuální materiál";
  return sorted;
}

function libraryUrl(key: string): string {
  if (!key.startsWith(R2_PREFIX)) throw new PortalError(400, "Invalid library key.");
  const rest = key.slice(R2_PREFIX.length);
  return ROUTE_PREFIX + rest.split("/").map(encodeURIComponent).join("/");
}

function keyFromPath(encoded: string): string {
  const parts = encoded.split("/").map(decodeURIComponent);
  if (!parts.length || parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    throw new PortalError(400, "Invalid library path.");
  }
  return R2_PREFIX + parts.join("/");
}

async function delegate(request: Request, env: Env): Promise<Response> {
  return portalWorker.fetch(request as WorkerRequest, env);
}

async function authenticatedEmail(request: Request, env: Env): Promise<string> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new PortalError(403, "Authentication required.");
  if (!env.TEAM_DOMAIN?.startsWith("https://") || !env.POLICY_AUD) throw new PortalError(503, "Access configuration is incomplete.");
  try {
    const jwks = createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, { issuer: env.TEAM_DOMAIN, audience: env.POLICY_AUD });
    if (typeof payload.email !== "string" || !payload.email.trim()) throw new PortalError(403, "Authenticated identity has no email.");
    return payload.email.trim().toLowerCase();
  } catch (error) {
    if (error instanceof PortalError) throw error;
    throw new PortalError(403, "Invalid authentication token.");
  }
}

async function principal(request: Request, env: Env): Promise<Principal> {
  const email = await authenticatedEmail(request, env);
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path FROM students WHERE email = ?1 COLLATE NOCASE AND enabled = 1 LIMIT 1`,
  ).bind(email).first<Student>();
  if (student) return { student, isAdmin: false };
  const admin = await env.DB.prepare(
    `SELECT email FROM portal_admins WHERE email = ?1 COLLATE NOCASE AND enabled = 1 LIMIT 1`,
  ).bind(email).first<{ email: string }>();
  if (!admin) throw new PortalError(403, "This account is not authorized for the student portal.");
  return { student: null, isAdmin: true };
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  if (!(await principal(request, env)).isAdmin) throw new PortalError(403, "Administrator access is required.");
}

async function profile(studentId: string, env: Env): Promise<Record<string, unknown>> {
  const row = await env.DB.prepare(`SELECT payload_json FROM student_profiles WHERE student_id = ?1 LIMIT 1`)
    .bind(studentId).first<{ payload_json: string }>();
  if (!row) throw new PortalError(404, "Student profile was not found.");
  try { return JSON.parse(row.payload_json) as Record<string, unknown>; }
  catch { throw new PortalError(500, "Student profile data is invalid."); }
}

async function studentById(id: string, env: Env): Promise<Student> {
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path FROM students WHERE id = ?1 AND enabled = 1 LIMIT 1`,
  ).bind(id).first<Student>();
  if (!student) throw new PortalError(404, "Student was not found.");
  return student;
}

async function manager(request: Request, env: Env, url: URL): Promise<Response> {
  await requireAdmin(request, env);
  const bucket = env.MATERIALS;
  if (!bucket) throw new PortalError(503, "Private material storage is not configured yet.");
  const students = (await env.DB.prepare(
    `SELECT id, display_name, material_path FROM students WHERE enabled = 1 ORDER BY display_name COLLATE NOCASE`,
  ).all<Student>()).results || [];
  const listed = await bucket.list({ prefix: R2_PREFIX });
  const options = students.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.display_name)}</option>`).join("");
  const items = await Promise.all(listed.objects.map(async (object) => {
    const meta = await bucket.head(object.key);
    const fileName = object.key.split("/").at(-1) || object.key;
    const title = String(meta?.customMetadata?.title || "").trim() || titleFor(fileName);
    const date = new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", dateStyle: "short" }).format(object.uploaded);
    return { object, fileName, title, date };
  }));
  items.sort((a, b) => a.title.localeCompare(b.title, "cs", { numeric: true }));
  const rows = items.length ? items.map(({ object, fileName, title, date }) => `
    <article class="item"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(fileName)} · ${Math.max(1, Math.round(object.size / 1024))} kB · ${escapeHtml(date)}</p><a href="${libraryUrl(object.key)}" target="_blank" rel="noopener">Otevřít master PDF</a></div>
    <form method="post" action="${PREFIX}/admin/library/assign"><input type="hidden" name="key" value="${escapeHtml(object.key)}"><select name="studentId" required><option value="">Vyber studenta…</option>${options}</select><button>Přidělit</button></form></article>`).join("")
    : `<p class="empty">Knihovna je zatím prázdná.</p>`;
  const message = url.searchParams.get("uploaded")
    ? `${Number(url.searchParams.get("uploaded")) || 1} PDF bylo uloženo do knihovny.`
    : url.searchParams.get("assigned") ? `Materiál byl přidělen studentovi ${url.searchParams.get("assigned")}.` : "";
  return html(`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Knihovna materiálů</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#102a43;font-family:Inter,system-ui,sans-serif}.wrap{width:min(960px,calc(100% - 32px));margin:42px auto}.nav{display:flex;justify-content:space-between;margin-bottom:18px}.nav a,a{color:#2563eb;font-weight:700;text-decoration:none}.box{background:#fff;border:1px solid #d9e2ec;border-radius:18px;padding:24px;margin-bottom:18px}h1,h2,h3{margin-top:0}.muted,.item p{color:#64748b}.upload{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.upload input,.item select{padding:10px;border:1px solid #bcccdc;border-radius:9px;background:#fff}.upload button,.item button{padding:11px 15px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}.rule,.notice{padding:12px 14px;border-radius:11px;margin-top:14px}.rule{background:#eff6ff;color:#1e3a8a}.notice{background:#ecfdf5;color:#166534;margin-bottom:18px}.list{display:grid;gap:12px}.item{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;border:1px solid #e2e8f0;border-radius:13px;padding:16px}.item h3{margin-bottom:5px}.item p{margin:0 0 7px;font-size:13px}.item form{display:flex;gap:8px}.empty{color:#64748b}@media(max-width:720px){.item{grid-template-columns:1fr}.item form{flex-direction:column}.nav{gap:10px;flex-direction:column}}
</style></head><body><main class="wrap"><div class="nav"><a href="${ROOT}">← Studentské zóny</a><a href="${PREFIX}/admin/materials">Soukromé materiály →</a></div>${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="box"><h1>Knihovna materiálů</h1><p class="muted">Master PDF je v R2 jen jednou. Studentovi se při přidělení uloží pouze bezpečný odkaz.</p><form class="upload" method="post" action="${PREFIX}/admin/library/upload" enctype="multipart/form-data"><div><strong>PDF do knihovny</strong><br><input name="files" type="file" accept="application/pdf,.pdf" multiple required></div><button>Nahrát / nahradit PDF</button></form><div class="rule"><strong>Aktualizace:</strong> znovu nahraj PDF se stejným názvem souboru. Všichni studenti pak automaticky otevřou novou verzi.</div></section><section class="box"><h2>Materiály</h2><div class="list">${rows}</div></section></main></body></html>`);
}

async function upload(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  const bucket = env.MATERIALS;
  if (!bucket) throw new PortalError(503, "Private material storage is not configured yet.");
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  if (!files.length) throw new PortalError(400, "At least one PDF file is required.");
  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new PortalError(400, `${file.name || "PDF"} must be between 1 byte and 25 MB.`);
    const fileName = cleanPdfName(file.name);
    await bucket.put(R2_PREFIX + fileName, file.stream(), {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: { title: titleFor(fileName), originalName: fileName, category: "matematika", updatedAt: new Date().toISOString() },
    });
  }
  return redirect(`${PREFIX}/admin/library?uploaded=${files.length}`);
}

async function assign(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  const bucket = env.MATERIALS;
  if (!bucket) throw new PortalError(503, "Private material storage is not configured yet.");
  const form = await request.formData();
  const student = await studentById(String(form.get("studentId") || "").trim(), env);
  const key = String(form.get("key") || "").trim();
  if (!key.startsWith(R2_PREFIX) || key.includes("..") || key.includes("\\")) throw new PortalError(400, "Invalid library key.");
  const object = await bucket.head(key);
  if (!object) throw new PortalError(404, "Library material was not found.");
  const fileName = key.split("/").at(-1) || "material.pdf";
  const title = String(object.customMetadata?.title || "").trim() || titleFor(fileName);
  const data = await profile(student.id, env);
  const materials = Array.isArray(data.materials) ? [...data.materials] as Array<Record<string, unknown>> : [];
  const existing = materials.findIndex((item) => item.libraryKey === key);
  const date = today();
  const item: Record<string, unknown> = { ...(existing >= 0 ? materials[existing] : {}), title, meta: `Knihovna • PDF • ${date}`, badge: "Aktuální PDF", badgeClass: "pdf", url: libraryUrl(key), date, source: "r2-library", libraryKey: key };
  if (existing >= 0) materials.splice(existing, 1);
  data.materials = normalizeMaterials([item, ...materials]);
  data.incrementLessonCountOnMaterialAdd = false;
  await env.DB.prepare(`UPDATE student_profiles SET payload_json = ?1, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?2`)
    .bind(JSON.stringify(data), student.id).run();
  return redirect(`${PREFIX}/admin/library?assigned=${encodeURIComponent(student.display_name)}`);
}

async function serve(request: Request, env: Env, url: URL): Promise<Response | null> {
  const match = url.pathname.match(/^\/student-portal\/Library\/matematika\/(.+)$/i);
  if (!match) return null;
  const who = await principal(request, env);
  const key = keyFromPath(match[1]);
  if (who.student) {
    const data = await profile(who.student.id, env);
    const materials = Array.isArray(data.materials) ? data.materials as Array<Record<string, unknown>> : [];
    if (!materials.some((item) => item.libraryKey === key)) throw new PortalError(403, "This library material is not assigned to your account.");
  } else if (!who.isAdmin) throw new PortalError(403, "Library access is not authorized.");
  const object = await env.MATERIALS?.get(key);
  if (!object) return null;
  const h = headers();
  object.writeHttpMetadata(h);
  h.set("ETag", object.httpEtag);
  const fileName = key.split("/").at(-1) || "material.pdf";
  h.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  return new Response(request.method === "HEAD" ? null : object.body, { headers: h });
}

async function addAdminLink(response: Response): Promise<Response> {
  if (response.status !== 200 || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  const marker = "Správa soukromých materiálů →</a></p>";
  if (!body.includes(marker) || body.includes("Knihovna materiálů →")) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const enhanced = body.replace(marker, `${marker}<p style="margin:-8px 0 18px"><a href="${PREFIX}/admin/library" style="color:#2563eb;font-weight:700">Knihovna materiálů →</a></p>`);
  const h = new Headers(response.headers); h.delete("Content-Length");
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers: h });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (!HOSTS.has(url.hostname)) return delegate(request, env);
      if (url.pathname === `${PREFIX}/admin/library`) return request.method === "GET" ? manager(request, env, url) : plain("Method not allowed", 405);
      if (url.pathname === `${PREFIX}/admin/library/upload`) return upload(request, env);
      if (url.pathname === `${PREFIX}/admin/library/assign`) return assign(request, env);
      if (/^\/student-portal\/Library\/matematika\//i.test(url.pathname)) return (await serve(request, env, url)) || plain("Library material was not found.", 404);
      const response = await delegate(request, env);
      return url.pathname === ROOT || url.pathname === `${PREFIX}/admin` || url.pathname === `${PREFIX}/admin/` ? addAdminLink(response) : response;
    } catch (error) {
      if (error instanceof PortalError) return plain(error.message, error.status);
      console.error(JSON.stringify({ event: "library_entry_error", path: url.pathname }));
      return plain("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
