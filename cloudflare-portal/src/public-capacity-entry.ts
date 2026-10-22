import { handlePublicBookingRequest, handlePublicBookingCancellation, handlePublicCapacityRequest } from "./public-capacity";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handlePublicCapacityRequest(request, env)
      || await handlePublicBookingRequest(request, env, ctx)
      || await handlePublicBookingCancellation(request, env, ctx);
    return response || Response.json({ error: "not_found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
