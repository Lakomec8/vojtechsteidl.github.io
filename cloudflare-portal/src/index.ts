import { createRemoteJWKSet, jwtVerify } from "jose";

type StudentRow = {
  id: string;
  display_name: string;
  material_path: string;
};

type ProfileRow = {
  payload_json: string;
};

type Principal = {
  email: string;
  student: StudentRow | null;
  isAdmin: boolean;
};

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const MAIN_HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const PORTAL_HOST = "portal.vojtechsteidl.eu";
const PORTAL_PREFIX = "/student-portal";
const ADMIN_STUDENT_COOKIE = "portal_admin_student";

function securityHeaders(headers = new Headers()): Headers {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return headers;
}

function privateHeaders(headers = new Headers()): Headers {
  securityHeaders(headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return headers;
}

function json(body: unknown, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return Response.json(body, { status, headers });
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

function validateAccessConfig(env: Env): void {
  if (
    !env.TEAM_DOMAIN?.startsWith("https://") ||
    env.TEAM_DOMAIN.includes("REPLACE-ME") ||
    !env.POLICY_AUD ||
    env.POLICY_AUD.startsWith("REPLACE_")
  ) {
    throw new RequestError(503, "Access configuration is incomplete.");
  }
}

async function authenticatedEmail(
  request: Request,
  env: Env,
): Promise<string> {
  validateAccessConfig(env);

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    throw new RequestError(403, "Authentication required.");
  }

  try {
    const jwks = createRemoteJWKSet(
      new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`),
    );
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });

    if (typeof payload.email !== "string" || !payload.email.trim()) {
      throw new RequestError(403, "Authenticated identity has no email.");
    }

    return payload.email.trim().toLowerCase();
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(403, "Invalid authentication token.");
  }
}

async function studentForEmailOrNull(
  email: string,
  env: Env,
): Promise<StudentRow | null> {
  return env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE email = ?1 COLLATE NOCASE
        AND enabled = 1
      LIMIT 1`,
  )
    .bind(email)
    .first<StudentRow>();
}

async function studentForEmail(
  email: string,
  env: Env,
): Promise<StudentRow> {
  const student = await studentForEmailOrNull(email, env);
  if (!student) {
    throw new RequestError(403, "This account is not assigned to a student.");
  }
  return student;
}

async function studentForId(
  id: string,
  env: Env,
): Promise<StudentRow> {
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE id = ?1
        AND enabled = 1
      LIMIT 1`,
  )
    .bind(id)
    .first<StudentRow>();

  if (!student) {
    throw new RequestError(404, "Student was not found.");
  }

  return student;
}

async function authenticatedPrincipal(
  request: Request,
  env: Env,
): Promise<Principal> {
  const email = await authenticatedEmail(request, env);
  const student = await studentForEmailOrNull(email, env);

  if (student) {
    return { email, student, isAdmin: false };
  }

  const administrator = await env.DB.prepare(
    `SELECT email
       FROM portal_admins
      WHERE email = ?1 COLLATE NOCASE
        AND enabled = 1
      LIMIT 1`,
  )
    .bind(email)
    .first<{ email: string }>();

  if (!administrator) {
    throw new RequestError(403, "This account is not authorized for the student portal.");
  }

  return { email, student: null, isAdmin: true };
}

async function authenticatedStudent(
  request: Request,
  env: Env,
): Promise<StudentRow> {
  const email = await authenticatedEmail(request, env);
  return studentForEmail(email, env);
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

async function selectedAdminStudent(
  request: Request,
  env: Env,
): Promise<StudentRow> {
  const id = cookieValue(request, ADMIN_STUDENT_COOKIE);
  if (!id) {
    throw new RequestError(400, "Select a student from the administrator overview.");
  }
  return studentForId(id, env);
}

async function profileForStudent(
  student: StudentRow,
  env: Env,
  adminView = false,
): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT payload_json
       FROM student_profiles
      WHERE student_id = ?1
      LIMIT 1`,
  )
    .bind(student.id)
    .first<ProfileRow>();

  if (!row) {
    throw new RequestError(404, "Student profile was not found.");
  }

  let profile: Record<string, unknown>;
  try {
    profile = JSON.parse(row.payload_json) as Record<string, unknown>;
  } catch {
    throw new RequestError(500, "Student profile data is invalid.");
  }

  return json({ ...profile, studentId: student.id, adminView });
}

async function profileResponse(
  request: Request,
  env: Env,
  allowAdmin = false,
): Promise<Response> {
  if (!allowAdmin) {
    const student = await authenticatedStudent(request, env);
    return profileForStudent(student, env, false);
  }

  const principal = await authenticatedPrincipal(request, env);
  if (principal.student) {
    return profileForStudent(principal.student, env, false);
  }

  const student = await selectedAdminStudent(request, env);
  return profileForStudent(student, env, true);
}

function requestForAsset(request: Request, pathname: string): Request {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = "";
  return new Request(assetUrl.toString(), request);
}

async function protectedAsset(
  request: Request,
  env: Env,
  pathname = new URL(request.url).pathname,
): Promise<Response> {
  const response = await env.ASSETS.fetch(requestForAsset(request, pathname));
  const headers = privateHeaders(new Headers(response.headers));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withAdminStudentCookie(response: Response, studentId: string): Response {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    `${ADMIN_STUDENT_COOKIE}=${encodeURIComponent(studentId)}; Path=${PORTAL_PREFIX}/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function adminStudentRedirect(studentId: string): Response {
  const headers = privateHeaders();
  headers.set("Location", `${PORTAL_PREFIX}/`);
  return withAdminStudentCookie(
    new Response(null, { status: 302, headers }),
    studentId,
  );
}

async function materialResponse(
  request: Request,
  env: Env,
  portalPrefixed: boolean,
  allowAdmin = false,
): Promise<Response> {
  const principal = allowAdmin
    ? await authenticatedPrincipal(request, env)
    : { email: "", student: await authenticatedStudent(request, env), isAdmin: false };

  const student = principal.student || (allowAdmin
    ? await selectedAdminStudent(request, env)
    : null);

  if (!student) {
    throw new RequestError(403, "Student access is required.");
  }

  const pathname = new URL(request.url).pathname;
  const materialPath = portalPrefixed
    ? pathname.slice(PORTAL_PREFIX.length)
    : pathname;
  const match = materialPath.match(/^\/Materials\/([^/]+)\//i);

  if (!match) {
    throw new RequestError(404, "Material was not found.");
  }

  const requestedPath = decodeURIComponent(match[1]).toLowerCase();
  if (requestedPath !== student.material_path.toLowerCase()) {
    throw new RequestError(403, "This material belongs to another account.");
  }

  return protectedAsset(request, env, materialPath);
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

async function adminLandingResponse(
  request: Request,
  env: Env,
): Promise<Response> {
  const principal = await authenticatedPrincipal(request, env);
  if (!principal.isAdmin) {
    throw new RequestError(403, "Administrator access is required.");
  }

  const result = await env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE enabled = 1
      ORDER BY display_name COLLATE NOCASE`,
  ).all<StudentRow>();
  const students = result.results || [];

  const cards = students.length
    ? students.map((student) => `
        <a class="student-card" href="${PORTAL_PREFIX}/admin/view/${encodeURIComponent(student.id)}">
          <strong>${escapeHtml(student.display_name)}</strong>
          <span>Otevřít studentskou zónu</span>
        </a>
      `).join("")
    : `<p class="empty">V databázi nejsou žádní aktivní studenti.</p>`;

  return html(`<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Administrace | Studentský portál</title>
  <style>
    :root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#102a43;background:#f4f7fb}
    *{box-sizing:border-box}body{margin:0}.wrap{width:min(920px,calc(100% - 32px));margin:0 auto;padding:56px 0}
    .top{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:28px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#2563eb}
    h1{margin:6px 0 8px;font-size:clamp(28px,5vw,44px);letter-spacing:-.04em}.copy{margin:0;color:#627d98}.logout{color:#334e68;text-decoration:none;font-weight:700}
    .notice{margin:24px 0;padding:14px 16px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;color:#1e3a5f;font-size:14px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.student-card{display:flex;min-height:120px;padding:20px;flex-direction:column;justify-content:center;border:1px solid #d9e2ec;border-radius:16px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .student-card:hover{border-color:#93c5fd;transform:translateY(-2px)}.student-card strong{font-size:19px}.student-card span{margin-top:7px;color:#2563eb;font-size:14px;font-weight:700}.empty{padding:20px;background:#fff;border-radius:14px}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="top">
      <div><div class="eyebrow">Administrátor</div><h1>Studentské zóny</h1><p class="copy">Vyber studenta, jehož portál chceš zkontrolovat.</p></div>
      <a class="logout" href="/cdn-cgi/access/logout">Odhlásit</a>
    </div>
    <div class="notice">Administrátorský náhled je read-only vůči D1. Změny checkboxů úkolů se ukládají pouze lokálně v tomto prohlížeči.</div>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`);
}

async function mainDomainPortal(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (url.pathname === "/student-portal.html") {
    return Response.redirect("https://vojtechsteidl.eu/student-portal/", 302);
  }

  if (url.pathname === PORTAL_PREFIX) {
    return Response.redirect("https://vojtechsteidl.eu/student-portal/", 302);
  }

  if (
    url.pathname === `${PORTAL_PREFIX}/admin` ||
    url.pathname === `${PORTAL_PREFIX}/admin/`
  ) {
    return adminLandingResponse(request, env);
  }

  const adminViewMatch = url.pathname.match(
    new RegExp(`^${PORTAL_PREFIX}/admin/view/([^/]+)$`),
  );
  if (adminViewMatch) {
    const principal = await authenticatedPrincipal(request, env);
    if (!principal.isAdmin) {
      throw new RequestError(403, "Administrator access is required.");
    }

    const studentId = decodeURIComponent(adminViewMatch[1]);
    const student = await studentForId(studentId, env);
    return adminStudentRedirect(student.id);
  }

  if (url.pathname === `${PORTAL_PREFIX}/`) {
    const principal = await authenticatedPrincipal(request, env);
    if (principal.student) {
      return protectedAsset(request, env, "/student-portal.html");
    }

    const selectedId = cookieValue(request, ADMIN_STUDENT_COOKIE);
    if (!selectedId) {
      return adminLandingResponse(request, env);
    }

    await studentForId(selectedId, env);
    return protectedAsset(request, env, "/student-portal.html");
  }

  if (url.pathname === `${PORTAL_PREFIX}/api/profile`) {
    if (request.method !== "GET") return plain("Method not allowed", 405);
    return profileResponse(request, env, true);
  }

  if (url.pathname.startsWith(`${PORTAL_PREFIX}/api/`)) {
    return plain("Not found", 404);
  }

  if (new RegExp(`^${PORTAL_PREFIX}/Materials/`, "i").test(url.pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return plain("Method not allowed", 405);
    }
    return materialResponse(request, env, true, true);
  }

  if (url.pathname.startsWith(`${PORTAL_PREFIX}/assets/student-`)) {
    await authenticatedPrincipal(request, env);
    const assetPath = url.pathname.slice(PORTAL_PREFIX.length);
    return protectedAsset(request, env, assetPath);
  }

  return plain("Not found", 404);
}

async function legacyPortalHost(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (url.pathname === "/" || url.pathname === "/student-portal.html") {
    return Response.redirect("https://vojtechsteidl.eu/student-portal/", 302);
  }

  if (url.pathname.startsWith("/students/")) {
    return plain("Not found", 404);
  }

  if (url.pathname === "/api/profile") {
    if (request.method !== "GET") return plain("Method not allowed", 405);
    return profileResponse(request, env, false);
  }

  if (url.pathname.startsWith("/api/")) {
    return plain("Not found", 404);
  }

  if (/^\/Materials\//i.test(url.pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return plain("Method not allowed", 405);
    }
    return materialResponse(request, env, false, false);
  }

  if (url.pathname.startsWith("/assets/student-")) {
    await authenticatedStudent(request, env);
    return protectedAsset(request, env);
  }

  return plain("Not found", 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (MAIN_HOSTS.has(url.hostname) && url.pathname.startsWith(PORTAL_PREFIX)) {
        return mainDomainPortal(request, env, url);
      }

      if (url.hostname === PORTAL_HOST) {
        return legacyPortalHost(request, env, url);
      }

      return plain("Not found", 404);
    } catch (error) {
      if (error instanceof RequestError) {
        console.warn(
          JSON.stringify({
            event: "request_denied",
            status: error.status,
            path: url.pathname,
          }),
        );
        return plain(
          error.status >= 500 ? "Service unavailable" : error.message,
          error.status,
        );
      }

      console.error(
        JSON.stringify({
          event: "unexpected_error",
          path: url.pathname,
        }),
      );
      return plain("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
