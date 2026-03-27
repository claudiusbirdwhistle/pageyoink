import { FastifyInstance, FastifyRequest } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { generatePdf } from "../services/pdf.js";
import { addWatermark } from "../services/watermark.js";
import { getBrowser } from "../services/browser.js";
import { extractContent } from "../services/extract.js";
import { extractMetadata } from "../services/metadata.js";
import { cleanPage } from "../services/cleanup.js";
import { validateUrlSafe } from "../utils/url.js";
import { checkSsrf } from "../utils/ssrf.js";
import { classifyNavigationError } from "../utils/errors.js";
import { progressStart, progressUpdate, progressEnd } from "../services/progress.js";
import sharp from "sharp";

// IP-based rate limiting for trial usage.
// A "capture" is one URL — all output types (screenshot, PDF, extract, metadata)
// from the same URL count as a single trial usage.
const trialUsage = new Map<string, { urls: Set<string>; date: string }>();
const TRIAL_LIMIT_PER_DAY = 5;

// Sandbox URLs: unlimited requests, no trial limit. Lets people experiment
// with the API via Swagger docs without burning their daily trial quota.
const SANDBOX_URLS = new Set([
  "https://example.com",
  "https://example.com/",
  "https://news.ycombinator.com",
  "https://news.ycombinator.com/",
]);

function isSandboxUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const normalized = parsed.origin + parsed.pathname;
    return SANDBOX_URLS.has(normalized) || SANDBOX_URLS.has(normalized + "/");
  } catch {
    return false;
  }
}

function checkTrialLimit(ip: string, url: string): boolean {
  // Sandbox URLs are always allowed, don't count against limit
  if (isSandboxUrl(url)) return true;

  const today = new Date().toISOString().split("T")[0];
  const usage = trialUsage.get(ip);

  if (!usage || usage.date !== today) {
    trialUsage.set(ip, { urls: new Set([url]), date: today });
    return true;
  }

  // Same URL as a previous request today — doesn't count as new usage
  if (usage.urls.has(url)) {
    return true;
  }

  if (usage.urls.size >= TRIAL_LIMIT_PER_DAY) {
    return false;
  }

  usage.urls.add(url);
  return true;
}

function getRemainingTrials(ip: string): number {
  const today = new Date().toISOString().split("T")[0];
  const usage = trialUsage.get(ip);
  if (!usage || usage.date !== today) return TRIAL_LIMIT_PER_DAY;
  return Math.max(0, TRIAL_LIMIT_PER_DAY - usage.urls.size);
}

async function addTrialWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const w = metadata.width || 1280;
  const h = metadata.height || 720;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="${w - 10}" y="${h - 10}" font-family="sans-serif" font-size="14"
      fill="rgba(255,255,255,0.5)" text-anchor="end">PageYoink Trial</text>
  </svg>`;
  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toBuffer();
}

export async function trialRoute(app: FastifyInstance) {
  // Dev/test only: reset trial limits. Disabled in production.
  app.delete("/trial/reset", async (_request, reply) => {
    if (process.env.NODE_ENV === "production" || process.env.API_KEYS) {
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
          antibot?: string;
        };
      }>,
      reply,
    ) => {
      const ip = request.ip;
      const { url: rawUrl, clean, smart_wait, block_ads, antibot } = request.query;

      if (!checkTrialLimit(ip, rawUrl)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} unique URLs per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }
      const url = validated.url;

      const reqId = (request.headers["x-request-id"] as string) || String(request.id);
      progressStart(reqId);

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
            : block_ads === "cosmetic"
              ? ("cosmetic" as const)
              : false,
          timeout: 30000,
          antibot: antibot === "true",
          onProgress: (stage) => progressUpdate(reqId, stage as "navigating"),
        });

        progressUpdate(reqId, "complete");
        const watermarked = await addTrialWatermark(result.buffer);
        return reply
          .header("Content-Type", "image/png")
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .header("X-Request-Id", reqId)
          .send(watermarked);
      } catch (err) {
        progressUpdate(reqId, "error");
        const classified = classifyNavigationError(err);
        return reply.status(classified.statusCode).send({ error: classified.message });
      } finally {
        // Clean up after a short delay so the frontend can read the final status
        setTimeout(() => progressEnd(reqId), 5000);
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

      if (!checkTrialLimit(ip, url)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} unique URLs per day). Sign up for an API key for unlimited access.`,
          remaining: 0,
        });
      }

      // SSRF-safe URL validation
      const ssrfError = await checkSsrf(url);
      if (ssrfError) {
        return reply.status(400).send({ error: ssrfError });
      }

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
            : block_ads === "cosmetic"
              ? ("cosmetic" as const)
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
        const classified = classifyNavigationError(err);
        return reply.status(classified.statusCode).send({ error: classified.message });
      }
    },
  );

  // Trial extract — content extraction, same limits
  app.get(
    "/trial/extract",
    {
      schema: {
        description: "Free trial content extraction. Limited to 5 per IP per day.",
        tags: ["Trial"],
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { url: string; format?: string; clean?: string };
      }>,
      reply,
    ) => {
      const ip = request.ip;
      const { url: rawUrl, format, clean } = request.query;

      if (!checkTrialLimit(ip, rawUrl)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} unique URLs per day).`,
        });
      }

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await page.goto(validated.url, { waitUntil: "load", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 1000));
        if (clean !== "false") await cleanPage(page);
        const result = await extractContent(
          page,
          (format as "markdown" | "text" | "html") || "markdown",
        );
        return reply
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .send(result);
      } catch (err) {
        const classified = classifyNavigationError(err);
        return reply.status(classified.statusCode).send({ error: classified.message });
      } finally {
        await page.close();
      }
    },
  );

  // Trial metadata — metadata extraction, same limits
  app.get(
    "/trial/metadata",
    {
      schema: {
        description: "Free trial metadata extraction. Limited to 5 per IP per day.",
        tags: ["Trial"],
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { url: string };
      }>,
      reply,
    ) => {
      const ip = request.ip;
      const { url: rawUrl } = request.query;

      if (!checkTrialLimit(ip, rawUrl)) {
        return reply.status(429).send({
          error: `Trial limit reached (${TRIAL_LIMIT_PER_DAY} unique URLs per day).`,
        });
      }

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        await page.goto(validated.url, { waitUntil: "load", timeout: 15000 });
        await new Promise((r) => setTimeout(r, 500));
        const metadata = await extractMetadata(page);
        return reply
          .header("X-Trial-Remaining", String(getRemainingTrials(ip)))
          .send(metadata);
      } catch (err) {
        const classified = classifyNavigationError(err);
        return reply.status(classified.statusCode).send({ error: classified.message });
      } finally {
        await page.close();
      }
    },
  );
}
