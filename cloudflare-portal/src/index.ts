import { createRemoteJWKSet, jwtVerify } from "jose";

type StudentRow = {
  id: string;
  display_name: string;
  material_path: string;
};

type ProfileRow = {
  payload_json: string;
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

async function studentForEmail(
  email: string,
  env: Env,
): Promise<StudentRow> {
  const student = await env.DB.prepare(
    `SELECT id, display_name, material_path
       FROM students
      WHERE email = ?1 COLLATE NOCASE
        AND enabled = 1
      LIMIT 1`,
  )
    .bind(email)
    .first<StudentRow>();

  if (!student) {
    throw new RequestError(403, "This account is not assigned to a student.");
  }

  return student;
}

async function authenticatedStudent(
  request: Request,
  env: Env,
): Promise<StudentRow> {
  const email = await authenticatedEmail(request, env);
  return studentForEmail(email, env);
}

async function profileResponse(
  request: Request,
  env: Env,
): Promise<Response> {
  const student = await authenticatedStudent(request, env);
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

  return json({ ...profile, studentId: student.id });
}

function requestForAsset(request: Request, pathname: string): Request {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
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

async function materialResponse(
  request: Request,
  env: Env,
  portalPrefixed: boolean,
): Promise<Response> {
  const student = await authenticatedStudent(request, env);
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

  if (url.pathname === `${PORTAL_PREFIX}/`) {
    await authenticatedStudent(request, env);
    return protectedAsset(request, env, "/student-portal.html");
  }

  if (url.pathname === `${PORTAL_PREFIX}/api/profile`) {
    if (request.method !== "GET") return plain("Method not allowed", 405);
    return profileResponse(request, env);
  }

  if (url.pathname.startsWith(`${PORTAL_PREFIX}/api/`)) {
    return plain("Not found", 404);
  }

  if (new RegExp(`^${PORTAL_PREFIX}/Materials/`, "i").test(url.pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return plain("Method not allowed", 405);
    }
    return materialResponse(request, env, true);
  }

  if (url.pathname.startsWith(`${PORTAL_PREFIX}/assets/student-`)) {
    await authenticatedStudent(request, env);
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
    return profileResponse(request, env);
  }

  if (url.pathname.startsWith("/api/")) {
    return plain("Not found", 404);
  }

  if (/^\/Materials\//i.test(url.pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return plain("Method not allowed", 405);
    }
    return materialResponse(request, env, false);
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
