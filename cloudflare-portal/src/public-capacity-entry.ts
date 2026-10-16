import { handlePublicCapacityRequest } from "./public-capacity";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await handlePublicCapacityRequest(request, env);
    return response || Response.json({ error: "not_found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
