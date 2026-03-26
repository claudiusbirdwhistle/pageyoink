import { FastifyInstance } from "fastify";
import { generatePdf } from "../services/pdf.js";
import { cacheGet, cacheSet } from "../services/cache.js";
import { addWatermark, WatermarkOptions } from "../services/watermark.js";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";
import { checkSsrf } from "../utils/ssrf.js";
import { convertToPdfA, isGhostscriptAvailable } from "../services/pdfa.js";

interface PdfQuery {
  url?: string;
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: string;
  print_background?: string;
  margin_top?: string;
  margin_right?: string;
  margin_bottom?: string;
  margin_left?: string;
  timeout?: string;
  clean?: string;
  smart_wait?: string;
  max_scroll?: string;
  block_ads?: string;
  css?: string;
  js?: string;
  user_agent?: string;
  scale?: string;
  max_pages?: string;
  ttl?: string;
  fresh?: string;
  optimize?: string;
  pdfa?: string;
}

interface PdfBody {
  html: string;
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  timeout?: number;
  clean?: boolean;
  smartWait?: boolean;
  maxScroll?: number;
  blockAds?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  pageRanges?: string;
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  userAgent?: string;
  proxy?: string;
  watermark?: WatermarkOptions;
  scale?: number;
  maxPages?: number;
}

export async function pdfRoute(app: FastifyInstance) {
  // GET: URL-to-PDF
  app.get<{ Querystring: PdfQuery }>(
    "/v1/pdf",
    {
      schema: {
        description: "Convert a URL to PDF. For HTML-to-PDF or advanced options (headers, cookies, watermarks), use POST instead.",
        tags: ["PDF"],
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "Target URL to convert. Must include protocol (http:// or https://).",
            },
            format: {
              type: "string",
              enum: ["A4", "Letter", "Legal", "A3"],
              description: "PDF page size. Default: A4.",
            },
            landscape: {
              type: "string",
              description: "Render in landscape orientation. Pass 'true' to enable. Default: false (portrait).",
            },
            print_background: {
              type: "string",
              description: "Include CSS background colors and images in the PDF. Pass 'false' to disable. Default: true.",
            },
            margin_top: {
              type: "string",
              description: "Top margin with CSS units. Examples: '0.5in', '20mm', '1cm'. Default: 0.5in.",
            },
            margin_right: {
              type: "string",
              description: "Right margin with CSS units. Default: 0.5in.",
            },
            margin_bottom: {
              type: "string",
              description: "Bottom margin with CSS units. Default: 0.5in.",
            },
            margin_left: {
              type: "string",
              description: "Left margin with CSS units. Default: 0.5in.",
            },
            timeout: {
              type: "string",
              description: "Max time in milliseconds to wait for page load. Max: 60000. Default: 30000.",
            },
            clean: {
              type: "string",
              description: "Auto-remove cookie banners, popups, and chat widgets before PDF generation. Pass 'true' to enable.",
            },
            smart_wait: {
              type: "string",
              description: "Wait for DOM stability, fonts, images, and animations before PDF generation. Pass 'true' to enable.",
            },
            max_scroll: {
              type: "string",
              description: "Max viewport heights to scroll for lazy-load triggering. Default: 10.",
            },
            block_ads: {
              type: "string",
              description: "Block ads and trackers (Ghostery/uBlock engine). Pass 'true' to enable.",
            },
            css: {
              type: "string",
              description: "Custom CSS to inject before PDF generation. URL-encoded.",
            },
            js: {
              type: "string",
              description: "Custom JavaScript to execute before PDF generation. URL-encoded.",
            },
            user_agent: {
              type: "string",
              description: "Custom User-Agent string.",
            },
            scale: {
              type: "string",
              description: "PDF zoom/scale factor (0.1 to 2.0). Default: 1.0. Values below 1 shrink content, above 1 enlarge it.",
            },
            max_pages: {
              type: "string",
              description: "Maximum number of pages in the output PDF. Pages beyond this limit are removed. Useful for capping long pages.",
            },
            ttl: {
              type: "string",
              description: "Cache duration in seconds. Default: 86400 (24h).",
            },
            fresh: {
              type: "string",
              description: "Bypass cache and force new PDF generation. Pass 'true' to enable.",
            },
          },
        },
        response: {
          200: {
            description: "PDF document binary. Content-Type: application/pdf.",
            type: "string",
            format: "binary",
          },
          400: {
            description: "Invalid URL or parameters.",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        url,
        format,
        landscape,
        print_background,
        timeout,
        clean,
        smart_wait,
        max_scroll,
        block_ads,
        css,
        js,
        user_agent,
        scale,
        max_pages,
        ttl,
        fresh,
      } = request.query;

      const validated = await validateUrlSafe(url!);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      try {
        const captureParams = {
          type: "pdf" as const,
          url: validated.url,
          format: format || "A4",
          landscape: landscape === "true",
          printBackground: print_background !== "false",
          margin: buildMargin(request.query),
          clean: clean === "true",
          smartWait: smart_wait === "true",
          maxScroll: max_scroll ? parseInt(max_scroll, 10) : undefined,
          blockAds: block_ads === "true" ? true : block_ads === "stealth" ? "stealth" as const : false,
          css: css || undefined,
          js: js || undefined,
          userAgent: user_agent || undefined,
          scale: scale ? parseFloat(scale) : undefined,
          maxPages: max_pages ? parseInt(max_pages, 10) : undefined,
          optimize: request.query.optimize === "true",
        };

        const cacheTtl = ttl ? parseInt(ttl, 10) : undefined;
        const bypassCache = fresh === "true";

        if (!bypassCache) {
          const cached = cacheGet(captureParams);
          if (cached) {
            return reply
              .header("Content-Type", "application/pdf")
              .header("X-Cache", "HIT")
              .header("Content-Disposition", 'inline; filename="document.pdf"')
              .send(cached.buffer);
          }
        }

        const result = await generatePdf({
          ...captureParams,
          timeout: timeout ? parseInt(timeout, 10) : undefined,
        });

        let finalBuffer = result.buffer;

        // PDF/A conversion via Ghostscript
        if (request.query.pdfa === "true") {
          if (await isGhostscriptAvailable()) {
            const level = (request.query.pdfa as string) === "1b" ? "1b" : (request.query.pdfa as string) === "3b" ? "3b" : "2b";
            finalBuffer = await convertToPdfA(finalBuffer, level);
          } else {
            return reply.status(501).send({ error: "PDF/A conversion requires Ghostscript, which is not installed on this server." });
          }
        }

        cacheSet(captureParams, finalBuffer, "application/pdf", cacheTtl);

        return reply
          .header("Content-Type", "application/pdf")
          .header("X-Cache", "MISS")
          .header("Content-Disposition", `inline; filename="document${request.query.pdfa === "true" ? "-pdfa" : ""}.pdf"`)
          .send(finalBuffer);
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "PDF generation failed");
        return reply.status(classified.statusCode).send({ error: classified.message });
      }
    },
  );

  // POST: HTML-to-PDF (also supports full options for URL-based via JSON body)
  app.post<{ Body: PdfBody }>(
    "/v1/pdf",
    {
      schema: {
        description: "Generate a PDF from HTML content or a URL. Supports all options including custom headers, cookies, watermarks, and PDF headers/footers. Send either 'html' or 'url' in the request body.",
        tags: ["PDF"],
        body: {
          type: "object",
          properties: {
            html: {
              type: "string",
              description: "Raw HTML string to convert to PDF. Either 'html' or 'url' is required.",
            },
            url: {
              type: "string",
              description: "URL to convert to PDF. Either 'html' or 'url' is required.",
            },
            format: {
              type: "string",
              enum: ["A4", "Letter", "Legal", "A3"],
              description: "PDF page size. Default: A4.",
            },
            landscape: {
              type: "boolean",
              description: "Render in landscape orientation. Default: false.",
            },
            printBackground: {
              type: "boolean",
              description: "Include CSS backgrounds in PDF. Default: true.",
            },
            margin: {
              type: "object",
              description: "Page margins with CSS units (e.g., '0.5in', '20mm').",
              properties: {
                top: { type: "string", description: "Top margin. Default: 0.5in." },
                right: { type: "string", description: "Right margin. Default: 0.5in." },
                bottom: { type: "string", description: "Bottom margin. Default: 0.5in." },
                left: { type: "string", description: "Left margin. Default: 0.5in." },
              },
            },
            timeout: {
              type: "number",
              description: "Navigation timeout in ms. Max: 60000. Default: 30000.",
            },
            clean: {
              type: "boolean",
              description: "Auto-remove cookie banners, popups, chat widgets.",
            },
            smartWait: {
              type: "boolean",
              description: "Wait for DOM stability, fonts, images, animations.",
            },
            maxScroll: {
              type: "number",
              description: "Max viewport heights to scroll for lazy loading. Default: 10.",
            },
            blockAds: {
              type: "boolean",
              description: "Block ads and trackers (Ghostery/uBlock engine).",
            },
            headerTemplate: {
              type: "string",
              description: "HTML template for PDF page header. Supports these CSS classes as auto-filled values: 'date' (current date), 'title' (page title), 'url' (page URL), 'pageNumber', 'totalPages'. Example: '<div style=\"font-size:10px;text-align:center;\"><span class=\"title\"></span></div>'",
            },
            footerTemplate: {
              type: "string",
              description: "HTML template for PDF page footer. Same template variables as headerTemplate. Default when displayHeaderFooter is true: page number / total pages.",
            },
            displayHeaderFooter: {
              type: "boolean",
              description: "Enable PDF header and footer rendering. Automatically enabled if headerTemplate or footerTemplate is provided. Margins are increased to 1in top/bottom when enabled.",
            },
            pageRanges: {
              type: "string",
              description: "Which pages to include in the PDF. Examples: '1-3' (pages 1 to 3), '1,3,5' (specific pages), '2-' (page 2 onwards).",
            },
            css: {
              type: "string",
              description: "Custom CSS to inject before PDF generation.",
            },
            js: {
              type: "string",
              description: "Custom JavaScript to execute before PDF generation.",
            },
            headers: {
              type: "object",
              description: "Custom HTTP headers to send when fetching the URL. Object of key-value pairs. Example: {\"Authorization\": \"Bearer token123\"}",
            },
            cookies: {
              type: "array",
              description: "Cookies to set before navigating to the URL. Useful for authenticated pages or bypassing consent.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Cookie name." },
                  value: { type: "string", description: "Cookie value." },
                  domain: { type: "string", description: "Cookie domain. Defaults to the target URL's hostname." },
                },
              },
            },
            userAgent: {
              type: "string",
              description: "Custom User-Agent string.",
            },
            proxy: {
              type: "string",
              description: "Proxy server URL to route the request through. Format: 'http://host:port' or 'http://user:pass@host:port'. Supports HTTP proxies.",
            },
            scale: {
              type: "number",
              description: "PDF zoom/scale factor (0.1 to 2.0). Default: 1.0.",
            },
            maxPages: {
              type: "number",
              description: "Maximum pages in output PDF. Pages beyond this are removed.",
            },
            watermark: {
              type: "object",
              description: "Add a text watermark to every page of the PDF.",
              properties: {
                text: { type: "string", description: "Watermark text. Required." },
                fontSize: { type: "number", description: "Font size in points. Default: 48." },
                color: { type: "string", description: "Hex color code. Default: #888888." },
                opacity: { type: "number", description: "Opacity from 0 (invisible) to 1 (solid). Default: 0.3." },
                rotation: { type: "number", description: "Rotation in degrees. Negative = counter-clockwise. Default: -45." },
                position: {
                  type: "string",
                  enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right"],
                  description: "Watermark position on each page. Default: center.",
                },
              },
              required: ["text"],
            },
          },
        },
        response: {
          200: {
            description: "PDF document binary. Content-Type: application/pdf.",
            type: "string",
            format: "binary",
          },
          400: {
            description: "Missing html/url or invalid parameters.",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as PdfBody & { url?: string };

      if (!body.html && !body.url) {
        return reply
          .status(400)
          .send({ error: "Either html or url must be provided" });
      }

      // SSRF check for URL in POST body
      if (body.url) {
        const urlCheck = await checkSsrf(body.url);
        if (urlCheck) {
          return reply.status(400).send({ error: urlCheck });
        }
      }

      // SSRF check for proxy in POST body
      if (body.proxy) {
        const proxyCheck = await checkSsrf(
          body.proxy.match(/^https?:\/\//) ? body.proxy : `http://${body.proxy}`,
        );
        if (proxyCheck) {
          return reply.status(400).send({ error: `Invalid proxy: ${proxyCheck}` });
        }
      }

      try {
        const result = await generatePdf({
          html: body.html,
          url: body.url,
          format: body.format || "A4",
          landscape: body.landscape || false,
          printBackground: body.printBackground !== false,
          margin: body.margin,
          timeout: body.timeout,
          clean: body.clean || false,
          smartWait: body.smartWait || false,
          maxScroll: body.maxScroll,
          blockAds: body.blockAds || false,
          proxy: body.proxy as string | undefined,
          headerTemplate: body.headerTemplate,
          footerTemplate: body.footerTemplate,
          displayHeaderFooter: body.displayHeaderFooter || false,
          pageRanges: body.pageRanges,
          css: body.css,
          js: body.js,
          headers: body.headers,
          cookies: body.cookies,
          userAgent: body.userAgent,
          scale: body.scale,
          maxPages: body.maxPages,
        });

        let finalBuffer = result.buffer;

        if (body.watermark) {
          finalBuffer = await addWatermark(finalBuffer, body.watermark);
        }

        return reply
          .header("Content-Type", "application/pdf")
          .header("Content-Disposition", 'inline; filename="document.pdf"')
          .send(finalBuffer);
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "PDF generation failed");
        return reply.status(classified.statusCode).send({ error: classified.message });
      }
    },
  );
}

function buildMargin(query: PdfQuery) {
  const { margin_top, margin_right, margin_bottom, margin_left } = query;
  if (!margin_top && !margin_right && !margin_bottom && !margin_left) {
    return undefined;
  }
  return {
    top: margin_top || "0.5in",
    right: margin_right || "0.5in",
    bottom: margin_bottom || "0.5in",
    left: margin_left || "0.5in",
  };
}
