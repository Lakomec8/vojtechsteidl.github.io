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
  runLeadPush,
} from "./lead-push";

type WorkerRequest = Parameters<typeof tutoringCronWorker.fetch>[0];
type LeadEnv = Env & {
  LEAD_ALERT_NTFY_URL?: string;
};

const TUTORING_APP_PATH = "/student-portal/admin/tutoring/";

async function collectAndPush(env: LeadEnv): Promise<void> {
  await ensureLeadPushChannel(env);
  await runLeadAlert(env);
  await runLeadPush(env);
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
      if (isManualLeadRefresh && leadResponse.ok) await runLeadPush(env);
      if (request.method === "GET" && url.pathname === `${LEAD_APP_PATH}/`) {
        return addLeadPushLink(leadResponse);
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
