import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const SIDE_INCOME_APP_PATH = "/student-portal/admin/opportunities/side-income";
export const SIDE_INCOME_REFRESH_API_PATH = "/student-portal/api/admin/opportunities/side-income/refresh";
export const SIDE_INCOME_STATUS_API_PATH = "/student-portal/api/admin/opportunities/side-income/status";
export const SIDE_INCOME_PLATFORM_API_PATH = "/student-portal/api/admin/opportunities/side-income/platform";

const PRAGUE_TIME_ZONE = "Europe/Prague";
const MIN_VISIBLE_SCORE = 65;
const HOT_THRESHOLD = 80;
const PUSH_THRESHOLD = 88;

const AUTOMATED_SOURCES = [
  {
    source: "alignerr",
    sourceLabel: "Alignerr",
    category: "AI training",
    url: "https://www.alignerr.com/jobs",
    linkPattern: /^\/jobs\/[0-9a-f-]{20,}$/i,
    boost: 5,
  },
  {
    source: "mercor",
    sourceLabel: "Mercor",
    category: "AI / expert work",
    url: "https://work.mercor.com/explore",
    linkPattern: /^\/(?:jobs\/[^?#]+|explore\?listingId=[^&#]+)/i,
    boost: 7,
  },
  {
    source: "maven",
    sourceLabel: "Maven Research",
    category: "Expert / advisory",
    url: "https://www.maven.co/open-projects",
    linkPattern: /^\/open-projects\/(?!category\/)[^?#/]+/i,
    boost: 10,
  },
] as const;

type SideIncomeEnv = Env;

type ParsedOpportunity = {
  id: string;
  source: string;
  sourceLabel: string;
  category: string;
  title: string;
  summary: string;
  sourceUrl: string;
  location: string | null;
  isRemote: boolean;
  payMin: number | null;
  payMax: number | null;
  payCurrency: string | null;
  payUnit: string | null;
  fitReason: string;
  score: number;
};

type OpportunityRow = {
  id: string;
  source: string;
  source_label: string;
  category: string;
  title: string;
  summary: string;
  source_url: string;
  location: string | null;
  is_remote: number;
  pay_min: number | null;
  pay_max: number | null;
  pay_currency: string | null;
  pay_unit: string | null;
  fit_reason: string;
  score: number;
  status: string;
  is_active: number;
  first_seen_at: string;
  last_seen_at: string;
  alerted_at: string | null;
};

type PlatformRow = {
  source: string;
  source_label: string;
  category: string;
  mode: string;
  source_url: string;
  priority: string;
  status: string;
  note: string | null;
  last_action_at: string | null;
};

type RunRow = {
  source: string;
  run_at: string;
  status: string;
  fetched_count: number;
  relevant_count: number;
  new_count: number;
  message: string | null;
};

function headers(contentType: string): Headers {
  const result = privateHeaders();
  result.set("Content-Type", contentType);
  return result;
}

function html(body: string, status = 200): Response {
  const responseHeaders = headers("text/html; charset=utf-8");
  responseHeaders.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  return new Response(body, { status, headers: responseHeaders });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: headers("application/json; charset=utf-8") });
}

function plain(body: string, status: number): Response {
  return new Response(body, { status, headers: headers("text/plain; charset=utf-8") });
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

function stableId(source: string, value: string): string {
  let hash = 0x811c9dc5;
  const input = `${source}:${value}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `side:${source}:${(hash >>> 0).toString(16)}`;
}

function absoluteUrl(source: typeof AUTOMATED_SOURCES[number], href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return new URL(href, source.url).toString();
}

function extractPay(text: string): {
  min: number | null;
  max: number | null;
  currency: string | null;
  unit: string | null;
} {
  const normalized = text.replace(/,/g, "");
  const range = normalized.match(/([$€£])\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(?:[$€£]\s*)?(\d+(?:\.\d+)?)\s*(?:\/\s*)?(hour|hr|task|day|month|mo)?/i);
  if (range) {
    return {
      min: Number(range[2]),
      max: Number(range[3]),
      currency: range[1],
      unit: (range[4] || "").toLowerCase() || null,
    };
  }
  const single = normalized.match(/([$€£])\s*(\d+(?:\.\d+)?)\s*(?:\/\s*)?(hour|hr|task|day|month|mo)/i);
  if (single) {
    const amount = Number(single[2]);
    return {
      min: amount,
      max: amount,
      currency: single[1],
      unit: single[3].toLowerCase(),
    };
  }
  return { min: null, max: null, currency: null, unit: null };
}

function payLabel(row: OpportunityRow): string {
  if (row.pay_min == null && row.pay_max == null) return "Odměna neuvedena";
  const currency = row.pay_currency || "";
  const unit = row.pay_unit ? `/${row.pay_unit === "hour" ? "h" : row.pay_unit}` : "";
  if (row.pay_min != null && row.pay_max != null && row.pay_min !== row.pay_max) {
    return `${currency}${Math.round(row.pay_min)}–${Math.round(row.pay_max)}${unit}`;
  }
  const amount = row.pay_max ?? row.pay_min ?? 0;
  return `${currency}${Math.round(amount)}${unit}`;
}

function scoreOpportunity(
  source: typeof AUTOMATED_SOURCES[number],
  title: string,
  body: string,
  pay: ReturnType<typeof extractPay>,
): { score: number; reason: string; isRemote: boolean; location: string | null } {
  const text = normalize(\`${title} ${body}\`);
  let score = 10 + source.boost;
  const reasons: string[] = [];

  // Verified experience gates:
  // 1) professional experience = project / programme management
  // 2) proven side activity = mathematics / physics tutoring
  // Domain words such as engineering, energy or automotive are context only.
  const hasPmCore = /project management|project manager|technical project manager|program manager|programme manager|program management|programme management|pmo|project delivery|project lead/.test(text);
  const hasPmAdjacent = /project coordinator|project planner|project controller|scrum master/.test(text);
  const hasMathPhysics = /mathemat|\bmath\b|physics|applied physics|calculus|algebra|statistics|quantitative/.test(text);
  const hasTutoring = /tutor|tutoring|teacher|teaching|instructor|education|student support|academic support/.test(text);
  const hasAiEvaluation = /ai training|ai trainer|model evaluation|ai evaluation|rlhf|grading|rubric|reasoning evaluator|reasoning expert/.test(text);
  const hasIndustryDomain = /automotive|manufactur|industrial|production|supplier|mobility|quality|supply chain|engineering/.test(text);
  const hasEnergyDomain = /energy|battery|batteries|data center|datacentre|cooling|power|grid|hydrogen|thermal/.test(text);
  const hasExpertFormat = /consult|advisory|expert interview|expert call|research interview|market research|survey|subject matter expert/.test(text);

  if (hasPmCore) {
    score += 40;
    reasons.push("přímý fit: project/program management");
  } else if (hasPmAdjacent) {
    score += 28;
    reasons.push("blízké PM zkušenosti");
  }

  if (hasMathPhysics) {
    score += 36;
    reasons.push("přímý fit: matematika/fyzika");
  }
  if (hasTutoring && hasMathPhysics) {
    score += 18;
    reasons.push("odpovídá praxi v doučování");
  }

  // AI work is attractive only when it uses an already demonstrated track.
  if (hasAiEvaluation && (hasMathPhysics || hasPmCore || hasPmAdjacent)) {
    score += 14;
    reasons.push("AI evaluation nad známou doménou");
  } else if (hasAiEvaluation) {
    score -= 8;
    reasons.push("AI role bez doložené doménové výhody");
  }

  // Industry is a domain multiplier, never a standalone qualification.
  if (hasIndustryDomain && (hasPmCore || hasPmAdjacent)) {
    score += 14;
    reasons.push("PM + automotive/manufacturing fit");
  }
  if (hasEnergyDomain && (hasPmCore || hasPmAdjacent)) {
    score += 8;
    reasons.push("PM + energy/data-centre kontext");
  }
  if (hasExpertFormat && (hasPmCore || hasPmAdjacent) && hasIndustryDomain) {
    score += 10;
    reasons.push("expert/advisory na PM praxi");
  }

  const isRemote = /remote|work from anywhere|work from home|fully remote|worldwide|global/.test(text);
  if (isRemote) {
    score += 10;
    reasons.push("remote");
  }

  const flexible = /freelance|contract|contractor|flexible|part[- ]time|project-based|one-time|hourly/.test(text);
  if (flexible) {
    score += 9;
    reasons.push("flexibilní forma");
  }

  const hourly = pay.unit && /hour|hr/.test(pay.unit);
  const effectivePay = pay.max ?? pay.min;
  if (hourly && effectivePay != null) {
    if (effectivePay >= 75) score += 18;
    else if (effectivePay >= 50) score += 14;
    else if (effectivePay >= 35) score += 8;
    else if (effectivePay < 25) score -= 12;
    reasons.push("transparentní hodinová sazba");
  }

  // Hard mismatch: attractive topic, but role belongs to a profession with no demonstrated work history.
  const unsupportedProfession =
    /software engineer|software developer|frontend|front-end|backend|back-end|full[- ]stack|data scientist|data engineer|machine learning engineer|ml engineer|electrical engineer|mechanical engineer|civil engineer|design engineer|accountant|financial analyst|investment analyst|marketing manager|sales manager|account executive|recruiter|ux designer|product designer|product manager|product owner|lawyer|attorney|medical doctor|physician|nurse/.test(text);
  if (unsupportedProfession && !hasPmCore && !hasPmAdjacent && !(hasMathPhysics && hasTutoring)) {
    score -= 45;
    reasons.push("mimo doloženou profesní praxi");
  }

  if (/management consulting|business operations|business strategy/.test(text) && !hasPmCore && !hasPmAdjacent) {
    score -= 18;
    reasons.push("obecný consulting/ops bez přímého PM fitu");
  }

  if (/chief\b|vice president|\bvp\b|director\b|head of\b|10\+?\s*years|8\+?\s*years/.test(text)) {
    score -= 18;
    reasons.push("pravděpodobný seniority mismatch");
  }

  if (/us only|u\.s\. only|united states only|canada only|india only|australia only/.test(text)) {
    score -= 55;
    reasons.push("geografické omezení");
  }

  const relevantDegreeGate =
    /(?:master'?s|msc|phd).{0,45}(?:math|physics|statistics|computer science|engineering).{0,25}(?:required|must|only)|(?:required|must).{0,25}(?:master'?s|msc|phd).{0,45}(?:math|physics|statistics|computer science|engineering)/.test(text);
  if (relevantDegreeGate) {
    score -= 30;
    reasons.push("požadován vyšší relevantní titul");
  } else if (/phd.*required|required.*phd|phd holder|phd only/.test(text)) {
    score -= 38;
    reasons.push("PhD gate");
  }

  if (/expert python|advanced python|strong programming|production[- ]grade code|professional software development/.test(text) && !hasPmCore && !hasPmAdjacent) {
    score -= 16;
    reasons.push("příliš silný coding requirement");
  }

  // If neither demonstrated track is present, keep the item out of the main feed.
  if (!hasPmCore && !hasPmAdjacent && !hasMathPhysics) {
    score -= 28;
    reasons.push("chybí vazba na PM nebo math/physics");
  }

  const location =
    text.includes("czech") || text.includes("czechia") ? "Czechia"
    : text.includes("europe") ? "Europe"
    : isRemote ? "Remote"
    : null;

  return {
    score: Math.max(1, Math.min(100, score)),
    reason: reasons.slice(0, 4).join(" · ") || "bez dostatečného fitu",
    isRemote,
    location,
  };
}

function opportunityLane(row: OpportunityRow): "career" | "side" {
  const text = normalize(\`${row.title} ${row.summary}\`);
  const pm = /project management|project manager|technical project manager|program manager|programme manager|program management|programme management|pmo|project delivery|project lead/.test(text);
  const flexible = /freelance|contract|contractor|part[- ]time|project-based|one-time|hourly|expert call|expert interview|ai training|ai trainer|model evaluation|ai evaluation|tutor|tutoring/.test(text);
  return pm && !flexible ? "career" : "side";
}

function rescoreStoredOpportunity(row: OpportunityRow): OpportunityRow {
  const source = AUTOMATED_SOURCES.find((item) => item.source === row.source);
  if (!source) return row;
  const scored = scoreOpportunity(source, row.title, row.summary, {
    min: row.pay_min,
    max: row.pay_max,
    currency: row.pay_currency,
    unit: row.pay_unit,
  });
  return {
    ...row,
    score: scored.score,
    fit_reason: scored.reason,
    is_remote: scored.isRemote ? 1 : row.is_remote,
    location: scored.location ?? row.location,
  };
}

function extractTitle(anchorHtml: string, cardText: string): string {
  const heading = anchorHtml.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  if (heading) return stripHtml(heading).slice(0, 180);
  const clean = stripHtml(anchorHtml);
  const cut = clean
    .split(/\s+(?:Apply|Remote|Freelance|\$\d|€\d|£\d)/i)[0]
    .trim();
  if (cut.length >= 4) return cut.slice(0, 180);
  return cardText.slice(0, 180) || "Side-income opportunity";
}

function parseSourcePage(source: typeof AUTOMATED_SOURCES[number], sourceHtml: string): ParsedOpportunity[] {
  const anchorPattern = /<a\b[^>]*href=(?:"|')([^"']+)(?:"|')[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  const output: ParsedOpportunity[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(sourceHtml)) !== null) {
    const href = decodeEntities(match[1]);
    let parsedHref: string;
    try {
      const url = /^https?:\/\//i.test(href) ? new URL(href) : new URL(href, source.url);
      parsedHref = `${url.pathname}${url.search}`;
    } catch {
      continue;
    }
    if (!source.linkPattern.test(parsedHref)) continue;

    const sourceUrl = absoluteUrl(source, href);
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);

    const around = sourceHtml.slice(Math.max(0, match.index - 260), Math.min(sourceHtml.length, match.index + match[0].length + 1500));
    const cardText = stripHtml(`${match[2]} ${around}`).slice(0, 2200);
    const title = extractTitle(match[2], cardText);
    if (!title || title.length < 4) continue;

    const pay = extractPay(cardText);
    const scored = scoreOpportunity(source, title, cardText, pay);
    if (scored.score < 50) continue;

    output.push({
      id: stableId(source.source, sourceUrl),
      source: source.source,
      sourceLabel: source.sourceLabel,
      category: source.category,
      title,
      summary: cardText.slice(0, 760),
      sourceUrl,
      location: scored.location,
      isRemote: scored.isRemote,
      payMin: pay.min,
      payMax: pay.max,
      payCurrency: pay.currency,
      payUnit: pay.unit,
      fitReason: scored.reason,
      score: scored.score,
    });

    if (output.length >= 100) break;
  }

  return output;
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

async function recordRun(
  env: SideIncomeEnv,
  source: string,
  status: "ok" | "partial" | "error",
  fetched: number,
  relevant: number,
  inserted: number,
  message: string | null,
): Promise<void> {
  await env.DB.prepare(`INSERT INTO side_income_runs
      (source, run_at, status, fetched_count, relevant_count, new_count, message)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
    .bind(source, new Date().toISOString(), status, fetched, relevant, inserted, message)
    .run();
}

async function publishHotOpportunity(env: SideIncomeEnv, opportunity: ParsedOpportunity): Promise<boolean> {
  if (opportunity.score < PUSH_THRESHOLD) return false;
  const settings = await env.DB.prepare("SELECT topic FROM tutoring_lead_push_settings WHERE id = 1")
    .first<{ topic: string }>();
  if (!settings?.topic) return false;
  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(settings.topic)}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": `Side-income · ${opportunity.score}/100 · ${opportunity.sourceLabel}`,
        "Priority": opportunity.score >= 90 ? "high" : "default",
        "Tags": "moneybag,briefcase",
        "Click": opportunity.sourceUrl,
      },
      body: `${opportunity.title}\n${opportunity.fitReason}\n${opportunity.summary.slice(0, 700)}`,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function runSideIncomeScan(env: SideIncomeEnv): Promise<{
  fetched: number;
  relevant: number;
  inserted: number;
  alerted: number;
  failures: number;
}> {
  let fetched = 0;
  let relevant = 0;
  let inserted = 0;
  let alerted = 0;
  const failures: string[] = [];
  const seenAt = new Date().toISOString();

  for (const source of AUTOMATED_SOURCES) {
    let sourceInserted = 0;
    try {
      const response = await fetch(source.url, {
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "User-Agent": "VojtechSteidl-SideIncomeRadar/1.0 (+https://vojtechsteidl.eu/)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      fetched += 1;
      const sourceHtml = await response.text();
      const opportunities = parseSourcePage(source, sourceHtml);
      relevant += opportunities.length;

      if (!opportunities.length) {
        await recordRun(env, source.source, "partial", 1, 0, 0, "Public page loaded, but no relevant cards matched current parser.");
        continue;
      }

      await env.DB.prepare("UPDATE side_income_opportunities SET is_active = 0 WHERE source = ?1")
        .bind(source.source)
        .run();

      for (const opportunity of opportunities) {
        const result = await env.DB.prepare(`INSERT OR IGNORE INTO side_income_opportunities
          (id, source, source_label, category, title, summary, source_url, location, is_remote,
           pay_min, pay_max, pay_currency, pay_unit, fit_reason, score, status, is_active,
           first_seen_at, last_seen_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 'new', 1, ?16, ?16)`)
          .bind(
            opportunity.id,
            opportunity.source,
            opportunity.sourceLabel,
            opportunity.category,
            opportunity.title,
            opportunity.summary,
            opportunity.sourceUrl,
            opportunity.location,
            opportunity.isRemote ? 1 : 0,
            opportunity.payMin,
            opportunity.payMax,
            opportunity.payCurrency,
            opportunity.payUnit,
            opportunity.fitReason,
            opportunity.score,
            seenAt,
          ).run();

        if (Number(result.meta.changes || 0) > 0) {
          inserted += 1;
          sourceInserted += 1;
          if (await publishHotOpportunity(env, opportunity)) {
            alerted += 1;
            await env.DB.prepare("UPDATE side_income_opportunities SET alerted_at = ?2 WHERE id = ?1")
              .bind(opportunity.id, seenAt)
              .run();
          }
        } else {
          await env.DB.prepare(`UPDATE side_income_opportunities
              SET source_label = ?2, category = ?3, title = ?4, summary = ?5, location = ?6,
                  is_remote = ?7, pay_min = ?8, pay_max = ?9, pay_currency = ?10, pay_unit = ?11,
                  fit_reason = ?12, score = ?13, is_active = 1, last_seen_at = ?14
              WHERE id = ?1`)
            .bind(
              opportunity.id,
              opportunity.sourceLabel,
              opportunity.category,
              opportunity.title,
              opportunity.summary,
              opportunity.location,
              opportunity.isRemote ? 1 : 0,
              opportunity.payMin,
              opportunity.payMax,
              opportunity.payCurrency,
              opportunity.payUnit,
              opportunity.fitReason,
              opportunity.score,
              seenAt,
            ).run();
        }
      }

      await recordRun(env, source.source, "ok", 1, opportunities.length, sourceInserted, null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      failures.push(`${source.sourceLabel}: ${message}`);
      await recordRun(env, source.source, "error", 0, 0, 0, message).catch(() => undefined);
    }
  }

  console.log(JSON.stringify({ event: "side_income_scan", fetched, relevant, inserted, alerted, failures: failures.length }));
  return { fetched, relevant, inserted, alerted, failures: failures.length };
}

function dateLabel(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: PRAGUE_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string): string {
  return ({
    new: "Nové",
    reviewed: "Zkontrolováno",
    applied: "Přihlášeno",
    won: "Získáno",
    lost: "Nezískáno",
    ignored: "Ignorováno",
  } as Record<string, string>)[status] || status;
}

function platformStatusLabel(status: string): string {
  return ({
    not_started: "Nezaloženo",
    registered: "Registrován",
    active: "Aktivní",
    skipped: "Přeskočeno",
  } as Record<string, string>)[status] || status;
}

async function dashboardData(env: SideIncomeEnv): Promise<{
  opportunities: OpportunityRow[];
  platforms: PlatformRow[];
  runs: RunRow[];
}> {
  const [opportunities, platforms, runs] = await Promise.all([
    env.DB.prepare(`SELECT id, source, source_label, category, title, summary, source_url, location,
                           is_remote, pay_min, pay_max, pay_currency, pay_unit, fit_reason, score,
                           status, is_active, first_seen_at, last_seen_at, alerted_at
                      FROM side_income_opportunities
                     ORDER BY is_active DESC,
                              CASE status WHEN 'new' THEN 0 WHEN 'reviewed' THEN 1 WHEN 'applied' THEN 2 ELSE 3 END,
                              score DESC, datetime(first_seen_at) DESC
                     LIMIT 180`).all<OpportunityRow>(),
    env.DB.prepare(`SELECT source, source_label, category, mode, source_url, priority, status, note, last_action_at
                      FROM side_income_platform_profiles
                     ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                              CASE mode WHEN 'auto' THEN 0 WHEN 'profile' THEN 1 ELSE 2 END,
                              source_label`).all<PlatformRow>(),
    env.DB.prepare(`SELECT source, run_at, status, fetched_count, relevant_count, new_count, message
                      FROM side_income_runs
                     WHERE id IN (SELECT MAX(id) FROM side_income_runs GROUP BY source)
                     ORDER BY source`).all<RunRow>(),
  ]);
  return {
    opportunities: (opportunities.results || []).map(rescoreStoredOpportunity),
    platforms: platforms.results || [],
    runs: runs.results || [],
  };
}

function opportunityCard(row: OpportunityRow): string {
  const scoreClass = row.score >= 90 ? "hot" : row.score >= HOT_THRESHOLD ? "good" : "normal";
  const summary = row.summary.length > 460 ? `${row.summary.slice(0, 460)}…` : row.summary;
  const lane = opportunityLane(row);
  const laneLabel = lane === "career" ? "Career fit · PM" : "Side income";
  return `<article class="op-card" data-opportunity-id="${esc(row.id)}">
    <div class="score ${scoreClass}"><strong>${esc(row.score)}</strong><span>/100</span></div>
    <div class="op-main">
      <div class="meta"><span class="source">${esc(row.source_label)}</span><span>${esc(laneLabel)}</span><span>${esc(row.category)}</span>${row.is_remote ? '<span class="remote">Remote</span>' : ""}<span>${esc(payLabel(row))}</span></div>
      <h2>${esc(row.title)}</h2>
      <p>${esc(summary)}</p>
      <div class="fit">${esc(row.fit_reason)}</div>
      <div class="footer"><span class="status status-${esc(row.status)}">${esc(statusLabel(row.status))}</span><span>${row.location ? esc(row.location) : "Lokalita neuvedena"}</span><span>Aktualizováno ${esc(dateLabel(row.last_seen_at))}</span>${row.alerted_at ? "<span>Push odeslán</span>" : ""}</div>
    </div>
    <div class="actions">
      <a class="button primary" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Otevřít ↗</a>
      <button class="button" type="button" data-status="reviewed">Zkontrolováno</button>
      <button class="button" type="button" data-status="applied">Přihlášeno</button>
      <button class="button" type="button" data-status="won">Získáno</button>
      <button class="button ghost" type="button" data-status="ignored">Ignorovat</button>
    </div>
  </article>`;
}

function renderDashboard(data: Awaited<ReturnType<typeof dashboardData>>, email: string, showArchive: boolean): Response {
  const active = data.opportunities.filter((row) =>
    row.is_active &&
    row.score >= MIN_VISIBLE_SCORE &&
    !["lost", "ignored"].includes(row.status)
  );
  const archive = data.opportunities.length - active.length;
  const visible = showArchive ? data.opportunities : active;
  const hot = active.filter((row) => row.score >= HOT_THRESHOLD).length;
  const new7d = active.filter((row) => Date.parse(row.first_seen_at) >= Date.now() - 7 * 86_400_000).length;
  const platformActive = data.platforms.filter((row) => ["registered", "active"].includes(row.status)).length;
  const runMap = new Map(data.runs.map((row) => [row.source, row]));

  const platformCards = data.platforms.map((row) => {
    const run = runMap.get(row.source);
    const modeLabel = row.mode === "auto" ? "AUTO" : row.mode === "profile" ? "PROFILE" : "SEARCH";
    const priorityLabel = row.priority === "high" ? "HIGH FIT" : row.priority === "experiment" ? "EXPERIMENT" : "MEDIUM";
    return `<article class="platform-card" data-platform-source="${esc(row.source)}">
      <div class="platform-head"><div><strong>${esc(row.source_label)}</strong><span>${esc(row.category)}</span></div><div class="platform-badges"><i class="pill mode-${esc(row.mode)}">${modeLabel}</i><i class="pill priority-${esc(row.priority)}">${priorityLabel}</i></div></div>
      <p>${esc(row.note || "")}</p>
      ${run ? `<small>Poslední scan: ${esc(dateLabel(run.run_at))} · ${esc(run.status)} · ${esc(run.relevant_count)} relevantních</small>` : '<small>Neveřejný matching / ruční search.</small>'}
      <div class="platform-actions">
        <a class="button" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Otevřít platformu ↗</a>
        <select data-platform-select>
          <option value="not_started" ${row.status === "not_started" ? "selected" : ""}>Nezaloženo</option>
          <option value="registered" ${row.status === "registered" ? "selected" : ""}>Registrován</option>
          <option value="active" ${row.status === "active" ? "selected" : ""}>Aktivní</option>
          <option value="skipped" ${row.status === "skipped" ? "selected" : ""}>Přeskočeno</option>
        </select>
      </div>
    </article>`;
  }).join("");

  const archiveToggle = showArchive
    ? `<a class="button" href="${SIDE_INCOME_APP_PATH}/">Skrýt archiv</a>`
    : `<a class="button" href="${SIDE_INCOME_APP_PATH}/?archive=1">Archiv${archive ? ` (${archive})` : ""}</a>`;

  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Side-income Radar</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--mint:#9ee8ca;--mint-soft:#dff7ed;--blue:#e5eef3;--amber:#f6edce;--red:#f7dfdd;--shadow:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(1260px,calc(100% - 32px));margin:24px auto 60px}.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}.top h1{font-size:clamp(38px,6vw,68px);line-height:.96;letter-spacing:-.055em;margin:9px 0 8px}.top p{margin:0;color:var(--muted);max-width:760px;line-height:1.55}.top-actions,.actions,.platform-actions{display:flex;gap:8px;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:12px;box-shadow:var(--shadow);cursor:pointer}.button.primary{background:var(--mint);border-color:#83dcb9}.button.ghost{background:transparent;box-shadow:none}.button:disabled{opacity:.55;cursor:wait}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.card{background:rgba(251,250,246,.95);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow)}.kpi{padding:17px;min-height:112px;display:flex;flex-direction:column}.kpi span{font-size:10px;color:var(--muted);font-weight:800}.kpi strong{font-size:32px;letter-spacing:-.04em;margin-top:auto}.section-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin:26px 0 10px}.section-head h2{margin:0;font-size:20px}.section-head span{font-size:10px;color:var(--muted)}.list{display:grid;gap:11px}.op-card{display:grid;grid-template-columns:76px minmax(0,1fr) 154px;gap:16px;padding:17px;background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow)}.score{width:67px;height:67px;border-radius:18px;background:var(--surface-2);display:grid;place-items:center;align-content:center}.score strong{font-size:25px;line-height:1}.score span{font-size:10px;color:var(--muted)}.score.good{background:var(--mint-soft);color:#2f7258}.score.hot{background:#d4f3e5;color:#24684d;box-shadow:inset 0 0 0 1px #8fd9ba}.meta{display:flex;gap:7px;flex-wrap:wrap;color:var(--muted);font-size:10px;font-weight:800}.meta span{padding:4px 7px;border-radius:99px;background:var(--surface-2)}.meta .source{background:var(--blue);color:#4f7187}.meta .remote{background:var(--mint-soft);color:#347c61}.op-main h2{font-size:18px;margin:9px 0 6px}.op-main p{font-size:12px;line-height:1.55;color:#5f615a;margin:0}.fit{display:inline-flex;margin-top:9px;padding:5px 8px;border-radius:99px;background:var(--amber);color:#725d1f;font-size:9px;font-weight:900}.footer{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;color:var(--muted);font-size:10px}.status{font-weight:900}.status-new,.status-won{color:#2f7258}.status-applied{color:#4f7187}.status-ignored,.status-lost{color:#8b695f}.actions{flex-direction:column;justify-content:center}.platform-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.platform-card{background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:var(--shadow)}.platform-head{display:flex;gap:10px;justify-content:space-between}.platform-head strong{display:block}.platform-head span{display:block;margin-top:2px;font-size:9px;color:var(--muted)}.platform-badges{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.pill{font-style:normal;padding:4px 6px;border-radius:99px;background:var(--surface-2);font-size:8px;font-weight:900}.mode-auto,.priority-high{background:var(--mint-soft);color:#347c61}.mode-profile{background:var(--blue);color:#4f7187}.mode-search,.priority-experiment{background:var(--amber);color:#725d1f}.platform-card p{font-size:10px;line-height:1.45;color:var(--muted);min-height:30px}.platform-card small{display:block;font-size:9px;color:var(--muted);margin:7px 0 10px}.platform-actions select{border:1px solid var(--line);border-radius:999px;background:var(--surface);padding:8px 10px;font-weight:800;font-size:10px;color:var(--ink)}.empty{padding:40px;text-align:center;color:var(--muted)}.account{margin-top:24px;text-align:right;color:var(--muted);font-size:10px}@media(max-width:920px){.platform-grid{grid-template-columns:1fr}.op-card{grid-template-columns:60px 1fr}.actions{grid-column:2;flex-direction:row;justify-content:flex-start}.top{flex-direction:column}}@media(max-width:560px){.kpis{grid-template-columns:1fr 1fr}.op-card{grid-template-columns:1fr}.score{width:auto;height:auto;display:flex;gap:4px;justify-content:flex-start;background:transparent!important;box-shadow:none!important}.actions{grid-column:1}.top h1{font-size:42px}}
  </style>
</head>
<body><main class="shell">
  <header class="top">
    <div><div class="eyebrow">Lead Alert · career + side income</div><h1>Career &amp; Side-income Radar</h1><p>Tvrdý fit podle skutečné praxe: primárně project/program management, sekundárně doučování matematiky a fyziky. Automotive, engineering, energy a AI zvyšují skóre jen tehdy, když navazují na jeden z těchto dvou ověřených tracků.</p></div>
    <div class="top-actions">${archiveToggle}<a class="button" href="/student-portal/admin/tutoring/leads/">← Lead Alert</a><button id="refresh" class="button primary" type="button">Zkontrolovat teď</button></div>
  </header>

  <section class="kpis">
    <article class="card kpi"><span>Relevantní opportunities</span><strong>${esc(active.length)}</strong><small>score ≥ ${MIN_VISIBLE_SCORE} · ostatní skryté</small></article>
    <article class="card kpi"><span>HOT</span><strong>${esc(hot)}</strong><small>score ≥ ${HOT_THRESHOLD}</small></article>
    <article class="card kpi"><span>Nové · 7 dní</span><strong>${esc(new7d)}</strong><small>relevantní side-income</small></article>
    <article class="card kpi"><span>Platformy aktivované</span><strong>${esc(platformActive)}</strong><small>registered / active</small></article>
  </section>

  <div class="section-head"><div><h2>${showArchive ? "Všechny opportunities" : "Relevantní opportunities"}</h2><span>${visible.length} zobrazených · hlavní feed začíná na ${MIN_VISIBLE_SCORE}/100</span></div><span>PM praxe + math/physics tutoring · Auto: Alignerr · Mercor · Maven</span></div>
  <section class="list">${visible.map(opportunityCard).join("") || '<article class="card empty">Zatím žádná uložená side-income opportunity. Spusť „Zkontrolovat teď“.</article>'}</section>

  <div class="section-head"><div><h2>Platform coverage</h2><span>Co už je napojené a kde je potřeba profil / ruční search</span></div><span>AUTO · PROFILE · SEARCH</span></div>
  <section class="platform-grid">${platformCards}</section>

  <div class="account">${esc(email)}</div>
</main>
<script>
  const refresh=document.getElementById('refresh');
  refresh?.addEventListener('click',async()=>{refresh.disabled=true;refresh.textContent='Kontroluji…';try{const response=await fetch('${SIDE_INCOME_REFRESH_API_PATH}',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw new Error();location.reload()}catch{refresh.disabled=false;refresh.textContent='Zkusit znovu'}});
  document.querySelectorAll('[data-status]').forEach(button=>button.addEventListener('click',async()=>{const card=button.closest('[data-opportunity-id]');if(!card)return;button.disabled=true;try{const response=await fetch('${SIDE_INCOME_STATUS_API_PATH}',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({id:card.dataset.opportunityId,status:button.dataset.status})});if(!response.ok)throw new Error();location.reload()}catch{button.disabled=false}}));
  document.querySelectorAll('[data-platform-select]').forEach(select=>select.addEventListener('change',async()=>{const card=select.closest('[data-platform-source]');if(!card)return;select.disabled=true;try{const response=await fetch('${SIDE_INCOME_PLATFORM_API_PATH}',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({source:card.dataset.platformSource,status:select.value})});if(!response.ok)throw new Error()}catch{location.reload()}finally{select.disabled=false}}));
</script>
</body></html>`);
}

async function refreshHandler(request: Request, env: SideIncomeEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  return json(await runSideIncomeScan(env));
}

async function statusHandler(request: Request, env: SideIncomeEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return plain("JSON required", 415);
  const payload = await request.json<{ id?: string; status?: string }>();
  const id = String(payload.id || "").trim();
  const status = String(payload.status || "").trim();
  if (!id || !["reviewed","applied","won","lost","ignored"].includes(status)) return json({ error: "Invalid status." }, 400);
  const result = await env.DB.prepare("UPDATE side_income_opportunities SET status = ?2 WHERE id = ?1")
    .bind(id, status)
    .run();
  if (!Number(result.meta.changes || 0)) return json({ error: "Opportunity not found." }, 404);
  return json({ ok: true });
}

async function platformHandler(request: Request, env: SideIncomeEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return plain("JSON required", 415);
  const payload = await request.json<{ source?: string; status?: string }>();
  const source = String(payload.source || "").trim();
  const status = String(payload.status || "").trim();
  if (!source || !["not_started","registered","active","skipped"].includes(status)) return json({ error: "Invalid status." }, 400);
  const result = await env.DB.prepare(`UPDATE side_income_platform_profiles
      SET status = ?2, last_action_at = ?3
      WHERE source = ?1`)
    .bind(source, status, new Date().toISOString())
    .run();
  if (!Number(result.meta.changes || 0)) return json({ error: "Platform not found." }, 404);
  return json({ ok: true });
}

export async function handleSideIncomeRequest(request: Request, env: SideIncomeEnv): Promise<Response | null> {
  const url = new URL(request.url);
  try {
    if (url.pathname === SIDE_INCOME_APP_PATH) return Response.redirect(`${SIDE_INCOME_APP_PATH}/`, 302);
    if (url.pathname === `${SIDE_INCOME_APP_PATH}/`) {
      if (request.method !== "GET") return plain("Method not allowed", 405);
      const email = await requireAdmin(request, env);
      return renderDashboard(await dashboardData(env), email, url.searchParams.get("archive") === "1");
    }
    if (url.pathname === SIDE_INCOME_REFRESH_API_PATH) return refreshHandler(request, env);
    if (url.pathname === SIDE_INCOME_STATUS_API_PATH) return statusHandler(request, env);
    if (url.pathname === SIDE_INCOME_PLATFORM_API_PATH) return platformHandler(request, env);
    return null;
  } catch (error) {
    if (error instanceof PortalError) return plain(error.status >= 500 ? "Service unavailable" : error.message, error.status);
    console.error(JSON.stringify({ event: "side_income_request_error", path: url.pathname, message: error instanceof Error ? error.message : "unknown" }));
    return plain("Internal server error", 500);
  }
}

export async function addSideIncomeLink(response: Response): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes(`${SIDE_INCOME_APP_PATH}/`)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const marker = '<div class="top-actions">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const updated = body.replace(marker, `${marker}<a class="button" href="${SIDE_INCOME_APP_PATH}/">Side-income Radar</a>`);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

export async function addSideIncomeSummaryToLeadDashboard(response: Response, env: SideIncomeEnv): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes('id="sideIncomeSummary"')) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });

  const [top, platforms] = await Promise.all([
    env.DB.prepare(`SELECT id, source_label, title, source_url, score, pay_min, pay_max, pay_currency, pay_unit, fit_reason
                      FROM side_income_opportunities
                     WHERE is_active = 1 AND status NOT IN ('lost','ignored')
                     ORDER BY score DESC, datetime(first_seen_at) DESC
                     LIMIT 5`).all<OpportunityRow>(),
    env.DB.prepare(`SELECT
        SUM(CASE WHEN status IN ('registered','active') THEN 1 ELSE 0 END) AS enabled,
        COUNT(*) AS total
      FROM side_income_platform_profiles`).first<{ enabled: number; total: number }>(),
  ]);

  const rows = (top.results || []).map((row) => {
    const pay = payLabel(row);
    return `<a class="side-income-row" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer"><span class="side-income-score">${esc(row.score)}</span><span class="side-income-main"><strong>${esc(row.title)}</strong><small>${esc(row.source_label)} · ${esc(pay)} · ${esc(row.fit_reason)}</small></span><span>↗</span></a>`;
  }).join("");

  const section = `<section class="card side-income-summary" id="sideIncomeSummary">
    <div class="side-income-head"><div><h3>Side-income Radar</h3><p>AI expert work · paid research · expert networks · contract opportunities</p></div><div><strong>${esc(platforms?.enabled || 0)}/${esc(platforms?.total || 0)}</strong><span>platforem aktivováno</span></div></div>
    <div class="side-income-list">${rows || '<div class="side-income-empty">Zatím žádná aktivní veřejná opportunity.</div>'}</div>
    <a class="button" href="${SIDE_INCOME_APP_PATH}/">Otevřít celý Side-income Radar →</a>
  </section>`;

  let updated = body.replace(
    "</style>",
    `.side-income-summary{padding:17px;margin:0 0 18px}.side-income-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}.side-income-head h3{margin:0;font-size:16px}.side-income-head p{margin:3px 0 0;color:var(--muted);font-size:10px}.side-income-head>div:last-child{text-align:right}.side-income-head>div:last-child strong{display:block;font-size:24px}.side-income-head>div:last-child span{font-size:9px;color:var(--muted)}.side-income-list{display:grid;gap:6px;margin:0 0 12px}.side-income-row{display:grid;grid-template-columns:36px minmax(0,1fr) 16px;gap:9px;align-items:center;padding:9px 10px;border-radius:12px;background:var(--surface-2);color:var(--ink);text-decoration:none}.side-income-score{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--mint-soft);color:#2f7258;font-size:11px;font-weight:900}.side-income-main strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.side-income-main small{display:block;margin-top:2px;color:var(--muted);font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.side-income-empty{font-size:10px;color:var(--muted)}</style>`,
  );

  const marker = '<div class="section-head"><div><h2>Outbound kampaně';
  if (updated.includes(marker)) {
    updated = updated.replace(marker, `${section}${marker}`);
  } else {
    const fallback = '<div class="section-head"><div><h2>Nejnovější leady';
    updated = updated.replace(fallback, `${section}${fallback}`);
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}
