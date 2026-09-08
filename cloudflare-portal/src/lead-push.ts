import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const LEAD_PUSH_APP_PATH = "/student-portal/admin/tutoring/leads/push";
export const LEAD_PUSH_TEST_API_PATH = "/student-portal/api/admin/tutoring/leads/push/test";

const NTFY_BASE_URL = "https://ntfy.sh";
const ALERT_THRESHOLD = 65;

type LeadPushSettings = {
  topic: string;
  started_at: string;
  last_test_at: string | null;
};

type PendingLead = {
  id: string;
  subject: string;
  title: string;
  description: string;
  source_url: string;
  score: number;
};

function headers(contentType: string): Headers {
  const result = privateHeaders();
  result.set("Content-Type", contentType);
  return result;
}

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function randomTopic(): string {
  const first = crypto.randomUUID().replace(/-/g, "");
  const second = crypto.randomUUID().replace(/-/g, "").slice(0, 22);
  return `lead-${first}${second}`;
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

export async function ensureLeadPushChannel(env: Env): Promise<LeadPushSettings> {
  const existing = await env.DB.prepare(
    "SELECT topic, started_at, last_test_at FROM tutoring_lead_push_settings WHERE id = 1",
  ).first<LeadPushSettings>();
  if (existing) return existing;

  const topic = randomTopic();
  const startedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT OR IGNORE INTO tutoring_lead_push_settings (id, topic, started_at)
                        VALUES (1, ?1, ?2)`)
    .bind(topic, startedAt)
    .run();

  const created = await env.DB.prepare(
    "SELECT topic, started_at, last_test_at FROM tutoring_lead_push_settings WHERE id = 1",
  ).first<LeadPushSettings>();
  if (!created) throw new Error("Lead push channel could not be initialized.");
  return created;
}

async function publish(
  topic: string,
  title: string,
  body: string,
  clickUrl?: string,
  highPriority = false,
): Promise<boolean> {
  const requestHeaders: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Title": title,
    "Priority": highPriority ? "high" : "default",
    "Tags": "dart,tutor",
  };
  if (clickUrl) requestHeaders.Click = clickUrl;

  try {
    const response = await fetch(`${NTFY_BASE_URL}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: requestHeaders,
      body: body.slice(0, 3900),
    });
    if (!response.ok) {
      console.error(JSON.stringify({ event: "lead_push_http_error", status: response.status }));
    }
    return response.ok;
  } catch (error) {
    console.error(JSON.stringify({
      event: "lead_push_network_error",
      message: error instanceof Error ? error.message : "unknown",
    }));
    return false;
  }
}

export async function runLeadPush(env: Env): Promise<{ sent: number; failed: number }> {
  const settings = await ensureLeadPushChannel(env);
  const pending = await env.DB.prepare(`SELECT id, subject, title, description, source_url, score
      FROM tutoring_leads
     WHERE score >= ?1
       AND alerted_at IS NULL
       AND status NOT IN ('ignored', 'lost')
       AND datetime(first_seen_at) >= datetime(?2)
     ORDER BY score DESC, datetime(first_seen_at) ASC
     LIMIT 20`)
    .bind(ALERT_THRESHOLD, settings.started_at)
    .all<PendingLead>();

  let sent = 0;
  let failed = 0;
  for (const lead of pending.results || []) {
    const body = `${lead.subject || "Doučování"} · ${lead.score}/100\n${lead.title}\n${lead.description.slice(0, 700)}`;
    const ok = await publish(
      settings.topic,
      `Lead Alert · ${lead.score}/100`,
      body,
      lead.source_url,
      lead.score >= 85,
    );
    if (ok) {
      sent += 1;
      await env.DB.prepare("UPDATE tutoring_leads SET alerted_at = ?2 WHERE id = ?1 AND alerted_at IS NULL")
        .bind(lead.id, new Date().toISOString())
        .run();
    } else {
      failed += 1;
    }
  }

  if (sent || failed) {
    console.log(JSON.stringify({ event: "lead_push_run", sent, failed }));
  }
  return { sent, failed };
}

function renderSettings(settings: LeadPushSettings, email: string): Response {
  const topicUrl = `${NTFY_BASE_URL}/${settings.topic}`;
  const appUrl = `${NTFY_BASE_URL}/app`;
  const responseHeaders = headers("text/html; charset=utf-8");
  responseHeaders.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );

  return new Response(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Lead Alert push</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#272823;background:#f2f0e9}*{box-sizing:border-box}body{margin:0;min-height:100vh;background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(780px,calc(100% - 28px));margin:32px auto}.card{background:#fbfaf6;border:1px solid #d5d2c8;border-radius:24px;padding:24px;box-shadow:0 18px 38px rgba(55,52,43,.12)}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}h1{font-size:42px;letter-spacing:-.045em;margin:7px 0 10px}p{color:#676960;line-height:1.55}.steps{display:grid;gap:10px;margin:22px 0}.step{padding:14px;border-radius:16px;background:#eeece4;border:1px solid #ddd9cf}.topic{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow-wrap:anywhere;background:#272823;color:#f7f5ee;border-radius:12px;padding:12px;margin-top:8px}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #d5d2c8;border-radius:999px;padding:10px 15px;color:#272823;background:#fbfaf6;text-decoration:none;font-weight:800;font-size:12px;cursor:pointer}.primary{background:#9ee8ca;border-color:#83dcb9}.muted{font-size:11px;color:#7a7b74;margin-top:18px}.status{margin-top:12px;font-size:12px;font-weight:800}.account{text-align:right;margin-top:18px;font-size:10px;color:#7a7b74}
  </style>
</head>
<body><main class="shell"><section class="card">
  <div class="eyebrow">Tutoring OS · Lead Alert</div><h1>Push upozornění</h1>
  <p>Kanál je vytvořený automaticky a není závislý na ChatGPT. Nové hot leady se do něj posílají při každé 5minutové kontrole.</p>
  <div class="steps">
    <div class="step"><strong>1. Otevři ntfy</strong><p>Na počítači můžeš použít webovou aplikaci, v telefonu aplikaci ntfy.</p><a class="button" href="${esc(appUrl)}" target="_blank" rel="noopener noreferrer">Otevřít ntfy ↗</a></div>
    <div class="step"><strong>2. Přidej tento topic</strong><div class="topic" id="topic">${esc(settings.topic)}</div><div class="actions"><button class="button" id="copy" type="button">Kopírovat topic</button><a class="button" href="${esc(topicUrl)}" target="_blank" rel="noopener noreferrer">Otevřít topic ↗</a></div></div>
    <div class="step"><strong>3. Otestuj push</strong><p>Po přihlášení k odběru klikni na test. Pokud má prohlížeč/aplikace povolené notifikace, zobrazí se testovací upozornění.</p><button class="button primary" id="test" type="button">Poslat testovací push</button><div class="status" id="status"></div></div>
  </div>
  <p class="muted">Topic je náhodně vygenerovaný a uložený jen v D1/adminu. Ber ho jako heslo: nesdílej ho veřejně. Ntfy.sh topic není privátní ACL; bezpečnost stojí na jeho neuhodnutelnosti.</p>
  <div class="actions"><a class="button" href="/student-portal/admin/tutoring/leads/">← Lead Alert</a></div>
  <div class="account">${esc(email)}</div>
</section></main>
<script>
  const topic=${JSON.stringify(settings.topic)};
  document.getElementById('copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(topic);document.getElementById('copy').textContent='Zkopírováno'}catch{document.getElementById('copy').textContent='Zkopíruj ručně'}});
  const test=document.getElementById('test'),status=document.getElementById('status');
  test?.addEventListener('click',async()=>{test.disabled=true;status.textContent='Odesílám…';try{const response=await fetch('${LEAD_PUSH_TEST_API_PATH}',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw new Error();status.textContent='Testovací push odeslán.'}catch{status.textContent='Test se nepodařilo odeslat.'}finally{test.disabled=false}});
</script>
</body></html>`, { status: 200, headers: responseHeaders });
}

async function testHandler(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: headers("text/plain; charset=utf-8") });
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return new Response("Missing request marker", { status: 403, headers: headers("text/plain; charset=utf-8") });

  const settings = await ensureLeadPushChannel(env);
  const ok = await publish(
    settings.topic,
    "Lead Alert · test",
    "Push kanál funguje. Nové relevantní poptávky z Doučuji.eu sem budou chodit automaticky.",
    "https://vojtechsteidl.eu/student-portal/admin/tutoring/leads/",
    true,
  );
  if (!ok) return Response.json({ ok: false }, { status: 502, headers: headers("application/json; charset=utf-8") });
  await env.DB.prepare("UPDATE tutoring_lead_push_settings SET last_test_at = ?1 WHERE id = 1")
    .bind(new Date().toISOString())
    .run();
  return Response.json({ ok: true }, { headers: headers("application/json; charset=utf-8") });
}

export async function handleLeadPushRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  try {
    if (url.pathname === LEAD_PUSH_APP_PATH) return Response.redirect(`${LEAD_PUSH_APP_PATH}/`, 302);
    if (url.pathname === `${LEAD_PUSH_APP_PATH}/`) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: headers("text/plain; charset=utf-8") });
      const email = await requireAdmin(request, env);
      return renderSettings(await ensureLeadPushChannel(env), email);
    }
    if (url.pathname === LEAD_PUSH_TEST_API_PATH) return testHandler(request, env);
    return null;
  } catch (error) {
    if (error instanceof PortalError) return new Response(error.status >= 500 ? "Service unavailable" : error.message, { status: error.status, headers: headers("text/plain; charset=utf-8") });
    console.error(JSON.stringify({ event: "lead_push_request_error", path: url.pathname, message: error instanceof Error ? error.message : "unknown" }));
    return new Response("Internal server error", { status: 500, headers: headers("text/plain; charset=utf-8") });
  }
}

export async function addLeadPushLink(response: Response): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes(`${LEAD_PUSH_APP_PATH}/`)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const marker = '<div class="top-actions">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const updated = body.replace(marker, `${marker}<a class="button" href="${LEAD_PUSH_APP_PATH}/">Zapnout push</a>`);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}
