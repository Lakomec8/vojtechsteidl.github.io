import tutoringCronWorker from "./tutoring-cron-entry";
import { addLeadAlertLink, handleLeadAlertRequest, runLeadAlert } from "./lead-alert";

type WorkerRequest = Parameters<typeof tutoringCronWorker.fetch>[0];
type LeadEnv = Env & {
  LEAD_ALERT_NTFY_URL?: string;
};

const TUTORING_APP_PATH = "/student-portal/admin/tutoring/";

export default {
  async fetch(request: Request, env: LeadEnv): Promise<Response> {
    const leadResponse = await handleLeadAlertRequest(request, env);
    if (leadResponse) return leadResponse;

    const url = new URL(request.url);
    const response = await tutoringCronWorker.fetch(request as WorkerRequest, env);
    if (request.method === "GET" && url.pathname === TUTORING_APP_PATH) {
      return addLeadAlertLink(response);
    }
    return response;
  },

  scheduled(controller: ScheduledController, env: LeadEnv, ctx: ExecutionContext): void {
    ctx.waitUntil(
      runLeadAlert(env).catch((error) => {
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
