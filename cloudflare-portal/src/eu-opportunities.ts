import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const EU_OPPORTUNITIES_APP_PATH = "/student-portal/admin/opportunities/eu";
export const EU_OPPORTUNITIES_REFRESH_API_PATH = "/student-portal/api/admin/opportunities/eu/refresh";
export const EU_OPPORTUNITIES_STATUS_API_PATH = "/student-portal/api/admin/opportunities/eu/status";

const PRAGUE_TIME_ZONE = "Europe/Prague";
const HIGH_FIT_THRESHOLD = 75;

const SOURCE_PAGES = [
  {
    source: "eu-portal",
    sourceLabel: "EU Funding & Tenders",
    programme: "EU Expert Database",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/work-as-an-expert",
  },
  {
    source: "cinea",
    sourceLabel: "CINEA",
    programme: "CINEA expert campaigns",
    url: "https://cinea.ec.europa.eu/sign-eu-expert-evaluator_en",
  },
  {
    source: "cinea",
    sourceLabel: "CINEA",
    programme: "Horizon Europe · Climate, Energy & Mobility",
    url: "https://cinea.ec.europa.eu/programmes/horizon-europe/sign-expert-eu-research-projects_en",
  },
  {
    source: "cinea",
    sourceLabel: "CINEA",
    programme: "CEF Transport",
    url: "https://cinea.ec.europa.eu/sign-expert-cef-transport_en",
  },
  {
    source: "cinea",
    sourceLabel: "CINEA",
    programme: "LIFE Clean Energy Transition",
    url: "https://cinea.ec.europa.eu/programmes/life/clean-energy-transition/sign-expert-evaluate-life-clean-energy-transition-project-proposals_en",
  },
  {
    source: "rea",
    sourceLabel: "REA",
    programme: "Horizon Europe / EU research",
    url: "https://rea.ec.europa.eu/working-rea/work-expert_en",
  },
  {
    source: "erc",
    sourceLabel: "ERC",
    programme: "Independent observers",
    url: "https://erc.europa.eu/apply-grant/independent-observers",
  },
] as const;

type EuEnv = Env;

type Opportunity = {
  id: string;
  source: string;
  sourceLabel: string;
  title: string;
  summary: string;
  sourceUrl: string;
  programme: string;
  tags: string[];
  deadlineAt: string | null;
  isRemote: boolean;
  score: number;
};

type OpportunityRow = {
  id: string;
  source: string;
  source_label: string;
  title: string;
  summary: string;
  source_url: string;
  programme: string | null;
  tags: string;
  deadline_at: string | null;
  is_remote: number;
  score: number;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
};

type RunRow = {
  run_at: string;
  status: string;
  fetched_count: number;
  relevant_count: number;
  new_count: number;
  message: string | null;
};

export type EuOpportunityRunResult = {
  fetched: number;
  relevant: number;
  inserted: number;
  failures: number;
};

function responseHeaders(contentType: string): Headers {
  const headers = privateHeaders();
  headers.set("Content-Type", contentType);
  return headers;
}

function html(body: string, status = 200): Response {
  const headers = responseHeaders("text/html; charset=utf-8");
  headers.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  return new Response(body, { status, headers });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: responseHeaders("application/json; charset=utf-8") });
}

function plain(body: string, status: number): Response {
  return new Response(body, { status, headers: responseHeaders("text/plain; charset=utf-8") });
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

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    }
    return named[entity.toLowerCase()] ?? " ";
  });
}

function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h\d)\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stableId(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `eu:${(hash >>> 0).toString(16)}`;
}

function extractTitle(sourceHtml: string): string {
  const h1 = sourceHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripHtml(h1).slice(0, 220);
  const title = sourceHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return stripHtml(title || "EU expert opportunity").slice(0, 220);
}

function extractSummary(sourceHtml: string): string {
  const meta = sourceHtml.match(/<meta\s+[^>]*name=(?:"|')description(?:"|')[^>]*content=(?:"|')([^"']+)(?:"|')[^>]*>/i)?.[1]
    || sourceHtml.match(/<meta\s+[^>]*content=(?:"|')([^"']+)(?:"|')[^>]*name=(?:"|')description(?:"|')[^>]*>/i)?.[1];
  if (meta) return decodeEntities(meta).replace(/\s+/g, " ").trim().slice(0, 760);
  return stripHtml(sourceHtml).slice(0, 760);
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function extractDeadline(text: string): string | null {
  const patterns = [
    /(?:deadline(?:\s+to\s+apply)?|apply\s+by|register\s+by|sign\s+up\s+by)[^.!?]{0,120}?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i,
    /(?:ensure|make\s+sure)[^.!?]{0,80}?(?:sign\s+up|register|apply)\s+by\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const month = MONTHS[match[2].toLowerCase()];
    if (!month) continue;
    return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function isExpired(deadlineAt: string | null, now = new Date()): boolean {
  if (!deadlineAt) return false;
  const deadline = new Date(`${deadlineAt}T23:59:59Z`);
  return Number.isFinite(deadline.getTime()) && deadline.getTime() < now.getTime();
}

function scoreOpportunity(title: string, summary: string, fullText: string, deadlineAt: string | null): { score: number; tags: string[]; isRemote: boolean } {
  const text = normalize(`${title} ${summary} ${fullText}`);
  const tags = new Set<string>();
  let score = 35;

  if (/expert|evaluator|evaluation|monitor|observer/.test(text)) score += 12;
  if (/transport|mobility|vehicle|automotive|road safety|smart mobility|battery|batteries/.test(text)) {
    score += 25;
    tags.add("Transport / mobility");
  }
  if (/industry|industrial|manufactur|decarbonisation|decarbonization|clean technolog/.test(text)) {
    score += 16;
    tags.add("Industry");
  }
  if (/energy|electricity|hydrogen|renewable|grid|storage|heat pump/.test(text)) {
    score += 12;
    tags.add("Energy");
  }
  if (/horizon europe|research and innovation|research & innovation|\br&i\b|innovation/.test(text)) {
    score += 9;
    tags.add("R&I");
  }
  if (/risk management|risk analysis|project management|cost-benefit|cost benefit|financial analysis|economic analysis/.test(text)) {
    score += 10;
    tags.add("Project / risk");
  }
  if (/industry, business|industry and business|professionals working in industry|business associations/.test(text)) score += 5;

  const isRemote = /remote|home or place of work|work will be conducted remotely/.test(text);
  if (isRemote) {
    score += 8;
    tags.add("Remote");
  }

  if (deadlineAt && !isExpired(deadlineAt)) {
    const days = (new Date(`${deadlineAt}T23:59:59Z`).getTime() - Date.now()) / 86_400_000;
    if (days <= 90) score += 8;
    else score += 3;
  }
  if (isExpired(deadlineAt)) score -= 60;

  return { score: Math.max(1, Math.min(100, score)), tags: Array.from(tags), isRemote };
}

function parseOpportunity(source: typeof SOURCE_PAGES[number], sourceHtml: string): Opportunity {
  const title = extractTitle(sourceHtml);
  const fullText = stripHtml(sourceHtml).slice(0, 16_000);
  const summary = extractSummary(sourceHtml);
  const deadlineAt = extractDeadline(fullText);
  const scored = scoreOpportunity(title, summary, fullText, deadlineAt);
  return {
    id: stableId(source.url),
    source: source.source,
    sourceLabel: source.sourceLabel,
    title,
    summary,
    sourceUrl: source.url,
    programme: source.programme,
    tags: scored.tags,
    deadlineAt,
    isRemote: scored.isRemote,
    score: scored.score,
  };
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

async function recordRun(env: EuEnv, status: string, fetched: number, relevant: number, inserted: number, message: string | null): Promise<void> {
  await env.DB.prepare(`INSERT INTO eu_opportunity_runs
    (run_at, status, fetched_count, relevant_count, new_count, message)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
    .bind(new Date().toISOString(), status, fetched, relevant, inserted, message)
    .run();
}

export async function runEuOpportunityScan(env: EuEnv): Promise<EuOpportunityRunResult> {
  let fetched = 0;
  let relevant = 0;
  let inserted = 0;
  const failures: string[] = [];
  const seenAt = new Date().toISOString();

  for (const source of SOURCE_PAGES) {
    try {
      const response = await fetch(source.url, {
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "User-Agent": "VojtechSteidl-EUOpportunityMonitor/1.0 (+https://vojtechsteidl.eu/)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      fetched += 1;
      const sourceHtml = await response.text();
      const opportunity = parseOpportunity(source, sourceHtml);
      if (opportunity.score >= 35) relevant += 1;

      const result = await env.DB.prepare(`INSERT OR IGNORE INTO eu_opportunities
        (id, source, source_label, title, summary, source_url, programme, tags, deadline_at,
         is_remote, score, status, first_seen_at, last_seen_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'new', ?12, ?12)`)
        .bind(
          opportunity.id,
          opportunity.source,
          opportunity.sourceLabel,
          opportunity.title,
          opportunity.summary,
          opportunity.sourceUrl,
          opportunity.programme,
          opportunity.tags.join(" · "),
          opportunity.deadlineAt,
          opportunity.isRemote ? 1 : 0,
          opportunity.score,
          seenAt,
        ).run();

      if (Number(result.meta.changes || 0) > 0) {
        inserted += 1;
      } else {
        await env.DB.prepare(`UPDATE eu_opportunities
          SET source_label = ?2, title = ?3, summary = ?4, programme = ?5, tags = ?6,
              deadline_at = ?7, is_remote = ?8, score = ?9, last_seen_at = ?10
          WHERE id = ?1`)
          .bind(
            opportunity.id,
            opportunity.sourceLabel,
            opportunity.title,
            opportunity.summary,
            opportunity.programme,
            opportunity.tags.join(" · "),
            opportunity.deadlineAt,
            opportunity.isRemote ? 1 : 0,
            opportunity.score,
            seenAt,
          ).run();
      }
    } catch (error) {
      failures.push(`${source.sourceLabel}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  const status = failures.length === 0 ? "ok" : fetched === 0 ? "error" : "partial";
  const message = failures.length ? failures.join(" | ").slice(0, 1400) : null;
  await recordRun(env, status, fetched, relevant, inserted, message).catch(() => undefined);

  console.log(JSON.stringify({ event: "eu_opportunity_scan", fetched, relevant, inserted, failures: failures.length }));
  if (fetched === 0 && failures.length) throw new Error(message || "EU opportunity scan failed");
  return { fetched, relevant, inserted, failures: failures.length };
}

function dateLabel(value: string | null, includeTime = false): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: PRAGUE_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: value.length === 10 ? "numeric" : undefined,
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined,
  }).format(date);
}

function statusLabel(status: string): string {
  return ({ new: "Nové", reviewed: "Zkontrolováno", applied: "Přihlášeno", ignored: "Ignorováno" } as Record<string, string>)[status] || status;
}

async function dashboardData(env: EuEnv): Promise<{ opportunities: OpportunityRow[]; run: RunRow | null }> {
  const [opportunities, run] = await Promise.all([
    env.DB.prepare(`SELECT id, source, source_label, title, summary, source_url, programme, tags,
                           deadline_at, is_remote, score, status, first_seen_at, last_seen_at
                      FROM eu_opportunities
                     ORDER BY score DESC, datetime(first_seen_at) DESC
                     LIMIT 120`).all<OpportunityRow>(),
    env.DB.prepare(`SELECT run_at, status, fetched_count, relevant_count, new_count, message
                      FROM eu_opportunity_runs
                     ORDER BY id DESC
                     LIMIT 1`).first<RunRow>(),
  ]);
  return { opportunities: opportunities.results || [], run };
}

function renderDashboard(data: Awaited<ReturnType<typeof dashboardData>>, email: string, showArchive: boolean): Response {
  const now = new Date();
  const active = data.opportunities.filter((row) => !isExpired(row.deadline_at, now) && row.status !== "ignored");
  const hidden = data.opportunities.filter((row) => isExpired(row.deadline_at, now) || row.status === "ignored").length;
  const visible = showArchive ? data.opportunities : active;
  const highFit = active.filter((row) => row.score >= HIGH_FIT_THRESHOLD).length;
  const remote = active.filter((row) => Boolean(row.is_remote)).length;

  const rows = visible.map((row) => {
    const expired = isExpired(row.deadline_at, now);
    const scoreClass = row.score >= 85 ? "hot" : row.score >= HIGH_FIT_THRESHOLD ? "good" : "normal";
    const summary = row.summary.length > 520 ? `${row.summary.slice(0, 520)}…` : row.summary;
    const archiveClass = expired || row.status === "ignored" ? " archived" : "";
    return `<article class="lead-card${archiveClass}" data-opportunity-id="${esc(row.id)}">
      <div class="score ${scoreClass}"><strong>${esc(row.score)}</strong><span>/100</span></div>
      <div class="lead-main">
        <div class="lead-meta"><span class="source">${esc(row.source_label)}</span><span>${esc(row.programme || "EU")}</span>${row.is_remote ? '<span class="remote">Remote</span>' : ""}${expired ? '<span class="expired">Po termínu</span>' : ""}</div>
        <h2>${esc(row.title)}</h2>
        <p>${esc(summary)}</p>
        ${row.tags ? `<div class="tags">${row.tags.split(" · ").map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>` : ""}
        <div class="lead-footer"><span class="status status-${esc(row.status)}">${esc(statusLabel(row.status))}</span><span>${row.deadline_at ? `Deadline ${esc(dateLabel(row.deadline_at))}` : "Průběžná / neuvedená uzávěrka"}</span><span>Aktualizováno ${esc(dateLabel(row.last_seen_at, true))}</span></div>
      </div>
      <div class="lead-actions">
        <a class="button primary" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Otevřít EU zdroj ↗</a>
        <button class="button" type="button" data-status="reviewed">Zkontrolováno</button>
        <button class="button" type="button" data-status="applied">Přihlášeno</button>
        <button class="button ghost" type="button" data-status="ignored">Ignorovat</button>
      </div>
    </article>`;
  }).join("");

  const runState = data.run?.status === "ok" ? "Běží" : data.run?.status === "partial" ? "Částečně" : data.run ? "Zdroj čeká" : "Čeká na první běh";
  const runClass = data.run?.status === "ok" ? "ok" : "warning";
  const archiveToggle = showArchive
    ? `<a class="button" href="${EU_OPPORTUNITIES_APP_PATH}/">Skrýt archiv</a>`
    : `<a class="button" href="${EU_OPPORTUNITIES_APP_PATH}/?archive=1">Archiv${hidden ? ` (${hidden})` : ""}</a>`;

  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>EU Opportunities · Lead Radar</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--blue:#a9c8f5;--blue-soft:#e3eefc;--mint:#9ee8ca;--mint-soft:#dff7ed;--amber:#e7c86f;--red:#e4867f;--shadow-soft:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background-color:var(--paper);background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(1240px,calc(100% - 32px));margin:24px auto 60px}.topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#496a91}.topbar h1{font-size:clamp(34px,5vw,60px);line-height:1;letter-spacing:-.055em;margin:8px 0}.topbar p{margin:0;color:var(--muted);max-width:720px}.top-actions{display:flex;gap:8px;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:12px;box-shadow:var(--shadow-soft);cursor:pointer}.button.primary{background:var(--blue);border-color:#8bb4ed}.button.ghost{background:transparent;box-shadow:none}.button:disabled{opacity:.55;cursor:wait}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.card{background:rgba(251,250,246,.94);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-soft)}.kpi{padding:17px;min-height:120px;display:flex;flex-direction:column}.kpi span{font-size:11px;color:var(--muted);font-weight:800}.kpi strong{font-size:32px;letter-spacing:-.04em;margin-top:auto}.sync-line{display:flex;align-items:center;gap:8px}.dot{width:9px;height:9px;border-radius:50%;background:#68a2d5;box-shadow:0 0 0 4px var(--blue-soft)}.dot.warning{background:var(--amber);box-shadow:0 0 0 4px #f6edce}.notice{padding:15px 17px;margin-bottom:16px;border-radius:16px;background:var(--blue-soft);color:#385773;border:1px solid #bfd4ef;font-size:12px;line-height:1.55}.notice strong{color:#274863}.notice a{color:#244f80;font-weight:900}.list{display:grid;gap:11px}.lead-card{display:grid;grid-template-columns:76px minmax(0,1fr) 160px;gap:16px;padding:17px;background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-soft)}.lead-card.archived{opacity:.56;border-style:dashed}.score{width:67px;height:67px;border-radius:18px;background:var(--surface-2);display:grid;place-items:center;align-content:center}.score strong{font-size:25px;line-height:1}.score span{font-size:10px;color:var(--muted)}.score.good{background:var(--blue-soft);color:#365f8d}.score.hot{background:#d7e8fb;color:#244f80;box-shadow:inset 0 0 0 1px #9bbfe9}.lead-meta,.tags{display:flex;gap:7px;flex-wrap:wrap;color:var(--muted);font-size:10px;font-weight:800}.lead-meta span,.tags span{padding:4px 7px;border-radius:99px;background:var(--surface-2)}.lead-meta .source{background:#e5eef3;color:#4f7187}.lead-meta .remote{background:var(--mint-soft);color:#347c61}.lead-meta .expired{background:#f7dfdd;color:#89534f}.lead-main h2{font-size:18px;margin:9px 0 6px;letter-spacing:-.02em}.lead-main p{font-size:12px;line-height:1.55;color:#5f615a;margin:0}.tags{margin-top:10px}.lead-footer{display:flex;gap:10px;flex-wrap:wrap;margin-top:11px;color:var(--muted);font-size:10px}.status{font-weight:900}.status-new{color:#365f8d}.status-applied{color:#2f7258}.status-ignored{color:#8b695f}.lead-actions{display:flex;flex-direction:column;gap:7px;justify-content:center}.empty{padding:42px;text-align:center;color:var(--muted)}.account{margin-top:24px;color:var(--muted);font-size:10px;text-align:right}.section-head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin:26px 0 10px}.section-head h2{margin:0;font-size:20px}.section-head span{font-size:11px;color:var(--muted)}small{color:var(--muted);font-size:10px;margin-top:4px}
    @media(max-width:850px){.kpis{grid-template-columns:1fr 1fr}.lead-card{grid-template-columns:60px 1fr}.score{width:55px;height:55px}.lead-actions{grid-column:2;flex-direction:row;flex-wrap:wrap;justify-content:flex-start}.topbar{flex-direction:column}.lead-actions .button{width:auto}}
    @media(max-width:520px){.shell{width:min(100% - 20px,1240px);margin-top:14px}.kpis{grid-template-columns:1fr 1fr}.kpi{min-height:105px}.lead-card{grid-template-columns:1fr}.score{width:auto;height:auto;display:flex;gap:4px;justify-content:flex-start;background:transparent!important;box-shadow:none!important}.lead-actions{grid-column:1}.topbar h1{font-size:38px}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div><div class="eyebrow">Lead Radar · kariéra / EU</div><h1>EU Opportunities</h1><p>Externí expert, evaluator, monitor a podobné krátkodobé EU assignments. Scoring je cílený na techniku, mobility/transport, industry, energy, R&I a project/risk zkušenost.</p></div>
      <div class="top-actions">${archiveToggle}<a class="button" href="/student-portal/admin/tutoring/leads/">Tutoring Lead Alert</a><a class="button" href="/student-portal/admin/tutoring/">← Tutoring OS</a><button id="refresh" class="button primary" type="button">Zkontrolovat teď</button></div>
    </header>

    <section class="kpis">
      <article class="card kpi"><span>Monitoring</span><strong class="sync-line"><i class="dot ${runClass}"></i>${esc(runState)}</strong><small>${esc(data.run ? `Poslední check ${dateLabel(data.run.run_at, true)}` : "Aktivuje se po nasazení")}</small></article>
      <article class="card kpi"><span>Aktivní opportunities</span><strong>${esc(active.length)}</strong><small>Bez ignorovaných / po termínu</small></article>
      <article class="card kpi"><span>High fit</span><strong>${esc(highFit)}</strong><small>Skóre ≥ ${HIGH_FIT_THRESHOLD}</small></article>
      <article class="card kpi"><span>Remote zmíněno</span><strong>${esc(remote)}</strong><small>V aktivních zdrojích</small></article>
    </section>

    <div class="notice"><strong>Základ je expert profil v EU Funding &amp; Tenders databázi.</strong> Některé agentury pak vybírají přímo z databáze, jiné chtějí navíc expression-of-interest formulář. <a href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/work-as-an-expert" target="_blank" rel="noopener noreferrer">Otevřít oficiální registraci ↗</a></div>
    ${data.run?.status === "partial" && data.run.message ? `<div class="notice"><strong>Některý EU zdroj při poslední kontrole neodpověděl.</strong> Ostatní zdroje se zpracovaly normálně; další automatický pokus proběhne během několika hodin.</div>` : ""}

    <div class="section-head"><div><h2>${showArchive ? "Všechny EU záznamy" : "Aktivní EU opportunities"}</h2><span>${visible.length} zobrazených${!showArchive && hidden ? ` · ${hidden} v archivu` : ""}</span></div><span>Oficiální zdroje: Funding &amp; Tenders · CINEA · REA · ERC</span></div>
    <section class="list">${rows || '<article class="card empty">Zatím není uložená žádná EU opportunity. Klikni na „Zkontrolovat teď“; následně se feed aktualizuje automaticky několikrát denně.</article>'}</section>
    <div class="account">${esc(email)}</div>
  </main>
  <script>
    const refresh=document.getElementById('refresh');
    refresh?.addEventListener('click',async()=>{refresh.disabled=true;refresh.textContent='Kontroluji…';try{const response=await fetch('${EU_OPPORTUNITIES_REFRESH_API_PATH}',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw new Error('Refresh failed');location.reload()}catch{refresh.disabled=false;refresh.textContent='Zkusit znovu'}});
    document.querySelectorAll('[data-status]').forEach(button=>button.addEventListener('click',async()=>{const card=button.closest('[data-opportunity-id]');if(!card)return;button.disabled=true;try{const response=await fetch('${EU_OPPORTUNITIES_STATUS_API_PATH}',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({id:card.dataset.opportunityId,status:button.dataset.status})});if(!response.ok)throw new Error('Status update failed');location.reload()}catch{button.disabled=false}}));
  </script>
</body>
</html>`);
}

async function refreshHandler(request: Request, env: EuEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  return json(await runEuOpportunityScan(env));
}

async function statusHandler(request: Request, env: EuEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return plain("JSON required", 415);
  const payload = await request.json<{ id?: string; status?: string }>();
  const id = String(payload.id || "").trim();
  const status = String(payload.status || "").trim();
  if (!id || !["reviewed", "applied", "ignored"].includes(status)) return json({ error: "Invalid status." }, 400);
  const result = await env.DB.prepare("UPDATE eu_opportunities SET status = ?2 WHERE id = ?1").bind(id, status).run();
  if (!Number(result.meta.changes || 0)) return json({ error: "Opportunity not found." }, 404);
  return json({ ok: true });
}

export async function handleEuOpportunityRequest(request: Request, env: EuEnv): Promise<Response | null> {
  const url = new URL(request.url);
  try {
    if (url.pathname === EU_OPPORTUNITIES_APP_PATH) return Response.redirect(`${EU_OPPORTUNITIES_APP_PATH}/`, 302);
    if (url.pathname === `${EU_OPPORTUNITIES_APP_PATH}/`) {
      if (request.method !== "GET") return plain("Method not allowed", 405);
      const email = await requireAdmin(request, env);
      return renderDashboard(await dashboardData(env), email, url.searchParams.get("archive") === "1");
    }
    if (url.pathname === EU_OPPORTUNITIES_REFRESH_API_PATH) return refreshHandler(request, env);
    if (url.pathname === EU_OPPORTUNITIES_STATUS_API_PATH) return statusHandler(request, env);
    return null;
  } catch (error) {
    if (error instanceof PortalError) return plain(error.status >= 500 ? "Service unavailable" : error.message, error.status);
    console.error(JSON.stringify({
      event: "eu_opportunity_request_error",
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown",
    }));
    return plain("Internal server error", 500);
  }
}

export async function addEuOpportunitiesLink(response: Response): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes(`${EU_OPPORTUNITIES_APP_PATH}/`)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const marker = '<div class="top-actions">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const updated = body.replace(marker, `${marker}<a class="button" href="${EU_OPPORTUNITIES_APP_PATH}/">EU Opportunities</a>`);
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}
