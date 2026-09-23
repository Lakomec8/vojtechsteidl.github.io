import { PortalError, principalForRequest, privateHeaders } from "./entry";

export const LEAD_APP_PATH = "/student-portal/admin/tutoring/leads";
export const LEAD_REFRESH_API_PATH = "/student-portal/api/admin/tutoring/leads/refresh";
export const LEAD_STATUS_API_PATH = "/student-portal/api/admin/tutoring/leads/status";

const DOUCUJI_SOURCE = "doucuji";
const DOUCUJI_FEED_URL = "https://www.doucuji.eu/poptavky-na-doucovani";
const ALERT_THRESHOLD = 75;
const REFERENCE_RATE_CZK = 450;
const PRAGUE_TIME_ZONE = "Europe/Prague";

type LeadEnv = Env & {
  LEAD_ALERT_NTFY_URL?: string;
};

type ParsedLead = {
  id: string;
  source: string;
  externalId: string;
  title: string;
  description: string;
  location: string | null;
  isOnline: boolean;
  subject: string;
  publishedLabel: string | null;
  sourceUrl: string;
  score: number;
};

type LeadRow = {
  id: string;
  source: string;
  external_id: string;
  title: string;
  description: string;
  location: string | null;
  is_online: number;
  subject: string;
  published_label: string | null;
  source_url: string;
  score: number;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
  alerted_at: string | null;
  trial_status: string | null;
  trial_label: string | null;
  trial_week: string | null;
};

type LeadRunRow = {
  source: string;
  run_at: string;
  status: string;
  fetched_count: number;
  new_count: number;
  relevant_count: number;
  message: string | null;
};

export type LeadRunResult = {
  source: string;
  fetched: number;
  relevant: number;
  inserted: number;
  alerted: number;
};

type FunnelRow = {
  leads: number;
  replied: number;
  won: number;
  lost: number;
  online: number;
  avg_score: number | null;
};

type TrialStatsRow = {
  trials: number;
  converted: number;
};

type SubjectStatRow = {
  subject: string;
  count: number;
};

type SourceStatRow = {
  source: string;
  leads: number;
  replied: number;
  won: number;
  avg_score: number | null;
};

type OpportunityStatsRow = {
  active: number;
  high: number;
  recent: number;
};

type OutboundRow = {
  id: string;
  campaign: string;
  target_type: "company" | "university";
  organization: string;
  status: string;
  sent_at: string | null;
  updated_at: string;
  note: string;
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

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
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

function extractHourlyPrice(value: string): number | null {
  const text = normalize(value);
  const patterns = [
    /(\d{3,4})\s*kc\s*(?:\/\s*(?:h|hod|hodinu)|(?:za|na)\s*hod)/g,
    /(?:cena|rozpocet|budget)[^0-9]{0,24}(\d{3,4})\s*kc/g,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const amount = Number(match[1]);
    if (amount >= 250 && amount <= 1500) return amount;
  }
  return null;
}

function estimateWeeklyHours(value: string): number {
  const text = normalize(value);
  const explicit = text.match(/\b([1-7])\s*[x×]\s*(?:za\s*)?(?:tyd|tyden)/);
  if (explicit) return Number(explicit[1]);
  const explicitWords = text.match(/\b([1-7])\s*(?:krat|x)\s*(?:za\s*)?(?:tyd|tyden)/);
  if (explicitWords) return Number(explicitWords[1]);
  if (/intenziv/.test(text)) return 2;
  if (/pravideln|dlouhodob|kazd(?:y|ou)\s+tyden|jednou\s+tydn|1x\s*tydn/.test(text)) return 1;
  return 0;
}

function estimateMonthlyValue(lead: LeadRow): number {
  const weeklyHours = estimateWeeklyHours(`${lead.title} ${lead.description}`);
  if (!weeklyHours) return 0;
  const detectedRate = extractHourlyPrice(`${lead.title} ${lead.description}`) || REFERENCE_RATE_CZK;
  return Math.round(weeklyHours * 4.33 * detectedRate);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function scoreLead(title: string, description: string): { score: number; subject: string; isOnline: boolean } {
  const text = normalize(`${title} ${description}`);
  const hasMath = /\bmatemat|matika\b/.test(text);
  const hasPhysics = /\bfyzik/.test(text);
  if (!hasMath && !hasPhysics) return { score: 0, subject: "", isOnline: false };

  const isOnline = /\bonline\b|skype|teams|google meet|\bmeet\b|zoom/.test(text);
  const explicitlyOffline = /ne\s*on[- ]?line|nechci\s+online|pouze\s+osobn|jen\s+osobn|prezencn/.test(text);
  const exam = /matur|cermat|prijim|prijimac|reparat|zkousk|zapocet/.test(text);
  const higherLevel = /\bss\b|stredn|gymnaz|\bvs\b|vysok|univerzit|fakult|ib\b/.test(text);
  const longTerm = /dlouhodob|pravideln|kazd(y|ou)\s+tyden|1x\s*tydn|jednou\s+tydn|cely\s+skolni/.test(text);
  const local = /jihlava|vysocin|trebic|pelhrimov|havlickuv brod|zdar nad sazavou/.test(text);

  let score = 45;
  if (hasMath && hasPhysics) score += 10;
  if (isOnline) score += 20;
  if (exam) score += 15;
  if (higherLevel) score += 8;
  if (longTerm) score += 10;
  if (local) score += 10;
  if (explicitlyOffline && !local) score -= 20;

  return {
    score: Math.max(1, Math.min(100, score)),
    subject: hasMath && hasPhysics ? "Matematika + fyzika" : hasPhysics ? "Fyzika" : "Matematika",
    isOnline,
  };
}

function extractPublishedLabel(text: string): string | null {
  const match = text.match(/před\s+(?:\d+\s+)?(?:minut(?:ou|ami)?|hodin(?:ou|ami)?|dny|dnem|sekund(?:ou|ami)?)/i);
  return match?.[0] || null;
}

function extractLocation(text: string): string | null {
  const online = text.match(/\bOnline\s*\/\s*([^|·]{2,60})/i);
  if (online?.[1]) return online[1].trim();
  return /\bOnline\b/i.test(text) ? "Online" : null;
}

export function parseDoucujiFeed(sourceHtml: string): ParsedLead[] {
  const matcher = /href=(?:"|')((?:https:\/\/www\.doucuji\.eu)?\/poptavka\/([^"'?#]+))(?:"|')[^>]*>([\s\S]*?)<\/a>/gi;
  const matches: Array<{ href: string; externalId: string; anchor: string; index: number }> = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(sourceHtml)) !== null) {
    const href = match[1];
    const externalId = match[2];
    if (!externalId || seen.has(externalId)) continue;
    seen.add(externalId);
    matches.push({ href, externalId, anchor: match[3], index: match.index });
  }

  return matches.map((item, index) => {
    const nextIndex = matches[index + 1]?.index ?? sourceHtml.length;
    const chunkEnd = Math.min(nextIndex, item.index + 5500);
    const chunk = sourceHtml.slice(item.index, chunkEnd);
    const title = stripHtml(item.anchor).slice(0, 180) || "Poptávka na doučování";
    const fullText = stripHtml(chunk).slice(0, 1800);
    const score = scoreLead(title, fullText);
    const sourceUrl = item.href.startsWith("http") ? item.href : `https://www.doucuji.eu${item.href}`;

    return {
      id: `${DOUCUJI_SOURCE}:${item.externalId}`,
      source: DOUCUJI_SOURCE,
      externalId: item.externalId,
      title,
      description: fullText,
      location: extractLocation(fullText),
      isOnline: score.isOnline,
      subject: score.subject,
      publishedLabel: extractPublishedLabel(fullText),
      sourceUrl,
      score: score.score,
    };
  }).filter((lead) => lead.score > 0);
}

async function requireAdmin(request: Request, env: Env): Promise<string> {
  const principal = await principalForRequest(request, env);
  if (!principal.isAdmin) throw new PortalError(403, "Administrator access is required.");
  return principal.email;
}

async function notifyNewLead(env: LeadEnv, lead: ParsedLead): Promise<boolean> {
  const endpoint = env.LEAD_ALERT_NTFY_URL?.trim();
  if (!endpoint || lead.score < ALERT_THRESHOLD) return false;
  const body = `${lead.subject} · ${lead.score}/100\n${lead.title}\n${lead.description.slice(0, 350)}`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": `Lead Alert · ${lead.score}/100`,
        "Priority": lead.score >= 85 ? "high" : "default",
        "Tags": "dart,tutor",
        "Click": lead.sourceUrl,
      },
      body,
    });
    return response.ok;
  } catch (error) {
    console.error(JSON.stringify({
      event: "lead_alert_notification_error",
      lead_id: lead.id,
      message: error instanceof Error ? error.message : "unknown",
    }));
    return false;
  }
}

async function recordRun(
  env: Env,
  status: "ok" | "error",
  fetched: number,
  inserted: number,
  relevant: number,
  message: string | null,
): Promise<void> {
  await env.DB.prepare(`INSERT INTO tutoring_lead_runs
    (source, run_at, status, fetched_count, new_count, relevant_count, message)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
    .bind(DOUCUJI_SOURCE, new Date().toISOString(), status, fetched, inserted, relevant, message)
    .run();
}

export async function runLeadAlert(env: LeadEnv): Promise<LeadRunResult> {
  let fetched = 0;
  let relevant = 0;
  let inserted = 0;
  let alerted = 0;

  try {
    const response = await fetch(DOUCUJI_FEED_URL, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "VojtechSteidl-TutoringLeadMonitor/1.0 (+https://vojtechsteidl.eu/)",
      },
    });
    if (!response.ok) throw new Error(`Doucuji feed HTTP ${response.status}`);

    const sourceHtml = await response.text();
    const allLeadLinks = sourceHtml.match(/\/poptavka\/[^"'?#<\s]+/gi) || [];
    fetched = new Set(allLeadLinks).size;
    const leads = parseDoucujiFeed(sourceHtml);
    relevant = leads.length;
    const seenAt = new Date().toISOString();

    for (const lead of leads) {
      const insertResult = await env.DB.prepare(`INSERT OR IGNORE INTO tutoring_leads
        (id, source, external_id, title, description, location, is_online, subject, published_label,
         source_url, score, status, first_seen_at, last_seen_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'new', ?12, ?12)`)
        .bind(
          lead.id,
          lead.source,
          lead.externalId,
          lead.title,
          lead.description,
          lead.location,
          lead.isOnline ? 1 : 0,
          lead.subject,
          lead.publishedLabel,
          lead.sourceUrl,
          lead.score,
          seenAt,
        ).run();

      const wasInserted = Number(insertResult.meta.changes || 0) > 0;
      if (wasInserted) {
        inserted += 1;
        if (await notifyNewLead(env, lead)) {
          alerted += 1;
          await env.DB.prepare("UPDATE tutoring_leads SET alerted_at = ?2 WHERE id = ?1")
            .bind(lead.id, seenAt)
            .run();
        }
      } else {
        await env.DB.prepare(`UPDATE tutoring_leads
          SET title = ?2, description = ?3, location = ?4, is_online = ?5, subject = ?6,
              published_label = ?7, source_url = ?8, score = ?9, last_seen_at = ?10
          WHERE id = ?1`)
          .bind(
            lead.id,
            lead.title,
            lead.description,
            lead.location,
            lead.isOnline ? 1 : 0,
            lead.subject,
            lead.publishedLabel,
            lead.sourceUrl,
            lead.score,
            seenAt,
          ).run();
      }
    }

    await recordRun(env, "ok", fetched, inserted, relevant, null);
    console.log(JSON.stringify({ event: "lead_alert_run", source: DOUCUJI_SOURCE, fetched, relevant, inserted, alerted }));
    return { source: DOUCUJI_SOURCE, fetched, relevant, inserted, alerted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await recordRun(env, "error", fetched, inserted, relevant, message).catch(() => undefined);
    console.error(JSON.stringify({ event: "lead_alert_run_error", source: DOUCUJI_SOURCE, message }));
    throw error;
  }
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

function sourceLabel(source: string): string {
  return source === DOUCUJI_SOURCE ? "Doučuji.eu" : source;
}

function moneyLabel(value: number): string {
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(value)} Kč`;
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function statusLabel(status: string): string {
  return ({
    new: "Nový",
    reviewed: "Zkontrolováno",
    replied: "Odpovězeno",
    won: "Získáno",
    lost: "Nezískáno",
    ignored: "Ignorováno",
  } as Record<string, string>)[status] || status;
}

async function leadDashboardData(env: LeadEnv): Promise<{
  leads: LeadRow[];
  run: LeadRunRow | null;
  new24h: number;
  hot24h: number;
  notificationsConfigured: boolean;
  funnel7: FunnelRow;
  funnel30: FunnelRow;
  trials7: TrialStatsRow;
  trials30: TrialStatsRow;
  previous7: number;
  subjects30: SubjectStatRow[];
  sources30: SourceStatRow[];
  opportunityStats: OpportunityStatsRow;
  priceMedian: number | null;
  priceSamples: number;
  pipelineMonthlyValue: number;
  outbound: OutboundRow[];
}> {
  const funnelSql = (days: number) => `SELECT
      COUNT(*) AS leads,
      SUM(CASE WHEN status IN ('replied','won') THEN 1 ELSE 0 END) AS replied,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lost,
      SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) AS online,
      AVG(score) AS avg_score
    FROM tutoring_leads
    WHERE datetime(first_seen_at) >= datetime('now', '-${days} day')`;

  const trialSql = (days: number) => `SELECT
      COUNT(*) AS trials,
      SUM(CASE WHEN t.status = 'converted' THEN 1 ELSE 0 END) AS converted
    FROM tutoring_lead_trials t
    JOIN tutoring_leads l ON l.id = t.lead_id
    WHERE datetime(l.first_seen_at) >= datetime('now', '-${days} day')`;

  const [
    leads,
    run,
    new24h,
    hot24h,
    funnel7Raw,
    funnel30Raw,
    trials7Raw,
    trials30Raw,
    previous7,
    subjects30,
    sources30,
    opportunityStatsRaw,
  ] = await Promise.all([
    env.DB.prepare(`SELECT l.id, l.source, l.external_id, l.title, l.description, l.location, l.is_online, l.subject,
                           l.published_label, l.source_url, l.score, l.status, l.first_seen_at, l.last_seen_at, l.alerted_at,
                           t.status AS trial_status, t.prospect_label AS trial_label, t.scheduled_week AS trial_week
                      FROM tutoring_leads l
                      LEFT JOIN tutoring_lead_trials t ON t.lead_id = l.id
                     ORDER BY CASE l.status WHEN 'new' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END,
                              l.score DESC, datetime(l.first_seen_at) DESC
                     LIMIT 120`).all<LeadRow>(),
    env.DB.prepare(`SELECT source, run_at, status, fetched_count, new_count, relevant_count, message
                      FROM tutoring_lead_runs
                     WHERE source = ?1
                     ORDER BY id DESC
                     LIMIT 1`).bind(DOUCUJI_SOURCE).first<LeadRunRow>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE datetime(first_seen_at) >= datetime('now', '-1 day')")
      .first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM tutoring_leads WHERE score >= ?1 AND datetime(first_seen_at) >= datetime('now', '-1 day')")
      .bind(ALERT_THRESHOLD).first<{ count: number }>(),
    env.DB.prepare(funnelSql(7)).first<FunnelRow>(),
    env.DB.prepare(funnelSql(30)).first<FunnelRow>(),
    env.DB.prepare(trialSql(7)).first<TrialStatsRow>(),
    env.DB.prepare(trialSql(30)).first<TrialStatsRow>(),
    env.DB.prepare(`SELECT COUNT(*) AS count
                       FROM tutoring_leads
                      WHERE datetime(first_seen_at) >= datetime('now', '-14 day')
                        AND datetime(first_seen_at) < datetime('now', '-7 day')`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COALESCE(NULLIF(subject, ''), 'Ostatní') AS subject, COUNT(*) AS count
                       FROM tutoring_leads
                      WHERE datetime(first_seen_at) >= datetime('now', '-30 day')
                      GROUP BY COALESCE(NULLIF(subject, ''), 'Ostatní')
                      ORDER BY count DESC
                      LIMIT 5`).all<SubjectStatRow>(),
    env.DB.prepare(`SELECT source,
                           COUNT(*) AS leads,
                           SUM(CASE WHEN status IN ('replied','won') THEN 1 ELSE 0 END) AS replied,
                           SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won,
                           AVG(score) AS avg_score
                      FROM tutoring_leads
                     WHERE datetime(first_seen_at) >= datetime('now', '-30 day')
                     GROUP BY source
                     ORDER BY leads DESC`).all<SourceStatRow>(),
    env.DB.prepare(`SELECT
        COUNT(*) AS active,
        SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) AS high,
        SUM(CASE WHEN datetime(first_seen_at) >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS recent
      FROM eu_opportunities
      WHERE status IN ('new','reviewed')`).first<OpportunityStatsRow>(),
  ]);

  const outbound = await env.DB.prepare(`SELECT id, campaign, target_type, organization, status, sent_at, updated_at, note
      FROM tutoring_outbound_contacts
     ORDER BY CASE target_type WHEN 'company' THEN 0 ELSE 1 END, organization COLLATE NOCASE`).all<OutboundRow>();

  const leadRows = leads.results || [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentLeadRows = leadRows.filter((lead) => {
    const seen = Date.parse(lead.first_seen_at);
    return Number.isFinite(seen) && seen >= thirtyDaysAgo;
  });
  const prices = recentLeadRows
    .map((lead) => extractHourlyPrice(`${lead.title} ${lead.description}`))
    .filter((value): value is number => value !== null);
  const pipelineMonthlyValue = leadRows
    .filter((lead) => ["new", "reviewed", "replied"].includes(lead.status))
    .reduce((sum, lead) => sum + estimateMonthlyValue(lead), 0);

  const funnel7 = funnel7Raw || { leads: 0, replied: 0, won: 0, lost: 0, online: 0, avg_score: null };
  const funnel30 = funnel30Raw || { leads: 0, replied: 0, won: 0, lost: 0, online: 0, avg_score: null };
  const trials7 = trials7Raw || { trials: 0, converted: 0 };
  const trials30 = trials30Raw || { trials: 0, converted: 0 };
  const opportunityStats = opportunityStatsRaw || { active: 0, high: 0, recent: 0 };

  return {
    leads: leadRows,
    run,
    new24h: Number(new24h?.count || 0),
    hot24h: Number(hot24h?.count || 0),
    notificationsConfigured: Boolean(env.LEAD_ALERT_NTFY_URL?.trim()),
    funnel7: {
      leads: Number(funnel7.leads || 0),
      replied: Number(funnel7.replied || 0),
      won: Number(funnel7.won || 0),
      lost: Number(funnel7.lost || 0),
      online: Number(funnel7.online || 0),
      avg_score: funnel7.avg_score == null ? null : Number(funnel7.avg_score),
    },
    funnel30: {
      leads: Number(funnel30.leads || 0),
      replied: Number(funnel30.replied || 0),
      won: Number(funnel30.won || 0),
      lost: Number(funnel30.lost || 0),
      online: Number(funnel30.online || 0),
      avg_score: funnel30.avg_score == null ? null : Number(funnel30.avg_score),
    },
    trials7: {
      trials: Number(trials7.trials || 0),
      converted: Number(trials7.converted || 0),
    },
    trials30: {
      trials: Number(trials30.trials || 0),
      converted: Number(trials30.converted || 0),
    },
    previous7: Number(previous7?.count || 0),
    subjects30: (subjects30.results || []).map((row) => ({ subject: row.subject, count: Number(row.count || 0) })),
    sources30: (sources30.results || []).map((row) => ({
      source: row.source,
      leads: Number(row.leads || 0),
      replied: Number(row.replied || 0),
      won: Number(row.won || 0),
      avg_score: row.avg_score == null ? null : Number(row.avg_score),
    })),
    opportunityStats: {
      active: Number(opportunityStats.active || 0),
      high: Number(opportunityStats.high || 0),
      recent: Number(opportunityStats.recent || 0),
    },
    priceMedian: median(prices),
    priceSamples: prices.length,
    pipelineMonthlyValue,
    outbound: outbound.results || [],
  };
}

function renderLeadDashboard(
  data: Awaited<ReturnType<typeof leadDashboardData>>,
  email: string,
): Response {
  const hot = data.leads.filter((lead) => lead.score >= ALERT_THRESHOLD && !["ignored", "lost"].includes(lead.status));
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const hot7d = data.leads.filter((lead) => {
    const seen = Date.parse(lead.first_seen_at);
    return Number.isFinite(seen) && seen >= weekAgo && lead.score >= ALERT_THRESHOLD;
  }).length;
  const onlineShare30 = percent(data.funnel30.online, data.funnel30.leads);
  const responseRate30 = percent(data.funnel30.replied, data.funnel30.leads);
  const conversion30 = percent(Math.max(data.funnel30.won, data.trials30.converted), data.funnel30.leads);
  const trendPercent = data.previous7 > 0
    ? Math.round(((data.funnel7.leads - data.previous7) / data.previous7) * 100)
    : null;
  const trendLabel = trendPercent == null
    ? (data.funnel7.leads ? "nový baseline" : "bez dat")
    : `${trendPercent >= 0 ? "+" : ""}${trendPercent}% vs. předchozích 7 dní`;
  const subjectMax = Math.max(1, ...data.subjects30.map((row) => row.count));
  const subjectRows = data.subjects30.map((row) => `<div class="subject-row"><span>${esc(row.subject)}</span><div class="bar"><i style="width:${Math.max(8, Math.round((row.count / subjectMax) * 100))}%"></i></div><strong>${esc(row.count)}</strong></div>`).join("");
  const sourceRows = data.sources30.map((row) => `<div class="source-row"><strong>${esc(sourceLabel(row.source))}</strong><span>${esc(row.leads)} leadů</span><span>${esc(percent(row.replied, row.leads))}% odpovězeno</span><span>${esc(row.won)} získáno</span><span>avg ${esc(row.avg_score == null ? "—" : Math.round(row.avg_score))}/100</span></div>`).join("");
  const companiesOutbound = data.outbound.filter((row) => row.target_type === "company");
  const universitiesOutbound = data.outbound.filter((row) => row.target_type === "university");
  const outboundList = (items: OutboundRow[]) => items.map((row) => `<div class="outbound-row"><span class="outbound-org">${esc(row.organization)}</span><span class="outbound-date">${esc(row.sent_at || "—")}</span><strong class="outbound-status">${esc(row.status === "written" ? "Napsáno" : row.status)}</strong></div>`).join("");

  const rows = data.leads.map((lead) => {
    const description = lead.description.length > 430 ? `${lead.description.slice(0, 430)}…` : lead.description;
    const scoreClass = lead.score >= 90 ? "hot" : lead.score >= ALERT_THRESHOLD ? "good" : "normal";
    const monthlyValue = estimateMonthlyValue(lead);
    return `<article class="lead-card" data-lead-id="${esc(lead.id)}">
      <div class="score ${scoreClass}"><strong>${esc(lead.score)}</strong><span>/100</span></div>
      <div class="lead-main">
        <div class="lead-meta"><span class="source">${esc(sourceLabel(lead.source))}</span><span>${esc(lead.subject || "Relevantní")}</span>${lead.is_online ? '<span class="online">Online</span>' : ""}${lead.trial_status ? `<span class="trial">Zkušební · ${esc(lead.trial_label || lead.trial_status)}</span>` : ""}<span>${esc(lead.published_label || dateLabel(lead.first_seen_at))}</span></div>
        <h2>${esc(lead.title)}</h2>
        <p>${esc(description)}</p>
        <div class="lead-footer"><span class="status status-${esc(lead.status)}">${esc(statusLabel(lead.status))}</span><span>Poprvé zachyceno ${esc(dateLabel(lead.first_seen_at))}</span>${monthlyValue ? `<span>Potenciál ~${esc(moneyLabel(monthlyValue))}/měs.</span>` : ""}${lead.alerted_at ? '<span>Push odeslán</span>' : ""}</div>
      </div>
      <div class="lead-actions">
        <a class="button primary" href="${esc(lead.source_url)}" target="_blank" rel="noopener noreferrer">Otevřít poptávku ↗</a>
        <button class="button" type="button" data-status="replied">Odpovězeno</button>
        <button class="button" type="button" data-status="won">Získáno</button>
        <button class="button" type="button" data-status="lost">Nezískáno</button>
        <button class="button ghost" type="button" data-status="ignored">Ignorovat</button>
      </div>
    </article>`;
  }).join("");

  const runState = data.run?.status === "ok" ? "Běží" : data.run ? "Chyba" : "Čeká na první běh";
  const runClass = data.run?.status === "error" ? "error" : "ok";

  return html(`<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Lead Alert · Tutoring OS</title>
  <style>
    :root{--ink:#272823;--muted:#73756d;--paper:#f2f0e9;--surface:#fbfaf6;--surface-2:#e9e7df;--line:#d5d2c8;--mint:#9ee8ca;--mint-strong:#68d5aa;--mint-soft:#dff7ed;--amber:#e7c86f;--red:#e4867f;--blue:#e5eef3;--shadow:0 18px 38px rgba(55,52,43,.12),0 3px 8px rgba(55,52,43,.08);--shadow-soft:0 8px 18px rgba(55,52,43,.09);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background-color:var(--paper);background-image:linear-gradient(rgba(62,63,57,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(62,63,57,.055) 1px,transparent 1px);background-size:36px 36px}.shell{width:min(1240px,calc(100% - 32px));margin:24px auto 60px}.topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#557765}.topbar h1{font-size:clamp(34px,5vw,60px);line-height:1;letter-spacing:-.055em;margin:8px 0}.topbar p{margin:0;color:var(--muted)}.top-actions{display:flex;gap:8px;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;padding:9px 14px;color:var(--ink);background:var(--surface);text-decoration:none;font-weight:800;font-size:12px;box-shadow:var(--shadow-soft);cursor:pointer}.button.primary{background:var(--mint);border-color:#83dcb9}.button.ghost{background:transparent;box-shadow:none}.button:disabled{opacity:.55;cursor:wait}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.card{background:rgba(251,250,246,.94);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-soft)}.kpi{padding:17px;min-height:120px;display:flex;flex-direction:column}.kpi span{font-size:11px;color:var(--muted);font-weight:800}.kpi strong{font-size:32px;letter-spacing:-.04em;margin-top:auto}.sync-line{display:flex;align-items:center;gap:8px}.dot{width:9px;height:9px;border-radius:50%;background:var(--mint-strong);box-shadow:0 0 0 4px var(--mint-soft)}.dot.error{background:var(--red);box-shadow:0 0 0 4px #f7dfdd}.notice{padding:14px 16px;margin-bottom:16px;border-radius:16px;background:#f6edce;color:#6f5b1f;border:1px solid #ead797;font-size:12px;line-height:1.5}.notice strong{color:#594714}.list{display:grid;gap:11px}.lead-card{display:grid;grid-template-columns:76px minmax(0,1fr) 150px;gap:16px;padding:17px;background:rgba(251,250,246,.96);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow-soft)}.score{width:67px;height:67px;border-radius:18px;background:var(--surface-2);display:grid;place-items:center;align-content:center}.score strong{font-size:25px;line-height:1}.score span{font-size:10px;color:var(--muted)}.score.good{background:var(--mint-soft);color:#2f7258}.score.hot{background:#d4f3e5;color:#24684d;box-shadow:inset 0 0 0 1px #8fd9ba}.lead-meta{display:flex;gap:7px;flex-wrap:wrap;color:var(--muted);font-size:10px;font-weight:800}.lead-meta span{padding:4px 7px;border-radius:99px;background:var(--surface-2)}.lead-meta .source{background:#e5eef3;color:#4f7187}.lead-meta .online{background:var(--mint-soft);color:#347c61}.lead-meta .trial{background:#f6edce;color:#725d1f}.lead-main h2{font-size:18px;margin:9px 0 6px;letter-spacing:-.02em}.lead-main p{font-size:12px;line-height:1.55;color:#5f615a;margin:0}.lead-footer{display:flex;gap:10px;flex-wrap:wrap;margin-top:11px;color:var(--muted);font-size:10px}.status{font-weight:900}.status-new{color:#2f7258}.status-replied{color:#4f7187}.status-won{color:#2f7258}.status-lost,.status-ignored{color:#8b695f}.lead-actions{display:flex;flex-direction:column;gap:7px;justify-content:center}.empty{padding:42px;text-align:center;color:var(--muted)}.account{margin-top:24px;color:var(--muted);font-size:10px;text-align:right}.section-head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin:26px 0 10px}.section-head h2{margin:0;font-size:20px}.section-head span{font-size:11px;color:var(--muted)}.analytics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 18px}.analytics-card{padding:17px;min-height:190px}.analytics-card h3{margin:0 0 4px;font-size:15px}.analytics-card .big{font-size:30px;letter-spacing:-.04em;font-weight:900}.analytics-card .sub{font-size:10px;color:var(--muted);font-weight:800}.trend{display:inline-flex;margin-top:7px;padding:5px 8px;border-radius:99px;background:var(--mint-soft);color:#347c61;font-size:10px;font-weight:900}.funnel{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:15px}.funnel-step{padding:9px 6px;border-radius:12px;background:var(--surface-2);text-align:center}.funnel-step strong{display:block;font-size:19px}.funnel-step span{font-size:8px;color:var(--muted);font-weight:900;text-transform:uppercase}.subject-list{display:grid;gap:6px;margin-top:12px}.subject-row{display:grid;grid-template-columns:minmax(72px,1fr) 1.5fr 24px;gap:7px;align-items:center;font-size:9px;color:var(--muted)}.subject-row>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar{height:7px;background:var(--surface-2);border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:var(--mint-strong);border-radius:99px}.subject-row strong{text-align:right;color:var(--ink)}.mini-stats{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px}.mini-stat strong{display:block;font-size:20px}.mini-stat span{font-size:9px;color:var(--muted);font-weight:800}.source-performance{padding:14px 17px;margin:0 0 18px}.source-performance h3{font-size:12px;margin:0 0 9px;text-transform:uppercase;letter-spacing:.08em;color:#557765}.source-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:10px;color:var(--muted)}.source-row strong{color:var(--ink)}.market-link{margin-top:13px}.market-link .button{box-shadow:none}.muted-note{font-size:9px;color:var(--muted);line-height:1.4;margin-top:8px}
    .outbound-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 18px}.outbound-card{padding:17px}.outbound-card h3{margin:0 0 4px;font-size:15px}.outbound-card>p{margin:0 0 12px;color:var(--muted);font-size:10px}.outbound-list{display:grid;gap:5px}.outbound-row{display:grid;grid-template-columns:minmax(0,1fr) 82px 82px;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:var(--surface-2);font-size:10px}.outbound-org{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.outbound-date{color:var(--muted);text-align:right}.outbound-status{display:inline-flex;justify-content:center;padding:4px 7px;border-radius:99px;background:var(--mint-soft);color:#347c61;font-size:9px}.outbound-note{font-size:10px;color:var(--muted);font-weight:800}
    @media(max-width:1050px){.analytics{grid-template-columns:1fr 1fr}.outbound-grid{grid-template-columns:1fr}}
    @media(max-width:850px){.kpis{grid-template-columns:1fr 1fr}.lead-card{grid-template-columns:60px 1fr}.score{width:55px;height:55px}.lead-actions{grid-column:2;flex-direction:row;flex-wrap:wrap;justify-content:flex-start}.topbar{flex-direction:column}.lead-actions .button{width:auto}}
    @media(max-width:520px){.shell{width:min(100% - 20px,1240px);margin-top:14px}.kpis,.analytics{grid-template-columns:1fr}.kpi{min-height:105px}.lead-card{grid-template-columns:1fr}.score{width:auto;height:auto;display:flex;gap:4px;justify-content:flex-start;background:transparent!important;box-shadow:none!important}.lead-actions{grid-column:1}.topbar h1{font-size:38px}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div><div class="eyebrow">Tutoring OS · acquisition intelligence</div><h1>Lead Alert</h1><p>Leady, mini‑CRM a market radar v jednom místě · Doučuji.eu se kontroluje každých 5 minut.</p></div>
      <div class="top-actions"><a class="button" href="/student-portal/admin/tutoring/">← Tutoring OS</a><button id="refresh" class="button primary" type="button">Zkontrolovat teď</button></div>
    </header>

    <section class="kpis">
      <article class="card kpi"><span>Monitoring</span><strong class="sync-line"><i class="dot ${runClass}"></i>${esc(runState)}</strong><small>${esc(data.run ? `Poslední check ${dateLabel(data.run.run_at)}` : "Cron se aktivuje po nasazení")}</small></article>
      <article class="card kpi"><span>Leady · 7 dní</span><strong>${esc(data.funnel7.leads)}</strong><small>${esc(trendLabel)}</small></article>
      <article class="card kpi"><span>HOT · 7 dní</span><strong>${esc(hot7d)}</strong><small>Skóre ≥ ${ALERT_THRESHOLD}</small></article>
      <article class="card kpi"><span>Pipeline value</span><strong>${esc(moneyLabel(data.pipelineMonthlyValue))}</strong><small>měsíční odhad z rozpoznané pravidelnosti</small></article>
    </section>

    <section class="analytics">
      <article class="card analytics-card">
        <h3>Poptávka · 30 dní</h3>
        <div class="big">${esc(data.funnel30.leads)}</div>
        <div class="sub">${esc(onlineShare30)} % online · avg score ${esc(data.funnel30.avg_score == null ? "—" : Math.round(data.funnel30.avg_score))}/100</div>
        <span class="trend">${esc(trendLabel)}</span>
        <div class="subject-list">${subjectRows || '<div class="muted-note">Zatím málo dat pro rozpad podle předmětu.</div>'}</div>
      </article>

      <article class="card analytics-card">
        <h3>Acquisition funnel · 30 dní</h3>
        <div class="funnel">
          <div class="funnel-step"><strong>${esc(data.funnel30.leads)}</strong><span>Leady</span></div>
          <div class="funnel-step"><strong>${esc(data.funnel30.replied)}</strong><span>Odpověď</span></div>
          <div class="funnel-step"><strong>${esc(data.trials30.trials)}</strong><span>Trial</span></div>
          <div class="funnel-step"><strong>${esc(Math.max(data.funnel30.won, data.trials30.converted))}</strong><span>Student</span></div>
        </div>
        <div class="mini-stats">
          <div class="mini-stat"><strong>${esc(responseRate30)} %</strong><span>response rate</span></div>
          <div class="mini-stat"><strong>${esc(conversion30)} %</strong><span>lead → student</span></div>
          <div class="mini-stat"><strong>${esc(data.funnel30.lost)}</strong><span>lost</span></div>
        </div>
      </article>

      <article class="card analytics-card">
        <h3>Price & value radar</h3>
        <div class="big">${esc(data.priceMedian == null ? "—" : moneyLabel(data.priceMedian))}</div>
        <div class="sub">${data.priceSamples ? `medián z ${esc(data.priceSamples)} rozpoznaných cenových signálů` : "v poptávkách zatím nejsou spolehlivé cenové signály"}</div>
        <div class="mini-stats">
          <div class="mini-stat"><strong>${esc(moneyLabel(data.pipelineMonthlyValue))}</strong><span>potenciální MRR</span></div>
          <div class="mini-stat"><strong>${esc(moneyLabel(REFERENCE_RATE_CZK))}</strong><span>fallback sazba / h</span></div>
        </div>
        <div class="muted-note">MRR se odhaduje jen tam, kde text poptávky obsahuje rozpoznatelnou pravidelnost. Nejasné leady se do odhadu nezapočítávají.</div>
      </article>

      <article class="card analytics-card">
        <h3>Jobs & side‑income radar</h3>
        <div class="big">${esc(data.opportunityStats.high)}</div>
        <div class="sub">aktivních příležitostí se score ≥ 75</div>
        <div class="mini-stats">
          <div class="mini-stat"><strong>${esc(data.opportunityStats.active)}</strong><span>aktivní EU</span></div>
          <div class="mini-stat"><strong>${esc(data.opportunityStats.recent)}</strong><span>nové · 7 dní</span></div>
        </div>
        <div class="market-link"><a class="button" href="/student-portal/admin/opportunities/">Otevřít Opportunity Radar →</a></div>
      </article>
    </section>

    <section class="card source-performance">
      <h3>Source performance · 30 dní</h3>
      ${sourceRows || '<div class="muted-note">Zatím bez dostatečných dat.</div>'}
    </section>

    ${data.notificationsConfigured
      ? '<div class="notice"><strong>Push kanál je aktivní.</strong> Nový lead se skóre nad limitem se pošle ihned po zachycení.</div>'
      : '<div class="notice"><strong>Serverový monitoring je nezávislý na ChatGPT a poběží 24/7.</strong> Externí push kanál zatím není nakonfigurován; leady se ukládají sem. Kód má připravený bezpečný webhook přes Cloudflare secret, takže push lze dopnout bez změny crawleru.</div>'}

    <div class="section-head"><div><h2>Outbound kampaně</h2><span>${esc(data.outbound.length)} kontaktů · ${esc(companiesOutbound.length)} firem · ${esc(universitiesOutbound.length)} VŠ/fakult</span></div><span class="outbound-note">Napsáno = mail skutečně odeslán</span></div>
    <section class="outbound-grid">
      <article class="card outbound-card">
        <h3>Doučování jako benefit · firmy</h3>
        <p>HR / zaměstnanecké benefity · personalizovaná regionální kampaň</p>
        <div class="outbound-list">${outboundList(companiesOutbound)}</div>
      </article>
      <article class="card outbound-card">
        <h3>Podpora prváků · vysoké školy</h3>
        <p>Studijní oddělení / fakulty · externí individuální podpora</p>
        <div class="outbound-list">${outboundList(universitiesOutbound)}</div>
      </article>
    </section>

    <div class="section-head"><div><h2>Nejnovější leady</h2><span>${esc(data.leads.length)} uložených záznamů</span></div><span>Doučuji.eu aktivní · Bazoš automatizace vypnuta kvůli podmínkám platformy</span></div>
    <section class="list" id="leadList">${rows || '<article class="card empty">Zatím nebyla zachycena relevantní poptávka. Po prvním cron checku se data objeví automaticky.</article>'}</section>
    <div class="account">${esc(email)}</div>
  </main>
  <script>
    const refresh=document.getElementById('refresh');
    refresh?.addEventListener('click',async()=>{refresh.disabled=true;refresh.textContent='Kontroluji…';try{const response=await fetch('${LEAD_REFRESH_API_PATH}',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw new Error('Refresh failed');location.reload()}catch{refresh.disabled=false;refresh.textContent='Zkusit znovu'}});
    document.querySelectorAll('[data-status]').forEach(button=>button.addEventListener('click',async()=>{const card=button.closest('[data-lead-id]');if(!card)return;button.disabled=true;try{const response=await fetch('${LEAD_STATUS_API_PATH}',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({id:card.dataset.leadId,status:button.dataset.status})});if(!response.ok)throw new Error('Status update failed');location.reload()}catch{button.disabled=false}}));
  </script>
</body>
</html>`);
}

async function refreshHandler(request: Request, env: LeadEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  const result = await runLeadAlert(env);
  return json(result);
}

async function statusHandler(request: Request, env: LeadEnv): Promise<Response> {
  await requireAdmin(request, env);
  if (request.method !== "POST") return plain("Method not allowed", 405);
  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") return plain("Missing request marker", 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return plain("JSON required", 415);
  const payload = await request.json<{ id?: string; status?: string }>();
  const id = String(payload.id || "").trim();
  const status = String(payload.status || "").trim();
  if (!id || !["reviewed", "replied", "won", "lost", "ignored"].includes(status)) return json({ error: "Invalid status." }, 400);
  const result = await env.DB.prepare("UPDATE tutoring_leads SET status = ?2 WHERE id = ?1").bind(id, status).run();
  if (!Number(result.meta.changes || 0)) return json({ error: "Lead not found." }, 404);
  return json({ ok: true });
}

export async function handleLeadAlertRequest(request: Request, env: LeadEnv): Promise<Response | null> {
  const url = new URL(request.url);
  try {
    if (url.pathname === LEAD_APP_PATH) return Response.redirect(`${LEAD_APP_PATH}/`, 302);
    if (url.pathname === `${LEAD_APP_PATH}/`) {
      if (request.method !== "GET") return plain("Method not allowed", 405);
      const email = await requireAdmin(request, env);
      return renderLeadDashboard(await leadDashboardData(env), email);
    }
    if (url.pathname === LEAD_REFRESH_API_PATH) return refreshHandler(request, env);
    if (url.pathname === LEAD_STATUS_API_PATH) return statusHandler(request, env);
    return null;
  } catch (error) {
    if (error instanceof PortalError) return plain(error.status >= 500 ? "Service unavailable" : error.message, error.status);
    console.error(JSON.stringify({
      event: "lead_alert_request_error",
      path: url.pathname,
      message: error instanceof Error ? error.message : "unknown",
    }));
    return plain("Internal server error", 500);
  }
}

export async function addLeadAlertLink(response: Response): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes(`${LEAD_APP_PATH}/`)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const marker = '<div class="top-actions">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const updated = body.replace(marker, `${marker}<a class="button" href="${LEAD_APP_PATH}/">Lead Alert</a>`);
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}
