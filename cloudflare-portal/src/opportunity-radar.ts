import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const OPPORTUNITY_RADAR_PATH = "/student-portal/admin/opportunities";

const TUTORING_LEADS_PATH = "/student-portal/admin/tutoring/leads/";
const EU_OPPORTUNITIES_PATH = "/student-portal/admin/opportunities/eu/";

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function html(body: string, status = 200): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  return new Response(body, { status, headers });
}

function plain(body: string, status: number): Response {
  const headers = privateHeaders();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(body, { status, headers });
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

type CountRow = { count: number };

async function counts(env: Env): Promise<{ tutoring: number; tutoringHot: number; eu: number; euHigh: number }> {
  const [tutoring, tutoringHot, eu, euHigh] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE status IN ('new','reviewed')").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE status IN ('new','reviewed') AND score >= 65").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM eu_opportunities WHERE status IN ('new','reviewed')").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM eu_opportunities WHERE status IN ('new','reviewed') AND score >= 75").first<CountRow>(),
  ]);
  return {
    tutoring: Number(tutoring?.count || 0),
    tutoringHot: Number(tutoringHot?.count || 0),
    eu: Number(eu?.count || 0),
    euHigh: Number(euHigh?.count || 0),
  };
}

function render(data: Awaited<ReturnType<typeof counts>>, email: string): Response {
  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Opportunity Radar</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--mint:#9ee8ca;--mint-soft:#dff7ed;--blue:#e5eef3;--amber:#f6edce;--shadow:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background-color:var(--paper);background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(1180px,calc(100% - 32px));margin:24px auto 60px}.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}.top h1{font-size:clamp(38px,6vw,70px);line-height:.96;letter-spacing:-.055em;margin:9px 0 8px}.top p{margin:0;color:var(--muted);max-width:720px;line-height:1.55}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:12px;box-shadow:var(--shadow)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:24px}.card{background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:24px;padding:20px;box-shadow:var(--shadow)}.card h2{margin:0 0 6px;font-size:22px;letter-spacing:-.03em}.card p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}.meta{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.pill{padding:5px 8px;border-radius:99px;font-size:10px;font-weight:900;background:var(--surface-2);color:#5f615a}.pill.live{background:var(--mint-soft);color:#347c61}.pill.manual{background:var(--amber);color:#725d1f}.pill.blue{background:var(--blue);color:#4f7187}.stats{display:flex;gap:14px;margin:14px 0}.stat strong{display:block;font-size:26px;letter-spacing:-.04em}.stat span{font-size:10px;color:var(--muted);font-weight:800}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.actions a.primary{background:var(--mint);border-color:#83dcb9}.section{margin-top:28px}.section h3{font-size:14px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.1em;color:#557765}.channels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.channel{background:rgba(251,250,246,.9);border:1px solid var(--line);border-radius:18px;padding:15px}.channel strong{display:block;margin-bottom:4px}.channel p{font-size:11px;color:var(--muted);line-height:1.5;margin:0 0 10px}.account{margin-top:26px;text-align:right;color:var(--muted);font-size:10px}@media(max-width:820px){.grid,.channels{grid-template-columns:1fr}.top{flex-direction:column}.top h1{font-size:46px}}
  </style>
</head>
<body>
<main class="shell">
  <header class="top">
    <div><div class="eyebrow">Personal acquisition system</div><h1>Opportunity Radar</h1><p>Jedno místo pro příležitosti, které mají dobrý poměr výnos / čas / pravděpodobnost. Automatizujeme jen zdroje, kde je to technicky a smluvně bezpečné; zbytek používá připravené alerty a rychlé vstupy.</p></div>
    <a class="button" href="/student-portal/admin/tutoring/">← Tutoring OS</a>
  </header>

  <section class="grid">
    <article class="card">
      <h2>Tutoring</h2><p>České a postupně i mezinárodní poptávky na matematiku a fyziku.</p>
      <div class="meta"><span class="pill live">AUTO · 5 min</span><span class="pill blue">Doučuji.eu</span></div>
      <div class="stats"><div class="stat"><strong>${esc(data.tutoring)}</strong><span>aktivní</span></div><div class="stat"><strong>${esc(data.tutoringHot)}</strong><span>score ≥ 65</span></div></div>
      <div class="actions"><a class="button primary" href="${TUTORING_LEADS_PATH}">Otevřít leady</a></div>
    </article>

    <article class="card">
      <h2>EU Expert / Evaluator</h2><p>Independent expert, evaluator, monitoring a advisory opportunities z oficiálních EU zdrojů.</p>
      <div class="meta"><span class="pill live">AUTO · 6 h</span><span class="pill blue">EU · CINEA · REA · ERC</span></div>
      <div class="stats"><div class="stat"><strong>${esc(data.eu)}</strong><span>aktivní</span></div><div class="stat"><strong>${esc(data.euHigh)}</strong><span>score ≥ 75</span></div></div>
      <div class="actions"><a class="button primary" href="${EU_OPPORTUNITIES_PATH}">Otevřít EU opportunities</a></div>
    </article>

    <article class="card">
      <h2>Industry Expert Networks</h2><p>Krátké placené konzultace a research calls. Příležitosti jsou neveřejné, takže nejvyšší hodnotu má kvalitní registrace a rychlá reakce na invitation.</p>
      <div class="meta"><span class="pill manual">PROFILE-BASED</span><span class="pill blue">GLG · Guidepoint · AlphaSights</span></div>
      <div class="actions">
        <a class="button primary" target="_blank" rel="noopener noreferrer" href="https://glginsights.com/network-members/">GLG ↗</a>
        <a class="button" target="_blank" rel="noopener noreferrer" href="https://www.guidepoint.com/advisors/">Guidepoint ↗</a>
        <a class="button" target="_blank" rel="noopener noreferrer" href="https://www.alphasights.com/experts/">AlphaSights ↗</a>
      </div>
    </article>

    <article class="card">
      <h2>Contract / Part-time Jobs</h2><p>Remote nebo částečné technické PM, programme management, automotive, manufacturing, mobility a energy role.</p>
      <div class="meta"><span class="pill manual">ALERT-BASED</span><span class="pill blue">LinkedIn · EURES</span></div>
      <div class="actions">
        <a class="button primary" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/jobs/search/?keywords=technical%20project%20manager%20contract%20remote">LinkedIn search ↗</a>
        <a class="button" target="_blank" rel="noopener noreferrer" href="https://eures.europa.eu/index_en">EURES ↗</a>
      </div>
    </article>
  </section>

  <section class="section">
    <h3>EU business / tender radar</h3>
    <div class="channels">
      <article class="channel"><strong>TED · EU tenders</strong><p>Veřejné zakázky pro technical assistance, consultancy, project management, transport, energy a industry.</p><a class="button" target="_blank" rel="noopener noreferrer" href="https://ted.europa.eu/en/">Otevřít TED ↗</a></article>
      <article class="channel"><strong>Research / advisory</strong><p>Hledej paid industry interviews, surveys a advisory requests související s automotive a manufacturing.</p><span class="pill manual">Přidáme po ověření zdroje</span></article>
      <article class="channel"><strong>International tutoring</strong><p>UK/IE/Canada acquisition. Superprof UK profil je externí kanál; další marketplace feedy připojíme jen tam, kde jsou veřejné a povolené.</p><span class="pill manual">CHANNEL READY</span></article>
    </div>
  </section>

  <div class="account">${esc(email)}</div>
</main>
</body>
</html>`);
}

export async function handleOpportunityRadarRequest(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  try {
    if (url.pathname === OPPORTUNITY_RADAR_PATH) return Response.redirect(`${OPPORTUNITY_RADAR_PATH}/`, 302);
    if (url.pathname !== `${OPPORTUNITY_RADAR_PATH}/`) return null;
    if (request.method !== "GET") return plain("Method not allowed", 405);
    const email = await requireAdmin(request, env);
    return render(await counts(env), email);
  } catch (error) {
    if (error instanceof PortalError) return plain(error.status >= 500 ? "Service unavailable" : error.message, error.status);
    console.error(JSON.stringify({ event: "opportunity_radar_error", message: error instanceof Error ? error.message : "unknown" }));
    return plain("Internal server error", 500);
  }
}

export async function addOpportunityRadarLink(response: Response): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes(`${OPPORTUNITY_RADAR_PATH}/`)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const marker = '<div class="top-actions">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const updated = body.replace(marker, `${marker}<a class="button" href="${OPPORTUNITY_RADAR_PATH}/">Opportunity Radar</a>`);
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}
