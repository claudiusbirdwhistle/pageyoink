import { FastifyInstance, FastifyRequest } from "fastify";
import { getDb, isUsingFirestore, memQuery } from "../services/database.js";

interface UsageQuery {
  days?: string;
}

export async function usageRoute(app: FastifyInstance) {
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

      const cutoffDate = new Date(Date.now() - days * 86400000)
        .toISOString()
        .split("T")[0];

      const dailyUsage: Array<{
        date: string;
        endpoint: string;
        requests: number;
      }> = [];
      const endpointTotals = new Map<string, number>();
      let totalRequests = 0;

      if (!isUsingFirestore()) {
        const results = memQuery("usage", { apiKey });
        for (const { data } of results) {
          if ((data.date as string) >= cutoffDate) {
            dailyUsage.push({
              date: data.date as string,
              endpoint: data.endpoint as string,
              requests: (data.count as number) || 0,
            });
            endpointTotals.set(
              data.endpoint as string,
              (endpointTotals.get(data.endpoint as string) || 0) + ((data.count as number) || 0),
            );
            totalRequests += (data.count as number) || 0;
          }
        }
      } else {
        const db = getDb();
        const snapshot = await db
          .collection("usage")
          .where("apiKey", "==", apiKey)
          .where("date", ">=", cutoffDate)
          .get();

        snapshot.forEach((doc) => {
          const data = doc.data();
          dailyUsage.push({
            date: data.date,
            endpoint: data.endpoint,
            requests: data.count || 0,
          });
          endpointTotals.set(
            data.endpoint,
            (endpointTotals.get(data.endpoint) || 0) + (data.count || 0),
          );
          totalRequests += data.count || 0;
        });
      }

      // Sort daily by date descending
      dailyUsage.sort((a, b) => b.date.localeCompare(a.date));

      const byEndpoint = Array.from(endpointTotals.entries())
        .map(([endpoint, requests]) => ({ endpoint, requests }))
        .sort((a, b) => b.requests - a.requests);

      return {
        apiKey: apiKey.slice(0, 8) + "..." + apiKey.slice(-4),
        period: {
          days,
          from: cutoffDate,
          to: new Date().toISOString().split("T")[0],
        },
        totalRequests,
        byEndpoint,
        daily: dailyUsage,
      };
    },
  );
}
