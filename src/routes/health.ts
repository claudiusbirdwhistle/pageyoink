import { FastifyInstance } from "fastify";
import { getUsageStats } from "../services/usage.js";

const startTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

export async function healthRoute(app: FastifyInstance) {
  app.get("/internal/health", async () => {
    const stats = await getUsageStats();
    return {
      status: "ok",
      version: "0.1.0",
      uptime: formatUptime(Date.now() - startTime),
      usage: stats,
    };
  });
}
