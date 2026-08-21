import worker from "./index";

const MAIN_HOSTS = new Set(["vojtechsteidl.eu", "www.vojtechsteidl.eu"]);
const PORTAL_ROOT = "/student-portal/";
const ADMIN_STUDENT_COOKIE = "portal_admin_student";
const ADMIN_VIEW_COOKIE = "portal_admin_view_once";

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
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
  const headers = new Headers({
    Location: "https://vojtechsteidl.eu/student-portal/",
    "Cache-Control": "private, no-store, max-age=0",
  });
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!MAIN_HOSTS.has(url.hostname)) {
      return worker.fetch(request, env);
    }

    // Cloudflare Access may occasionally preserve the wildcard literally in a
    // post-login destination. Normalize it to the real portal URL.
    if (url.pathname === "/student-portal*") {
      return redirectToPortal(true);
    }

    const adminViewPath = /^\/student-portal\/admin\/view\/[^/]+$/;
    if (adminViewPath.test(url.pathname)) {
      return withOneTimeAdminView(await worker.fetch(request, env));
    }

    if (url.pathname === PORTAL_ROOT) {
      const selectedStudent = cookieValue(request, ADMIN_STUDENT_COOKIE);
      const oneTimeAdminView = cookieValue(request, ADMIN_VIEW_COOKIE);

      // A persisted admin selection must never hijack a fresh visit to the
      // portal root. Clear it once, then let the underlying Worker decide
      // whether the current identity is a student or the administrator.
      if (selectedStudent && !oneTimeAdminView) {
        return redirectToPortal(true);
      }

      const response = await worker.fetch(request, env);
      return oneTimeAdminView ? clearOneTimeAdminView(response) : response;
    }

    return worker.fetch(request, env);
  },
} satisfies ExportedHandler<Env>;
