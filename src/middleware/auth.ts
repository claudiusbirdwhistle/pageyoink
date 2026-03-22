import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { trackUsage } from "../services/usage.js";

// For MVP, API keys are stored in an environment variable (comma-separated)
// Later this can be backed by a database
function getValidApiKeys(): Set<string> {
  const keys = process.env.API_KEYS || "";
  return new Set(keys.split(",").filter((k) => k.trim().length > 0));
}

export const authMiddleware = fp(async function authMiddleware(
  app: FastifyInstance,
) {
  app.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip auth for health endpoint
      if (request.url.startsWith("/internal/")) {
        return;
      }

      const validKeys = getValidApiKeys();

      // If no API keys configured, skip auth (development mode)
      if (validKeys.size === 0) {
        return;
      }

      const apiKey =
        request.headers["x-api-key"] ||
        (request.query as Record<string, string>)?.api_key;

      if (!apiKey) {
        reply.status(401).send({
          error:
            "Missing API key. Provide via x-api-key header or api_key query parameter.",
        });
        return;
      }

      if (!validKeys.has(apiKey as string)) {
        reply.status(403).send({
          error: "Invalid API key.",
        });
        return;
      }

      // Track usage for authenticated requests
      const endpoint = request.url.split("?")[0];
      trackUsage(apiKey as string, endpoint);
    },
  );
});
