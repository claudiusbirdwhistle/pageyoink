import { FastifyInstance, FastifyRequest } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { generatePdf } from "../services/pdf.js";

// IP-based rate limiting for trial usage
const trialUsage = new Map<string, { count: number; date: string }>();
const TRIAL_LIMIT_PER_DAY = 5;

function checkTrialLimit(ip: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  const usage = trialUsage.get(ip);

  if (!usage || usage.date !== today) {
    trialUsage.set(ip, { count: 1, date: today });
    return true;
  }

  if (usage.count >= TRIAL_LIMIT_PER_DAY) {
    return false;
  }

  usage.count++;
  return true;
}

function getRemainingTrials(ip: string): number {
  const today = new Date().toISOString().split("T")[0];
  const usage = trialUsage.get(ip);
  if (!usage || usage.date !== today) return TRIAL_LIMIT_PER_DAY;
  return Math.max(0, TRIAL_LIMIT_PER_DAY - usage.count);
}

export async function trialRoute(app: FastifyInstance) {
  // Trial screenshot — no API key needed, IP rate limited
  app.get(
    "/trial/screenshot",
    {
      schema: {
        description: "Free trial screenshot. Limited to 5 per IP per day. No API key required.",
        tags: ["Trial"],
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", description: "URL to capture." },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { url: string } }>, reply) => {
      const ip = request.ip;

      if (!checkTrialLimit(ip)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      const { url } = request.query;

      // Validate URL
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return reply.status(400).send({ error: "Only http/https URLs are supported." });
        }
      } catch {
        return reply.status(400).send({ error: "Invalid URL." });
      }

      try {
        const result = await takeScreenshot({
          url,
          format: "png",
          width: 1280,
          height: 720,
          clean: true,
          timeout: 30000,
        });

        return reply
          .header("Content-Type", result.contentType)
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .send(result.buffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Screenshot failed";
        return reply.status(500).send({ error: message });
      }
    },
  );

  // Trial PDF — same limits
  app.get(
    "/trial/pdf",
    {
      schema: {
        description: "Free trial PDF. Limited to 5 per IP per day. No API key required.",
        tags: ["Trial"],
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", description: "URL to convert to PDF." },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { url: string } }>, reply) => {
      const ip = request.ip;

      if (!checkTrialLimit(ip)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      const { url } = request.query;

      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return reply.status(400).send({ error: "Only http/https URLs are supported." });
        }
      } catch {
        return reply.status(400).send({ error: "Invalid URL." });
      }

      try {
        const result = await generatePdf({
          url,
          format: "A4",
          clean: true,
          timeout: 30000,
        });

        return reply
          .header("Content-Type", "application/pdf")
          .header("Content-Disposition", 'inline; filename="document.pdf"')
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .send(result.buffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : "PDF generation failed";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
