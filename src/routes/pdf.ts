import { FastifyInstance } from "fastify";
import { generatePdf } from "../services/pdf.js";
import { cacheGet, cacheSet } from "../services/cache.js";
import { addWatermark, WatermarkOptions } from "../services/watermark.js";

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
  ttl?: string;
  fresh?: string;
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
}

export async function pdfRoute(app: FastifyInstance) {
  // GET: URL-to-PDF
  app.get<{ Querystring: PdfQuery }>(
    "/v1/pdf",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string" },
            format: { type: "string", enum: ["A4", "Letter", "Legal", "A3"] },
            landscape: { type: "string" },
            print_background: { type: "string" },
            margin_top: { type: "string" },
            margin_right: { type: "string" },
            margin_bottom: { type: "string" },
            margin_left: { type: "string" },
            timeout: { type: "string" },
            clean: { type: "string" },
            smart_wait: { type: "string" },
            max_scroll: { type: "string" },
            block_ads: { type: "string" },
            css: { type: "string" },
            js: { type: "string" },
            user_agent: { type: "string" },
            ttl: { type: "string" },
            fresh: { type: "string" },
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
        ttl,
        fresh,
      } = request.query;

      // Validate URL
      try {
        const parsed = new URL(url!);
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
          type: "pdf" as const,
          url,
          format: format || "A4",
          landscape: landscape === "true",
          printBackground: print_background !== "false",
          margin: buildMargin(request.query),
          clean: clean === "true",
          smartWait: smart_wait === "true",
          maxScroll: max_scroll ? parseInt(max_scroll, 10) : undefined,
          blockAds: block_ads === "true",
          css: css || undefined,
          js: js || undefined,
          userAgent: user_agent || undefined,
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

        cacheSet(captureParams, result.buffer, "application/pdf", cacheTtl);

        return reply
          .header("Content-Type", "application/pdf")
          .header("X-Cache", "MISS")
          .header("Content-Disposition", 'inline; filename="document.pdf"')
          .send(result.buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "PDF generation failed";
        request.log.error({ err }, "PDF generation failed");
        return reply.status(500).send({ error: message });
      }
    },
  );

  // POST: HTML-to-PDF (also supports full options for URL-based via JSON body)
  app.post<{ Body: PdfBody }>(
    "/v1/pdf",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            html: { type: "string" },
            url: { type: "string" },
            format: { type: "string", enum: ["A4", "Letter", "Legal", "A3"] },
            landscape: { type: "boolean" },
            printBackground: { type: "boolean" },
            margin: {
              type: "object",
              properties: {
                top: { type: "string" },
                right: { type: "string" },
                bottom: { type: "string" },
                left: { type: "string" },
              },
            },
            timeout: { type: "number" },
            clean: { type: "boolean" },
            smartWait: { type: "boolean" },
            maxScroll: { type: "number" },
            blockAds: { type: "boolean" },
            headerTemplate: { type: "string" },
            footerTemplate: { type: "string" },
            displayHeaderFooter: { type: "boolean" },
            pageRanges: { type: "string" },
            css: { type: "string" },
            js: { type: "string" },
            headers: { type: "object" },
            cookies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  domain: { type: "string" },
                },
              },
            },
            userAgent: { type: "string" },
            proxy: { type: "string" },
            watermark: {
              type: "object",
              properties: {
                text: { type: "string" },
                fontSize: { type: "number" },
                color: { type: "string" },
                opacity: { type: "number" },
                rotation: { type: "number" },
                position: { type: "string", enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right"] },
              },
              required: ["text"],
            },
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
        });

        let finalBuffer = result.buffer;

        // Apply watermark if requested
        if (body.watermark) {
          finalBuffer = await addWatermark(finalBuffer, body.watermark);
        }

        return reply
          .header("Content-Type", "application/pdf")
          .header("Content-Disposition", 'inline; filename="document.pdf"')
          .send(finalBuffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "PDF generation failed";
        request.log.error({ err }, "PDF generation failed");
        return reply.status(500).send({ error: message });
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
