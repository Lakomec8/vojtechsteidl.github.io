import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const OPPORTUNITY_RADAR_PATH = "/student-portal/admin/opportunities";

const TUTORING_LEADS_PATH = "/student-portal/admin/tutoring/leads/";
const EU_OPPORTUNITIES_PATH = "/student-portal/admin/opportunities/eu/";

type CountRow = { count: number };
type TutoringResponseRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  source_url: string;
  score: number;
  draft_text: string | null;
};
type EuResponseRow = {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_label: string;
  score: number;
};

type RadarData = {
  tutoring: number;
  tutoringHot: number;
  eu: number;
  euHigh: number;
  tutoringResponses: TutoringResponseRow[];
  euResponses: EuResponseRow[];
};

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
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
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

async function radarData(env: Env): Promise<RadarData> {
  const [tutoring, tutoringHot, eu, euHigh, tutoringResponses, euResponses] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE status IN ('new','reviewed')").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE status IN ('new','reviewed') AND score >= 65").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM eu_opportunities WHERE status IN ('new','reviewed')").first<CountRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM eu_opportunities WHERE status IN ('new','reviewed') AND score >= 75").first<CountRow>(),
    env.DB.prepare(`SELECT l.id, l.title, l.description, l.subject, l.source_url, l.score, d.draft_text
      FROM tutoring_leads l
      LEFT JOIN tutoring_lead_drafts d ON d.lead_id = l.id
      WHERE l.status IN ('new','reviewed') AND l.score >= 65
      ORDER BY l.score DESC, datetime(l.first_seen_at) DESC
      LIMIT 4`).all<TutoringResponseRow>(),
    env.DB.prepare(`SELECT id, title, summary, source_url, source_label, score
      FROM eu_opportunities
      WHERE status IN ('new','reviewed') AND score >= 75
      ORDER BY score DESC, datetime(first_seen_at) DESC
      LIMIT 4`).all<EuResponseRow>(),
  ]);

  return {
    tutoring: Number(tutoring?.count || 0),
    tutoringHot: Number(tutoringHot?.count || 0),
    eu: Number(eu?.count || 0),
    euHigh: Number(euHigh?.count || 0),
    tutoringResponses: tutoringResponses.results || [],
    euResponses: euResponses.results || [],
  };
}

function tutoringResponseCard(row: TutoringResponseRow): string {
  const draft = row.draft_text || "Draft se vytvoří automaticky po dosažení auto-draft threshold.";
  return `<article class="response-card">
    <div class="response-head"><div><span class="source">Tutoring · ${esc(row.subject || "Matematika / fyzika")}</span><h3>${esc(row.title)}</h3></div><strong class="score">${esc(row.score)}</strong></div>
    <p>${esc(row.description).slice(0, 420)}</p>
    <div class="policy"><span class="pill live">AUTO-DRAFT</span><span class="pill">Manual send</span></div>
    <div class="draft-text" data-draft>${esc(draft)}</div>
    <div class="actions"><button class="button copy" type="button" data-copy>Kopírovat draft</button><a class="button primary" target="_blank" rel="noopener noreferrer" href="${esc(row.source_url)}">Otevřít a odpovědět ↗</a></div>
  </article>`;
}

function euResponseCard(row: EuResponseRow): string {
  return `<article class="response-card">
    <div class="response-head"><div><span class="source">EU · ${esc(row.source_label)}</span><h3>${esc(row.title)}</h3></div><strong class="score">${esc(row.score)}</strong></div>
    <p>${esc(row.summary).slice(0, 420)}</p>
    <div class="policy"><span class="pill blue">AUTO-PREPARE</span><span class="pill">Profile / EOI</span></div>
    <div class="draft-text">Neodesílat automaticky. Otevři opportunity a použij profil/CV cílený na automotive, manufacturing, mobility, project management, applied physics a risk management.</div>
    <div class="actions"><a class="button primary" target="_blank" rel="noopener noreferrer" href="${esc(row.source_url)}">Otevřít opportunity ↗</a><a class="button" href="${EU_OPPORTUNITIES_PATH}">EU board</a></div>
  </article>`;
}

function render(data: RadarData, email: string): Response {
  const responseCards = [
    ...data.tutoringResponses.map(tutoringResponseCard),
    ...data.euResponses.map(euResponseCard),
  ].join("") || `<article class="empty">Teď není žádná high-fit opportunity, která by vyžadovala reakci.</article>`;

  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Opportunity Radar</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--mint:#9ee8ca;--mint-soft:#dff7ed;--blue:#e5eef3;--amber:#f6edce;--shadow:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background-color:var(--paper);background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(1180px,calc(100% - 32px));margin:24px auto 60px}.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}.top h1{font-size:clamp(38px,6vw,70px);line-height:.96;letter-spacing:-.055em;margin:9px 0 8px}.top p{margin:0;color:var(--muted);max-width:760px;line-height:1.55}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:12px;box-shadow:var(--shadow);cursor:pointer}.button.primary{background:var(--mint);border-color:#83dcb9}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:24px}.card{background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:24px;padding:20px;box-shadow:var(--shadow)}.card h2{margin:0 0 6px;font-size:22px;letter-spacing:-.03em}.card p,.response-card p{margin:0;color:var(--muted);font-size:12px;line-height:1.55}.meta,.policy{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.pill{padding:5px 8px;border-radius:99px;font-size:10px;font-weight:900;background:var(--surface-2);color:#5f615a}.pill.live{background:var(--mint-soft);color:#347c61}.pill.manual{background:var(--amber);color:#725d1f}.pill.blue{background:var(--blue);color:#4f7187}.stats{display:flex;gap:14px;margin:14px 0}.stat strong{display:block;font-size:26px;letter-spacing:-.04em}.stat span{font-size:10px;color:var(--muted);font-weight:800}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.section{margin-top:30px}.section-title{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;margin-bottom:12px}.section h2{font-size:28px;letter-spacing:-.04em;margin:0}.section-title p{font-size:11px;color:var(--muted);max-width:620px;margin:0}.response-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.response-card,.empty{background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:20px;padding:17px;box-shadow:var(--shadow)}.response-head{display:flex;justify-content:space-between;gap:12px}.source{display:block;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#557765;margin-bottom:5px}.response-head h3{margin:0;font-size:16px;line-height:1.25}.score{font-size:28px;letter-spacing:-.05em}.draft-text{white-space:pre-wrap;padding:11px 12px;border-radius:13px;background:#f0f5f1;border:1px solid #d5e4dc;font-size:11px;line-height:1.55;color:#424940}.channels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.channel{background:rgba(251,250,246,.9);border:1px solid var(--line);border-radius:18px;padding:15px}.channel strong{display:block;margin-bottom:4px}.channel p{font-size:11px;color:var(--muted);line-height:1.5;margin:0 0 10px}.account{margin-top:26px;text-align:right;color:var(--muted);font-size:10px}@media(max-width:820px){.grid,.response-grid,.channels{grid-template-columns:1fr}.top{flex-direction:column}.top h1{font-size:46px}.section-title{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
<main class="shell">
  <header class="top">
    <div><div class="eyebrow">Personal acquisition system</div><h1>Opportunity Radar</h1><p>Jedno místo pro nalezení příležitosti i přípravu reakce. Bezpečné kanály automatizujeme, platformové odpovědi zůstávají jako one-click draft + open.</p></div>
    <a class="button" href="/student-portal/admin/tutoring/">← Tutoring OS</a>
  </header>

  <section class="section">
    <div class="section-title"><div><div class="eyebrow">Response Engine</div><h2>Vyžaduje reakci</h2></div><p>High-fit opportunity nahoře. Cíl: nehlídat zdroje ručně; jen zpracovat několik připravených reakcí.</p></div>
    <div class="response-grid">${responseCards}</div>
  </section>

  <section class="grid">
    <article class="card"><h2>Tutoring</h2><p>České a postupně i mezinárodní poptávky na matematiku a fyziku.</p><div class="meta"><span class="pill live">AUTO · 5 min</span><span class="pill blue">Doučuji.eu</span></div><div class="stats"><div class="stat"><strong>${esc(data.tutoring)}</strong><span>aktivní</span></div><div class="stat"><strong>${esc(data.tutoringHot)}</strong><span>score ≥ 65</span></div></div><div class="actions"><a class="button primary" href="${TUTORING_LEADS_PATH}">Otevřít leady</a></div></article>
    <article class="card"><h2>EU Expert / Evaluator</h2><p>Independent expert, evaluator, monitoring a advisory opportunities z oficiálních EU zdrojů.</p><div class="meta"><span class="pill live">AUTO · 6 h</span><span class="pill blue">EU · CINEA · REA · ERC</span></div><div class="stats"><div class="stat"><strong>${esc(data.eu)}</strong><span>aktivní</span></div><div class="stat"><strong>${esc(data.euHigh)}</strong><span>score ≥ 75</span></div></div><div class="actions"><a class="button primary" href="${EU_OPPORTUNITIES_PATH}">Otevřít EU opportunities</a></div></article>
    <article class="card"><h2>Industry Expert Networks</h2><p>GLG, Guidepoint, AlphaSights: invitation e-maily budou vhodný vstup do automatického inbox agenta.</p><div class="meta"><span class="pill manual">EMAIL-BASED</span><span class="pill blue">Draft + notify</span></div><div class="actions"><a class="button primary" target="_blank" rel="noopener noreferrer" href="https://glginsights.com/network-members/">GLG ↗</a><a class="button" target="_blank" rel="noopener noreferrer" href="https://www.guidepoint.com/advisors/">Guidepoint ↗</a></div></article>
    <article class="card"><h2>Contract / Part-time Jobs</h2><p>Remote nebo částečné technical PM, programme management, automotive, manufacturing, mobility a energy role.</p><div class="meta"><span class="pill manual">ALERT-BASED</span><span class="pill blue">LinkedIn · EURES</span></div><div class="actions"><a class="button primary" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/jobs/search/?keywords=technical%20project%20manager%20contract%20remote">LinkedIn search ↗</a><a class="button" target="_blank" rel="noopener noreferrer" href="https://eures.europa.eu/index_en">EURES ↗</a></div></article>
  </section>

  <section class="section"><div class="section-title"><h2>Další kanály</h2></div><div class="channels"><article class="channel"><strong>TED · EU tenders</strong><p>Technical assistance, consultancy, project management, transport, energy a industry.</p><a class="button" target="_blank" rel="noopener noreferrer" href="https://ted.europa.eu/en/">Otevřít TED ↗</a></article><article class="channel"><strong>Research / advisory</strong><p>Paid industry interviews, surveys a advisory requests související s automotive a manufacturing.</p><span class="pill manual">EMAIL / PUBLIC SOURCES</span></article><article class="channel"><strong>International tutoring</strong><p>UK/IE/Canada acquisition; preference pro veřejné a povolené lead feeds nebo nativní alerts.</p><span class="pill manual">CHANNEL READY</span></article></div></section>

  <div class="account">${esc(email)}</div>
</main>
<script>document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{const card=button.closest('.response-card');const text=card?.querySelector('[data-draft]')?.textContent||'';if(!text)return;const original=button.textContent;try{await navigator.clipboard.writeText(text);button.textContent='Zkopírováno';setTimeout(()=>button.textContent=original,1400)}catch{button.textContent='Kopírování selhalo'}}));</script>
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
    return render(await radarData(env), email);
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
