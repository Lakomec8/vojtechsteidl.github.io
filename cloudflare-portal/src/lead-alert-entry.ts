import tutoringCronWorker from "./tutoring-cron-entry";
import {
  LEAD_APP_PATH,
  LEAD_REFRESH_API_PATH,
  addLeadAlertLink,
  handleLeadAlertRequest,
  runLeadAlert,
} from "./lead-alert";
import {
  addLeadPushLink,
  ensureLeadPushChannel,
  handleLeadPushRequest,
} from "./lead-push";
import {
  addLeadDraftsToDashboard,
  ensureLeadDrafts,
  runLeadPushWithDrafts,
} from "./lead-draft";

type WorkerRequest = Parameters<typeof tutoringCronWorker.fetch>[0];
type LeadEnv = Env & {
  LEAD_ALERT_NTFY_URL?: string;
};

type LeadOrderRow = {
  id: string;
  status: string;
};

const TUTORING_APP_PATH = "/student-portal/admin/tutoring/";
const RESOLVED_LEAD_STATUSES = new Set(["replied", "won", "lost", "ignored"]);

async function collectAndPush(env: LeadEnv): Promise<void> {
  await ensureLeadPushChannel(env);
  await runLeadAlert(env);
  await ensureLeadDrafts(env);
  await runLeadPushWithDrafts(env);
}

async function orderLeadDashboard(response: Response, env: LeadEnv, showResolved: boolean): Promise<Response> {
  if (!response.ok || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;

  const body = await response.text();
  const cardPattern = /<article class="lead-card" data-lead-id="([^"]+)">[\s\S]*?<\/article>/g;
  const cards = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(body)) !== null) {
    cards.set(match[1], match[0]);
  }
  if (!cards.size) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });

  const ordered = await env.DB.prepare(`SELECT id, status
      FROM tutoring_leads
     ORDER BY datetime(first_seen_at) DESC, id DESC
     LIMIT 120`).all<LeadOrderRow>();

  const used = new Set<string>();
  const orderedCards: string[] = [];
  let hiddenResolved = 0;
  for (const row of ordered.results || []) {
    let card = cards.get(row.id);
    if (!card) continue;
    used.add(row.id);

    const isResolved = RESOLVED_LEAD_STATUSES.has(row.status);
    if (isResolved && !showResolved) {
      hiddenResolved += 1;
      continue;
    }

    if (["replied", "won"].includes(row.status)) {
      card = card.replace(
        '<button class="button" type="button" data-status="replied">Odpovězeno</button>',
        '<button class="button" type="button" disabled title="Tento lead je už označený jako odpovězený.">Už odpovězeno</button>',
      );
    }
    if (isResolved && showResolved) {
      card = card.replace('<article class="lead-card"', '<article class="lead-card resolved-card"');
    }
    orderedCards.push(card);
  }

  for (const [id, card] of cards) {
    if (!used.has(id)) orderedCards.push(card);
  }

  let updated = body.replace(
    /<section class="list" id="leadList">[\s\S]*?<\/section>/,
    `<section class="list" id="leadList">${orderedCards.join("")}</section>`,
  );

  updated = updated.replace(
    /<h2>Nejnovější leady<\/h2><span>[^<]*<\/span>/,
    `<h2>${showResolved ? "Všechny leady" : "Aktivní leady"}</h2><span>${orderedCards.length} zobrazených${!showResolved && hiddenResolved ? ` · ${hiddenResolved} vyřízených skryto` : ""}</span>`,
  );
  updated = updated.replace(
    "Doučuji.eu aktivní · Bazoš automatizace vypnuta kvůli podmínkám platformy",
    "Řazení: nejnovější zachycené nahoře · Doučuji.eu aktivní",
  );

  const toggle = showResolved
    ? `<a class="button" href="${LEAD_APP_PATH}/">Skrýt vyřízené</a>`
    : `<a class="button" href="${LEAD_APP_PATH}/?resolved=1">Zobrazit vyřízené${hiddenResolved ? ` (${hiddenResolved})` : ""}</a>`;
  updated = updated.replace('<div class="top-actions">', `<div class="top-actions">${toggle}`);

  if (showResolved) {
    updated = updated.replace(
      "</style>",
      ".lead-card.resolved-card{opacity:.56;background:#e7e5de;border-style:dashed}.lead-card.resolved-card:hover{opacity:.78}</style>",
    );
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: LeadEnv): Promise<Response> {
    const url = new URL(request.url);

    const pushResponse = await handleLeadPushRequest(request, env);
    if (pushResponse) return pushResponse;

    const isManualLeadRefresh = request.method === "POST" && url.pathname === LEAD_REFRESH_API_PATH;
    if (isManualLeadRefresh) await ensureLeadPushChannel(env);

    const leadResponse = await handleLeadAlertRequest(request, env);
    if (leadResponse) {
      if (isManualLeadRefresh && leadResponse.ok) {
        await ensureLeadDrafts(env);
        await runLeadPushWithDrafts(env);
      }
      if (request.method === "GET" && url.pathname === `${LEAD_APP_PATH}/`) {
        await ensureLeadDrafts(env);
        const withPush = await addLeadPushLink(leadResponse);
        const ordered = await orderLeadDashboard(withPush, env, url.searchParams.get("resolved") === "1");
        return addLeadDraftsToDashboard(ordered, env);
      }
      return leadResponse;
    }

    const response = await tutoringCronWorker.fetch(request as WorkerRequest, env);
    if (request.method === "GET" && url.pathname === TUTORING_APP_PATH) {
      return addLeadAlertLink(response);
    }
    return response;
  },

  scheduled(controller: ScheduledController, env: LeadEnv, ctx: ExecutionContext): void {
    ctx.waitUntil(
      collectAndPush(env).catch((error) => {
        console.error(JSON.stringify({
          event: "lead_alert_scheduled_error",
          message: error instanceof Error ? error.message : "unknown",
        }));
      }),
    );

    const minute = new Date(controller.scheduledTime).getUTCMinutes();
    if (minute % 15 === 0) {
      tutoringCronWorker.scheduled(controller, env, ctx);
    }
  },
} satisfies ExportedHandler<LeadEnv>;
