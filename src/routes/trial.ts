import { FastifyInstance, FastifyRequest } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { generatePdf } from "../services/pdf.js";
import { addWatermark } from "../services/watermark.js";
import { validateUrl } from "../utils/url.js";

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
  // Dev-only: reset trial limits
  app.delete("/trial/reset", async (_request, reply) => {
    if (process.env.NODE_ENV === "production" && process.env.API_KEYS) {
      return reply.status(404).send({ error: "Not found" });
    }
    trialUsage.clear();
    return { message: "Trial limits reset" };
  });
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
    async (
      request: FastifyRequest<{
        Querystring: {
          url: string;
          clean?: string;
          smart_wait?: string;
          block_ads?: string;
        };
      }>,
      reply,
    ) => {
      const ip = request.ip;

      if (!checkTrialLimit(ip)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      const { url: rawUrl, clean, smart_wait, block_ads } = request.query;

      const validated = validateUrl(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }
      const url = validated.url;

      try {
        const result = await takeScreenshot({
          url,
          format: "png",
          width: 1280,
          height: 720,
          clean: clean === "true",
          smartWait: smart_wait === "true",
          blockAds: block_ads === "true"
            ? true
            : block_ads === "stealth"
              ? ("stealth" as const)
              : false,
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
    async (
      request: FastifyRequest<{
        Querystring: {
          url: string;
          clean?: string;
          smart_wait?: string;
          block_ads?: string;
          format?: string;
          landscape?: string;
          margin_top?: string;
          margin_right?: string;
          margin_bottom?: string;
          margin_left?: string;
          header_template?: string;
          footer_template?: string;
          watermark?: string;
          watermark_position?: string;
          page_ranges?: string;
          scale?: string;
          max_pages?: string;
          width?: string;
        };
      }>,
      reply,
    ) => {
      const ip = request.ip;

      if (!checkTrialLimit(ip)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      const {
        url,
        clean,
        smart_wait,
        block_ads,
        format,
        landscape,
        margin_top,
        margin_right,
        margin_bottom,
        margin_left,
        header_template,
        footer_template,
        watermark,
        watermark_position,
        page_ranges,
        scale,
        max_pages,
        width,
      } = request.query;

      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return reply.status(400).send({ error: "Only http/https URLs are supported." });
        }
      } catch {
        return reply.status(400).send({ error: "Invalid URL." });
      }

      const validFormats = ["A4", "Letter", "Legal", "A3"] as const;
      const pdfFormat = validFormats.includes(format as any)
        ? (format as (typeof validFormats)[number])
        : "A4";

      const margin =
        margin_top || margin_right || margin_bottom || margin_left
          ? {
              top: margin_top || "0.5in",
              right: margin_right || "0.5in",
              bottom: margin_bottom || "0.5in",
              left: margin_left || "0.5in",
            }
          : undefined;

      try {
        const result = await generatePdf({
          url,
          format: pdfFormat,
          landscape: landscape === "true",
          clean: clean === "true",
          smartWait: smart_wait === "true",
          blockAds: block_ads === "true"
            ? true
            : block_ads === "stealth"
              ? ("stealth" as const)
              : false,
          margin,
          headerTemplate: header_template,
          footerTemplate: footer_template,
          displayHeaderFooter: !!(header_template || footer_template),
          pageRanges: page_ranges,
          scale: scale ? parseFloat(scale) : undefined,
          maxPages: max_pages ? parseInt(max_pages, 10) : undefined,
          timeout: 30000,
        });

        let finalBuffer = result.buffer;
        if (watermark) {
          const validPositions = ["center", "top-left", "top-right", "bottom-left", "bottom-right"] as const;
          const position = validPositions.includes(watermark_position as any)
            ? (watermark_position as (typeof validPositions)[number])
            : "center";
          finalBuffer = await addWatermark(finalBuffer, { text: watermark, position });
        }

        return reply
          .header("Content-Type", "application/pdf")
          .header("Content-Disposition", 'inline; filename="document.pdf"')
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .send(finalBuffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : "PDF generation failed";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
