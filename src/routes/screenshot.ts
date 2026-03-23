import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { cacheGet, cacheSet } from "../services/cache.js";

interface ScreenshotQuery {
  url: string;
  format?: "png" | "jpeg";
  quality?: string;
  full_page?: string;
  width?: string;
  height?: string;
  device_scale_factor?: string;
  timeout?: string;
  clean?: string;
  smart_wait?: string;
  max_scroll?: string;
  block_ads?: string;
  css?: string;
  js?: string;
  user_agent?: string;
  selector?: string;
  transparent?: string;
  ttl?: string;
  fresh?: string;
  click?: string;
  click_count?: string;
}

const screenshotQuerySchema = {
  type: "object" as const,
  required: ["url"],
  properties: {
    url: { type: "string" as const },
    format: { type: "string" as const, enum: ["png", "jpeg"] },
    quality: { type: "string" as const },
    full_page: { type: "string" as const },
    width: { type: "string" as const },
    height: { type: "string" as const },
    device_scale_factor: { type: "string" as const },
    timeout: { type: "string" as const },
    clean: { type: "string" as const },
    smart_wait: { type: "string" as const },
    max_scroll: { type: "string" as const },
    block_ads: { type: "string" as const },
    css: { type: "string" as const },
    js: { type: "string" as const },
    user_agent: { type: "string" as const },
    selector: { type: "string" as const },
    transparent: { type: "string" as const },
    ttl: { type: "string" as const },
    fresh: { type: "string" as const },
    click: { type: "string" as const },
    click_count: { type: "string" as const },
  },
};

export async function screenshotRoute(app: FastifyInstance) {
  app.get<{ Querystring: ScreenshotQuery }>(
    "/v1/screenshot",
    {
      schema: {
        querystring: screenshotQuerySchema,
      },
    },
    async (request, reply) => {
      const {
        url,
        format,
        quality,
        full_page,
        width,
        height,
        device_scale_factor,
        timeout,
        clean,
        smart_wait,
        max_scroll,
        block_ads,
        css,
        js,
        user_agent,
        selector,
        transparent,
        ttl,
        fresh,
        click,
        click_count,
      } = request.query;

      // Validate URL
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return reply.status(400).send({
            error: "Invalid URL: only http and https protocols are supported",
          });
        }
      } catch {
        return reply
          .status(400)
          .send({ error: "Invalid URL: must be a valid URL" });
      }

      try {
        const captureParams = {
          url,
          format: format || "png",
          quality: quality ? parseInt(quality, 10) : undefined,
          fullPage: full_page === "true",
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
          deviceScaleFactor: device_scale_factor
            ? parseFloat(device_scale_factor)
            : undefined,
          clean: clean === "true",
          smartWait: smart_wait === "true",
          maxScroll: max_scroll ? parseInt(max_scroll, 10) : undefined,
          blockAds: block_ads === "true",
          css: css || undefined,
          js: js || undefined,
          userAgent: user_agent || undefined,
          selector: selector || undefined,
          transparentBg: transparent === "true",
          clickSelector: click || undefined,
          clickCount: click_count ? parseInt(click_count, 10) : undefined,
        };

        const cacheTtl = ttl ? parseInt(ttl, 10) : undefined;
        const bypassCache = fresh === "true";

        // Check cache (unless fresh=true)
        if (!bypassCache) {
          const cached = cacheGet(captureParams);
          if (cached) {
            return reply
              .header("Content-Type", cached.contentType)
              .header("X-Cache", "HIT")
              .header(
                "Content-Disposition",
                `inline; filename="screenshot.${format || "png"}"`,
              )
              .send(cached.buffer);
          }
        }

        const result = await takeScreenshot({
          ...captureParams,
          timeout: timeout ? parseInt(timeout, 10) : undefined,
        });

        // Store in cache
        cacheSet(captureParams, result.buffer, result.contentType, cacheTtl);

        return reply
          .header("Content-Type", result.contentType)
          .header("X-Cache", "MISS")
          .header(
            "Content-Disposition",
            `inline; filename="screenshot.${format || "png"}"`,
          )
          .send(result.buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Screenshot failed";
        request.log.error({ err }, "Screenshot failed");
        return reply.status(500).send({ error: message });
      }
    },
  );
}
