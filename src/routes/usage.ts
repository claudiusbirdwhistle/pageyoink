import { FastifyInstance, FastifyRequest } from "fastify";
import { getDb } from "../services/database.js";

interface UsageQuery {
  days?: string;
}

export async function usageRoute(app: FastifyInstance) {
  // GET /v1/usage — get usage for the authenticated API key
  app.get<{ Querystring: UsageQuery }>(
    "/v1/usage",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            days: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: UsageQuery }>, reply) => {
      const apiKey =
        (request.headers["x-api-key"] as string) ||
        (request.query as Record<string, string>)?.api_key;

      if (!apiKey) {
        return reply.status(401).send({
          error: "API key required to view usage",
        });
      }

      const days = Math.min(parseInt(request.query.days || "30", 10), 90);
      const db = getDb();

      // Get daily breakdown
      const dailyUsage = db
        .prepare(
          `SELECT date, endpoint, SUM(count) as requests
           FROM usage
           WHERE api_key = ? AND date >= date('now', ?)
           GROUP BY date, endpoint
           ORDER BY date DESC, endpoint`,
        )
        .all(apiKey, `-${days} days`) as Array<{
        date: string;
        endpoint: string;
        requests: number;
      }>;

      // Get totals
      const totals = db
        .prepare(
          `SELECT endpoint, SUM(count) as requests
           FROM usage
           WHERE api_key = ? AND date >= date('now', ?)
           GROUP BY endpoint
           ORDER BY requests DESC`,
        )
        .all(apiKey, `-${days} days`) as Array<{
        endpoint: string;
        requests: number;
      }>;

      const totalRequests = totals.reduce((sum, row) => sum + row.requests, 0);

      return {
        apiKey: apiKey.slice(0, 8) + "..." + apiKey.slice(-4),
        period: {
          days,
          from: new Date(Date.now() - days * 86400000)
            .toISOString()
            .split("T")[0],
          to: new Date().toISOString().split("T")[0],
        },
        totalRequests,
        byEndpoint: totals,
        daily: dailyUsage,
      };
    },
  );
}
