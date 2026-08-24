import { createRemoteJWKSet, jwtVerify } from "jose";
import worker from "./index";

const MAIN_HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const PORTAL_ROOT = "/student-portal/";
const PORTAL_PREFIX = "/student-portal";
const ADMIN_STUDENT_COOKIE = "portal_admin_student";
const ADMIN_VIEW_COOKIE = "portal_admin_view_once";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type PortalStudent = {
  id: string;
  display_name: string;
  material_path: string;
};

type PortalPrincipal = {
  email: string;
  student: PortalStudent | null;
  isAdmin: boolean;
};

type ExtendedEnv = Env & {
  MATERIALS?: R2Bucket;
};

type WorkerRequest = Parameters<typeof worker.fetch>[0];

class PortalError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function privateHeaders(headers = new Headers()): Headers {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return headers;
}

function plain(message: string, status: number): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { status, headers });
}

function html(body: string, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { status, headers });
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

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function appendClearCookie(headers: Headers, name: string): void {
  headers.append(
    "Set-Cookie",
    `${name}=; Path=/student-portal/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
  );
}

function redirectToPortal(clearAdminSelection = false): Response {
  const headers = privateHeaders(new Headers({
    Location: "https://vojtechsteidl.eu/student-portal/",
  }));
  if (clearAdminSelection) appendClearCookie(headers, ADMIN_STUDENT_COOKIE);
  appendClearCookie(headers, ADMIN_VIEW_COOKIE);
  return new Response(null, { status: 302, headers });
}

function withOneTimeAdminView(response: Response): Response {
  if (response.status < 300 || response.status >= 400) return response;
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    `${ADMIN_VIEW_COOKIE}=1; Path=/student-portal/; Max-Age=60; HttpOnly; Secure; SameSite=Strict`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clearOneTimeAdminView(response: Response): Response {
  const headers = new Headers(response.headers);
  appendClearCookie(headers, ADMIN_VIEW_COOKIE);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function delegate(request: Request, env: Env): Promise<Response> {
  return worker.fetch(request as WorkerRequest, env);
}

async function authenticatedEmail(request: Request, env: Env): Promise<string> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new PortalError(403, "Authentication required.");
  if (!env.TEAM_DOMAIN?.startsWith("https://") || !env.POLICY_AUD) {
    throw new PortalError(503, "Access configuration is incomplete.");
  }

  try {
    const jwks = createRemoteJWKSet(new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });
    if (typeof payload.email !== "string" || !payload.email.trim()) {
      throw new PortalError(403, "Authenticated identity has no email.");
    }
    return payload.email.trim().toLowerCase();
  } catch (error) {
    if (error instanceof PortalError) throw error;
    throw new PortalError(403, "Invalid authentication token.");
  }
}

async function principalForRequest(request: Request, env: Env): Promise<PortalPrincipal> {
  const email = await authenticatedEmail(request, env);
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE email = ?1 COLLATE NOCASE
        AND enabled = 1
      LIMIT 1`,
  ).bind(email).first<PortalStudent>();

  if (student) return { email, student, isAdmin: false };

  const administrator = await env.DB.prepare(
    `SELECT email
       FROM portal_admins
      WHERE email = ?1 COLLATE NOCASE
        AND enabled = 1
      LIMIT 1`,
  ).bind(email).first<{ email: string }>();

  if (!administrator) {
    throw new PortalError(403, "This account is not authorized for the student portal.");
  }
  return { email, student: null, isAdmin: true };
}

async function studentById(id: string, env: Env): Promise<PortalStudent> {
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE id = ?1
        AND enabled = 1
      LIMIT 1`,
  ).bind(id).first<PortalStudent>();
  if (!student) throw new PortalError(404, "Student was not found.");
  return student;
}

async function selectedStudentForPrincipal(
  request: Request,
  env: Env,
  principal: PortalPrincipal,
): Promise<PortalStudent> {
  if (principal.student) return principal.student;
  if (!principal.isAdmin) throw new PortalError(403, "Student access is required.");
  const selectedId = cookieValue(request, ADMIN_STUDENT_COOKIE);
  if (!selectedId) throw new PortalError(400, "Select a student from the administrator overview.");
  return studentById(selectedId, env);
}

function decodeMaterialRemainder(encoded: string): string {
  const parts = encoded.split("/").map((part) => decodeURIComponent(part));
  if (!parts.length || parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    throw new PortalError(400, "Invalid material path.");
  }
  return parts.join("/");
}

async function r2MaterialResponse(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response | null> {
  const match = url.pathname.match(/^\/student-portal\/Materials\/([^/]+)\/(.+)$/i);
  if (!match) return null;

  const principal = await principalForRequest(request, env);
  const student = await selectedStudentForPrincipal(request, env, principal);
  const requestedStudentPath = decodeURIComponent(match[1]).toLowerCase();
  if (requestedStudentPath !== student.material_path.toLowerCase()) {
    throw new PortalError(403, "This material belongs to another account.");
  }

  const bucket = (env as ExtendedEnv).MATERIALS;
  if (!bucket) return null;

  const remainder = decodeMaterialRemainder(match[2]);
  const key = `${student.material_path}/${remainder}`;
  const object = await bucket.get(key);
  if (!object) return null;

  const headers = privateHeaders();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  const contentType = headers.get("Content-Type") || "application/octet-stream";
  const disposition = contentType === "application/pdf" ? "inline" : "attachment";
  const fileName = remainder.split("/").at(-1) || "material";
  headers.set(
    "Content-Disposition",
    `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  );

  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}

async function requireAdmin(request: Request, env: Env): Promise<PortalPrincipal> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal;
}

async function materialsManager(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  const result = await env.DB.prepare(
    `SELECT id, display_name
       FROM students
      WHERE enabled = 1
      ORDER BY display_name COLLATE NOCASE`,
  ).all<{ id: string; display_name: string }>();
  const rows = (result.results || []).map((student) => `
    <li>
      <strong>${escapeHtml(student.display_name)}</strong>
      <a href="${PORTAL_PREFIX}/admin/upload/${encodeURIComponent(student.id)}">Nahrát PDF</a>
    </li>`).join("");

  return html(`<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Materiály | Administrace</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#f4f7fb;color:#102a43;margin:0}.wrap{width:min(760px,calc(100% - 32px));margin:48px auto}.back,a{color:#2563eb}.box{background:#fff;border:1px solid #d9e2ec;border-radius:16px;padding:24px}ul{list-style:none;padding:0;margin:20px 0 0}li{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 0;border-top:1px solid #e7edf4}li:first-child{border-top:0}</style>
</head><body><main class="wrap"><p><a class="back" href="${PORTAL_ROOT}">← Studentské zóny</a></p><div class="box"><h1>Soukromé materiály</h1><p>PDF nahrané zde se ukládá do Cloudflare R2 a student ho dostane přes svou autorizovanou zónu.</p><ul>${rows}</ul></div></main></body></html>`);
}

function cleanPdfName(name: string): string {
  const cleaned = name.normalize("NFKC").replace(/[\\/]+/g, "-").replace(/[\u0000-\u001f]/g, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") throw new PortalError(400, "Invalid filename.");
  if (!cleaned.toLowerCase().endsWith(".pdf")) throw new PortalError(400, "Only PDF files are allowed.");
  return cleaned.slice(0, 180);
}

function portalToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function materialDate(item: Record<string, unknown>): string {
  const value = String(item?.date || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeMaterials(
  materials: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const sorted = materials
    .map((material, index) => ({ material, index }))
    .sort((first, second) => {
      const byDate = materialDate(second.material).localeCompare(materialDate(first.material));
      return byDate || first.index - second.index;
    })
    .map(({ material }) => material);

  const transientBadges = new Set(["Aktuální PDF", "Aktuální materiál", "Nové PDF"]);
  for (const material of sorted) {
    if (transientBadges.has(String(material.badge || ""))) material.badge = "PDF";
  }

  const latest = sorted.find((material) => material?.url);
  if (latest) {
    const url = String(latest.url || "").toLowerCase();
    latest.badge = url.includes(".pdf") ? "Aktuální PDF" : "Aktuální materiál";
  }

  return sorted;
}

async function profileRow(studentId: string, env: Env): Promise<Record<string, unknown>> {
  const row = await env.DB.prepare(
    `SELECT payload_json FROM student_profiles WHERE student_id = ?1 LIMIT 1`,
  ).bind(studentId).first<{ payload_json: string }>();
  if (!row) throw new PortalError(404, "Student profile was not found.");
  try {
    return JSON.parse(row.payload_json) as Record<string, unknown>;
  } catch {
    throw new PortalError(500, "Student profile data is invalid.");
  }
}

function uploadForm(student: PortalStudent, message = ""): Response {
  const today = portalToday();
  const notice = message ? `<p style="padding:12px;background:#ecfdf5;border-radius:10px">${escapeHtml(message)}</p>` : "";
  return html(`<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Nahrát materiál | ${escapeHtml(student.display_name)}</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#f4f7fb;color:#102a43;margin:0}.wrap{width:min(680px,calc(100% - 32px));margin:48px auto}.box{background:#fff;border:1px solid #d9e2ec;border-radius:16px;padding:24px}label{display:block;font-weight:700;margin:18px 0 6px}input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #bcccdc;border-radius:9px}button{margin-top:22px;padding:11px 16px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer}a{color:#2563eb}</style>
</head><body><main class="wrap"><p><a href="${PORTAL_PREFIX}/admin/materials">← Materiály</a></p><div class="box"><h1>${escapeHtml(student.display_name)}</h1>${notice}<form method="post" enctype="multipart/form-data"><label for="file">PDF</label><input id="file" name="file" type="file" accept="application/pdf,.pdf" required><label for="title">Název na nástěnce</label><input id="title" name="title" type="text" maxlength="140" placeholder="Např. Kvadratické rovnice"><label for="date">Datum hodiny</label><input id="date" name="date" type="date" value="${today}" required><button type="submit">Nahrát do soukromého úložiště</button></form></div></main></body></html>`);
}

async function adminUpload(
  request: Request,
  env: Env,
  studentId: string,
): Promise<Response> {
  await requireAdmin(request, env);
  const student = await studentById(studentId, env);
  if (request.method === "GET") return uploadForm(student);
  if (request.method !== "POST") return plain("Method not allowed", 405);

  const bucket = (env as ExtendedEnv).MATERIALS;
  if (!bucket) throw new PortalError(503, "Private material storage is not configured yet.");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new PortalError(400, "PDF file is required.");
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new PortalError(400, "PDF must be between 1 byte and 25 MB.");
  }
  const fileName = cleanPdfName(file.name);
  const titleInput = String(form.get("title") || "").trim();
  const title = titleInput || fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const date = String(form.get("date") || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new PortalError(400, "Invalid lesson date.");

  const profile = await profileRow(student.id, env);
  const rawMaterials = profile.materials;
  const materials = Array.isArray(rawMaterials) ? [...rawMaterials] as Array<Record<string, unknown>> : [];
  const encodedPath = encodeURIComponent(student.material_path);
  const encodedName = encodeURIComponent(fileName);
  const materialUrl = `${PORTAL_PREFIX}/Materials/${encodedPath}/${encodedName}`;
  const key = `${student.material_path}/${fileName}`;
  const existingIndex = materials.findIndex((item) => item?.url === materialUrl || item?.r2Key === key);
  const sameDateAlreadyExists = materials.some((item, index) => index !== existingIndex && item?.date === date);
  const isNew = existingIndex < 0;

  const item: Record<string, unknown> = {
    ...(existingIndex >= 0 ? materials[existingIndex] : {}),
    title,
    meta: `PDF • ${date}`,
    badge: "Aktuální PDF",
    badgeClass: "pdf",
    url: materialUrl,
    date,
    source: "r2-admin-upload",
    r2Key: key,
  };

  if (existingIndex >= 0) materials.splice(existingIndex, 1);
  profile.materials = normalizeMaterials([item, ...materials]);
  profile.incrementLessonCountOnMaterialAdd = false;

  // PDF upload nikdy nemění počet absolvovaných hodin. Ten je odvozen pouze
  // z lekcí synchronizovaných z Google Calendar.
  const externalLessons = Array.isArray(profile.externalLessons)
    ? profile.externalLessons as Array<Record<string, unknown>>
    : [];
  profile.completedLessonsCount = new Set(
    externalLessons.map((lesson) => String(lesson?.date || "")).filter(Boolean),
  ).size;

  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { studentId: student.id, originalName: fileName, lessonDate: date },
  });

  try {
    await env.DB.prepare(
      `UPDATE student_profiles
          SET payload_json = ?1,
              updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?2`,
    ).bind(JSON.stringify(profile), student.id).run();
  } catch (error) {
    if (isNew) await bucket.delete(key).catch(() => undefined);
    throw error;
  }

  return uploadForm(student, `${fileName} byl uložen do R2 a přidán na nástěnku.`);
}

async function augmentAdminLanding(response: Response): Promise<Response> {
  if (response.status !== 200 || !(response.headers.get("Content-Type") || "").includes("text/html")) {
    return response;
  }
  const body = await response.text();
  if (!body.includes("Studentské zóny") || !body.includes("<div class=\"notice\">")) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const enhanced = body.replace(
    '<div class="notice">',
    `<p style="margin:0 0 18px"><a href="${PORTAL_PREFIX}/admin/materials" style="color:#2563eb;font-weight:700">Správa soukromých materiálů →</a></p><div class="notice">`,
  );
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (!MAIN_HOSTS.has(url.hostname)) {
        return delegate(request, env);
      }

      if (url.pathname === "/student-portal*") {
        return redirectToPortal(true);
      }

      if (url.pathname === `${PORTAL_PREFIX}/admin/materials`) {
        return materialsManager(request, env);
      }

      const uploadMatch = url.pathname.match(/^\/student-portal\/admin\/upload\/([^/]+)$/);
      if (uploadMatch) {
        return adminUpload(request, env, decodeURIComponent(uploadMatch[1]));
      }

      if (/^\/student-portal\/Materials\//i.test(url.pathname)) {
        const r2Response = await r2MaterialResponse(request, env, url);
        if (r2Response) return r2Response;
        return delegate(request, env);
      }

      const adminViewPath = /^\/student-portal\/admin\/view\/[^/]+$/;
      if (adminViewPath.test(url.pathname)) {
        return withOneTimeAdminView(await delegate(request, env));
      }

      if (url.pathname === PORTAL_ROOT) {
        const selectedStudent = cookieValue(request, ADMIN_STUDENT_COOKIE);
        const oneTimeAdminView = cookieValue(request, ADMIN_VIEW_COOKIE);

        if (selectedStudent && !oneTimeAdminView) {
          return redirectToPortal(true);
        }

        const response = await delegate(request, env);
        const normalized = oneTimeAdminView ? clearOneTimeAdminView(response) : response;
        return augmentAdminLanding(normalized);
      }

      if (url.pathname === `${PORTAL_PREFIX}/admin` || url.pathname === `${PORTAL_PREFIX}/admin/`) {
        return augmentAdminLanding(await delegate(request, env));
      }

      return delegate(request, env);
    } catch (error) {
      if (error instanceof PortalError) return plain(error.message, error.status);
      console.error(JSON.stringify({ event: "entry_error", path: url.pathname }));
      return plain("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
