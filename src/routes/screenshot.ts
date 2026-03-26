import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { cacheGet, cacheSet } from "../services/cache.js";
import { validateUrlSafe } from "../utils/url.js";
import { checkSsrf } from "../utils/ssrf.js";
import { classifyNavigationError } from "../utils/errors.js";
import {
  validateViewport,
  validateCssSize,
  validateJsSize,
  validateGeolocation,
} from "../utils/validation.js";

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
  viewports?: string;
  css?: string;
  js?: string;
  user_agent?: string;
  selector?: string;
  transparent?: string;
  ttl?: string;
  fresh?: string;
  click?: string;
  click_count?: string;
  fonts?: string;
  proxy?: string;
  geolocation?: string;
  optimize?: string;
  timezone?: string;
  stealth?: string;
}

const screenshotQuerySchema = {
  type: "object" as const,
  required: ["url"],
  properties: {
    url: {
      type: "string" as const,
      description: "Target URL to capture. Must include protocol (http:// or https://).",
    },
    format: {
      type: "string" as const,
      enum: ["png", "jpeg", "webp"],
      description: "Output image format. Default: png.",
    },
    quality: {
      type: "string" as const,
      description: "JPEG compression quality, 1 (worst) to 100 (best). Only applies when format=jpeg. Default: 80.",
    },
    full_page: {
      type: "string" as const,
      description: "Capture the full scrollable page instead of just the visible viewport. Pass 'true' to enable. Default: false.",
    },
    width: {
      type: "string" as const,
      description: "Browser viewport width in pixels. Default: 1280.",
    },
    height: {
      type: "string" as const,
      description: "Browser viewport height in pixels. Default: 720.",
    },
    device_scale_factor: {
      type: "string" as const,
      description: "Device pixel ratio for retina/HiDPI renders. Use '2' for 2x resolution. Default: 1.",
    },
    timeout: {
      type: "string" as const,
      description: "Max time in milliseconds to wait for the page to load. Max allowed: 60000. Default: 30000.",
    },
    clean: {
      type: "string" as const,
      description: "Auto-remove cookie banners, consent dialogs, newsletter popups, and chat widgets (Intercom, Drift, HubSpot, etc.) before capture. Uses 4-phase detection: selector blocklist, text-content scanning, z-index overlay detection, and backdrop removal. Pass 'true' to enable.",
    },
    smart_wait: {
      type: "string" as const,
      description: "Wait for the page to be truly ready before capture: DOM mutations settled for 500ms, all fonts loaded, all images decoded, and CSS animations finished. Better than fixed delays for JS-heavy sites. Pass 'true' to enable.",
    },
    max_scroll: {
      type: "string" as const,
      description: "Maximum number of viewport heights to scroll when triggering lazy-loaded images. Prevents infinite scroll traps on sites like Reddit. Default: 10.",
    },
    block_ads: {
      type: "string" as const,
      description: "Block ads. 'true' = aggressive network-level blocking via Ghostery engine (fast, but detectable by anti-adblock scripts on sites like The Guardian, Forbes). 'stealth' = lets all requests through, hides ad elements visually after page load (slower, but undetectable by anti-adblock scripts). Default: disabled.",
    },
    viewports: {
      type: "string" as const,
      description: "Number of viewport heights to capture. Alternative to specifying exact pixel height. For example, viewports=2 with default 720px height captures 1440px tall. Works without full_page. Default: 1.",
    },
    css: {
      type: "string" as const,
      description: "Custom CSS to inject into the page after load but before capture. URL-encoded. Example: body%7Bbackground%3Ared%7D",
    },
    js: {
      type: "string" as const,
      description: "Custom JavaScript to execute in the page context before capture. Runs as a sandboxed IIFE. URL-encoded. Example: document.querySelector('.popup').remove()",
    },
    user_agent: {
      type: "string" as const,
      description: "Custom User-Agent string sent with the page request. Useful for testing mobile layouts or bypassing bot detection.",
    },
    selector: {
      type: "string" as const,
      description: "CSS selector of a specific element to capture instead of the full page. Returns just that element cropped. Example: #hero, .main-chart, article:first-of-type",
    },
    transparent: {
      type: "string" as const,
      description: "Render with a transparent background instead of white. Only works with format=png (JPEG does not support transparency). Pass 'true' to enable.",
    },
    ttl: {
      type: "string" as const,
      description: "Cache duration in seconds. Subsequent identical requests return the cached result instantly (X-Cache: HIT header). Default: 86400 (24 hours). Max: 2592000 (30 days). Set to 0 to disable caching.",
    },
    fresh: {
      type: "string" as const,
      description: "Bypass the cache and force a new capture even if a cached result exists. Pass 'true' to enable.",
    },
    click: {
      type: "string" as const,
      description: "CSS selector of an element to click before capture. Useful for expanding collapsed content, clicking 'Load More', or dismissing custom popups. Example: button.load-more, .dismiss-modal",
    },
    click_count: {
      type: "string" as const,
      description: "Number of times to click the element specified by 'click'. Max: 10. Each click waits 500ms for the page to update. Default: 1.",
    },
    fonts: {
      type: "string" as const,
      description: "Comma-separated list of web font URLs (@import format) to load before capture. Example: https://fonts.googleapis.com/css2?family=Roboto",
    },
    proxy: {
      type: "string" as const,
      description: "Proxy server URL to route the request through. Format: http://host:port or http://user:pass@host:port. Launches an isolated browser instance.",
    },
    geolocation: {
      type: "string" as const,
      description: "Spoof browser geolocation. Format: latitude,longitude or latitude,longitude,accuracy. Example: 48.8566,2.3522 (Paris).",
    },
    timezone: {
      type: "string" as const,
      description: "Spoof browser timezone. IANA timezone ID. Example: America/New_York, Europe/London, Asia/Tokyo.",
    },
    optimize: {
      type: "string" as const,
      description: "Auto-optimize capture parameters based on page content. Pass 'true' to enable.",
    },
    stealth: {
      type: "string" as const,
      description: "Use stealth browser mode to evade bot detection (Cloudflare, DataDome, etc.). Pass 'true' to enable. Slightly slower than default mode.",
    },
  },
};

export async function screenshotRoute(app: FastifyInstance) {
  app.get<{ Querystring: ScreenshotQuery }>(
    "/v1/screenshot",
    {
      schema: {
        querystring: screenshotQuerySchema,
        description: "Capture a screenshot of any URL as PNG or JPEG.",
        tags: ["Screenshot"],
        response: {
          200: {
            description: "Screenshot image binary. Content-Type will be image/png or image/jpeg.",
            type: "string" as const,
            format: "binary",
          },
          400: {
            description: "Invalid URL or parameters.",
            type: "object" as const,
            properties: { error: { type: "string" as const } },
          },
          500: {
            description: "Capture failed (timeout, crash, element not found).",
            type: "object" as const,
            properties: { error: { type: "string" as const } },
          },
        },
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
        viewports,
        css,
        js,
        user_agent,
        selector,
        transparent,
        ttl,
        fresh,
        click,
        click_count,
        fonts,
        proxy,
        geolocation,
        timezone,
        optimize,
        stealth,
      } = request.query;

      const validated = await validateUrlSafe(url);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      // Input validation
      const parsedWidth = width ? parseInt(width, 10) : undefined;
      const parsedHeight = height ? parseInt(height, 10) : undefined;
      const vpError = validateViewport(parsedWidth, parsedHeight);
      if (vpError) return reply.status(400).send({ error: vpError });

      const cssError = validateCssSize(css);
      if (cssError) return reply.status(400).send({ error: cssError });

      const jsError = validateJsSize(js);
      if (jsError) return reply.status(400).send({ error: jsError });

      if (geolocation) {
        const parts = geolocation.split(",").map(Number);
        const geoError = validateGeolocation(parts[0], parts[1], parts[2]);
        if (geoError) return reply.status(400).send({ error: geoError });
      }

      // Validate and SSRF-check proxy URL
      if (proxy) {
        // H4: Strict proxy format validation (host:port or http://host:port)
        const proxyPattern = /^(https?:\/\/)?[\w.-]+(:\d{1,5})?$/;
        if (!proxyPattern.test(proxy)) {
          return reply.status(400).send({ error: "Invalid proxy format. Must be host:port or http://host:port." });
        }
        const proxyCheck = await checkSsrf(
          proxy.match(/^https?:\/\//) ? proxy : `http://${proxy}`,
        );
        if (proxyCheck) {
          return reply.status(400).send({ error: `Invalid proxy: ${proxyCheck}` });
        }
      }

      // SSRF check for font URLs
      if (fonts) {
        for (const fontUrl of fonts.split(",").map((f) => f.trim())) {
          if (fontUrl) {
            const fontCheck = await checkSsrf(fontUrl);
            if (fontCheck) {
              return reply.status(400).send({ error: `Invalid font URL: ${fontCheck}` });
            }
          }
        }
      }

      try {
        const captureParams = {
          url: validated.url,
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
          blockAds: block_ads === "true" ? true : block_ads === "stealth" ? "stealth" as const : false,
          viewports: viewports ? parseInt(viewports, 10) : undefined,
          css: css || undefined,
          js: js || undefined,
          userAgent: user_agent || undefined,
          selector: selector || undefined,
          transparentBg: transparent === "true",
          clickSelector: click || undefined,
          clickCount: click_count ? parseInt(click_count, 10) : undefined,
          fonts: fonts ? fonts.split(",").map((f) => f.trim()) : undefined,
          proxy: proxy || undefined,
          geolocation: geolocation
            ? (() => {
                const parts = geolocation.split(",").map(Number);
                return {
                  latitude: parts[0],
                  longitude: parts[1],
                  accuracy: parts[2] || 100,
                };
              })()
            : undefined,
          timezone: timezone || undefined,
          optimize: optimize === "true",
          stealth: stealth === "true",
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
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Screenshot failed");
        return reply.status(classified.statusCode).send({ error: classified.message });
      }
    },
  );
}
