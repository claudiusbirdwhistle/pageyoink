import { FastifyInstance } from "fastify";
import { getBrowser, launchProxyBrowser } from "../services/browser.js";
import { cleanPage } from "../services/cleanup.js";
import { extractContent } from "../services/extract.js";
import { extractMetadata } from "../services/metadata.js";
import { triggerLazyImages } from "../services/lazy-load.js";
import { waitForPageReady, installMutationTracker } from "../services/readiness.js";
import { enableAdBlocking } from "../services/adblock.js";
import { hideAdsStealthily } from "../services/stealth-adblock.js";
import { applyPrintFixes } from "../services/print-fix.js";
import { validateUrlSafe } from "../utils/url.js";
import { validateViewport, validateCssSize, validateJsSize } from "../utils/validation.js";
import { classifyNavigationError } from "../utils/errors.js";
import { jsonCacheGet, jsonCacheSet } from "../services/json-cache.js";
import { extractStructuredData } from "../services/structured-extract.js";

interface PageBody {
  url: string;
  outputs?: string[];
  clean?: boolean;
  smartWait?: boolean;
  blockAds?: boolean | "cosmetic";
  viewport?: { width?: number; height?: number };
  timeout?: number;
  css?: string;
  js?: string;
  userAgent?: string;
  // PDF-specific
  pdfFormat?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  // Extract-specific
  extractFormat?: "markdown" | "text" | "html";
}

const DEFAULT_OUTPUTS = ["screenshot", "markdown", "metadata"];
const VALID_OUTPUTS = new Set(["screenshot", "pdf", "markdown", "text", "html", "metadata", "structured"]);

export async function pageRoute(app: FastifyInstance) {
  app.post<{ Body: PageBody }>(
    "/v1/page",
    {
      schema: {
        description:
          "Unified page capture endpoint. Load a URL once and extract multiple outputs from a single page load: screenshot, PDF, markdown, plain text, cleaned HTML, and/or metadata. This is more efficient than calling individual endpoints separately.",
        tags: ["Page (Unified)"],
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL to capture.",
            },
            outputs: {
              type: "array",
              items: { type: "string", enum: [...VALID_OUTPUTS] },
              description:
                "Which outputs to generate. Options: screenshot, pdf, markdown, text, html, metadata. Default: [screenshot, markdown, metadata]. All outputs come from a single page load.",
            },
            clean: {
              type: "boolean",
              description: "Remove cookie banners, popups, chat widgets. Default: true.",
            },
            smartWait: {
              type: "boolean",
              description: "Wait for DOM stability, fonts, images, animations. Default: false.",
            },
            blockAds: {
              description: "true = network blocking, 'cosmetic' = visual hiding.",
            },
            viewport: {
              type: "object",
              properties: {
                width: { type: "number", description: "Viewport width. Default: 1280." },
                height: { type: "number", description: "Viewport height. Default: 720." },
              },
            },
            timeout: {
              type: "number",
              description: "Navigation timeout in ms. Default: 30000. Max: 60000.",
            },
            css: { type: "string", description: "Custom CSS to inject before capture." },
            js: { type: "string", description: "Custom JavaScript to execute before capture." },
            userAgent: { type: "string", description: "Custom User-Agent string." },
            pdfFormat: {
              type: "string",
              enum: ["A4", "Letter", "Legal", "A3"],
              description: "PDF page size (if pdf output requested). Default: A4.",
            },
            landscape: {
              type: "boolean",
              description: "PDF landscape mode. Default: false.",
            },
            extractFormat: {
              type: "string",
              enum: ["markdown", "text", "html"],
              description: "Format for text extraction outputs. Default: markdown.",
            },
            antibot: {
              type: "boolean",
              description: "Anti-bot evasion to bypass Cloudflare, DataDome, etc.",
            },
            optimize: {
              type: "boolean",
              description: "Auto-optimize capture parameters based on page content analysis.",
            },
          },
        },
        response: {
          200: {
            description: "Combined outputs from the page capture.",
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      // Validate URL
      const validated = await validateUrlSafe(body.url);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      // Validate outputs
      const outputs = body.outputs || DEFAULT_OUTPUTS;
      for (const output of outputs) {
        if (!VALID_OUTPUTS.has(output)) {
          return reply.status(400).send({
            error: `Invalid output: "${output}". Valid options: ${[...VALID_OUTPUTS].join(", ")}`,
          });
        }
      }

      // Validate inputs
      const vpWidth = body.viewport?.width;
      const vpHeight = body.viewport?.height;
      const vpError = validateViewport(vpWidth, vpHeight);
      if (vpError) return reply.status(400).send({ error: vpError });

      const cssError = validateCssSize(body.css);
      if (cssError) return reply.status(400).send({ error: cssError });

      const jsError = validateJsSize(body.js);
      if (jsError) return reply.status(400).send({ error: jsError });

      const effectiveTimeout = Math.min(body.timeout || 30_000, 60_000);
      const shouldClean = body.clean !== false; // Default true

      // Check cache
      const cacheParams = { url: validated.url, outputs, clean: shouldClean, blockAds: body.blockAds, viewport: body.viewport };
      const cached = jsonCacheGet(cacheParams);
      if (cached) {
        return reply.header("X-Cache", "HIT").send(cached);
      }

      // G2: Retry logic for browser crashes
      const maxRetries = 2;
      let lastError: unknown;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
        // Set viewport
        await page.setViewport({
          width: vpWidth || 1280,
          height: vpHeight || 720,
        });

        // Ad blocking
        if (body.blockAds === true) {
          await enableAdBlocking(page);
        }

        // User agent
        if (body.userAgent) {
          await page.setUserAgent(body.userAgent);
        }

        // Navigate
        const navResponse = await page.goto(validated.url, {
          waitUntil: "load",
          timeout: effectiveTimeout,
        });
        await new Promise((r) => setTimeout(r, 1000));

        // G3: Check content type for non-HTML URLs
        const contentType = navResponse?.headers()?.["content-type"] || "";
        const isHtml = !contentType || contentType.includes("text/html") || contentType.includes("text/plain") || contentType.includes("application/xhtml");
        if (!isHtml) {
          // Non-HTML content: allow screenshot/pdf but block extract/markdown
          const textOutputs = outputs.filter((o) => ["markdown", "text", "html"].includes(o));
          if (textOutputs.length > 0 && !outputs.includes("screenshot") && !outputs.includes("pdf")) {
            return reply.status(400).send({
              error: `URL returned non-HTML content (${contentType.split(";")[0]}). Text extraction requires an HTML page.`,
            });
          }
        }

        // Smart wait
        if (body.smartWait) {
          await installMutationTracker(page);
        }

        // Inject CSS/JS
        if (body.css) await page.addStyleTag({ content: body.css });
        if (body.js) await page.evaluate(`(function(){${body.js}})()`);

        // Lazy-load images if screenshot or PDF requested
        if (outputs.includes("screenshot") || outputs.includes("pdf")) {
          const scrollDepth = Math.ceil(
            await page.evaluate(`document.body.scrollHeight / window.innerHeight`) + 2,
          );
          await triggerLazyImages(page, scrollDepth);
        }

        // Smart wait readiness
        if (body.smartWait) {
          await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
        }

        // Clean mode
        if (shouldClean) {
          await cleanPage(page);
        }

        // Stealth ad blocking (post-render)
        if (body.blockAds === "cosmetic") {
          await hideAdsStealthily(page);
        }

        // Build response with requested outputs
        const result: Record<string, unknown> = {};

        // Phase 1: Parallel read-only operations (metadata + content extraction)
        // These only read the DOM and don't modify the page, so they can run in parallel
        const parallelTasks: Promise<void>[] = [];

        if (outputs.includes("metadata")) {
          parallelTasks.push(
            extractMetadata(page).then((meta) => { result.metadata = meta; }),
          );
        }

        const extractFormats = ["markdown", "text", "html"];
        const requestedExtracts = outputs.filter((o) => extractFormats.includes(o));
        if (requestedExtracts.length > 0) {
          const format = (body.extractFormat || requestedExtracts[0]) as "markdown" | "text" | "html";
          parallelTasks.push(
            extractContent(page, format).then((extracted) => {
              result[format] = {
                content: extracted.content,
                title: extracted.title,
                wordCount: extracted.wordCount,
                excerpt: extracted.excerpt,
                author: extracted.author,
              };
            }),
          );
        }

        if (outputs.includes("structured")) {
          parallelTasks.push(
            extractStructuredData(page).then((structured) => {
              result.structured = structured;
            }),
          );
        }

        if (parallelTasks.length > 0) {
          await Promise.all(parallelTasks);
        }

        // Phase 2: Screenshot (before print fixes modify the page)
        if (outputs.includes("screenshot")) {
          const screenshotBuffer = await page.screenshot({
            type: "png",
            fullPage: false,
          });
          result.screenshot = {
            base64: Buffer.from(screenshotBuffer).toString("base64"),
            contentType: "image/png",
            size: screenshotBuffer.byteLength,
          };
        }

        // Phase 3: PDF (last — applyPrintFixes modifies the page)
        if (outputs.includes("pdf")) {
          await applyPrintFixes(page);
          const pdfBuffer = await page.pdf({
            format: body.pdfFormat || "A4",
            landscape: body.landscape || false,
            printBackground: true,
            margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
          });
          result.pdf = {
            base64: Buffer.from(pdfBuffer).toString("base64"),
            contentType: "application/pdf",
            size: pdfBuffer.byteLength,
          };
        }

        result.url = validated.url;
        result.outputs = outputs;

        // Cache the response
        jsonCacheSet(cacheParams, result as Record<string, unknown>);

        return reply.header("X-Cache", "MISS").send(result);
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          // Only retry on browser crashes / protocol errors, not on client errors
          if (msg.includes("Protocol error") || msg.includes("Session closed") || msg.includes("Target closed")) {
            request.log.warn({ err, attempt }, "Browser crash, retrying...");
            continue;
          }
          // Non-retryable error
          const classified = classifyNavigationError(err);
          request.log.error({ err }, "Unified page capture failed");
          return reply.status(classified.statusCode).send({ error: classified.message });
        } finally {
          await page.close();
        }
      }

      // All retries exhausted
      const classified = classifyNavigationError(lastError);
      request.log.error({ err: lastError }, "Unified page capture failed after retries");
      return reply.status(classified.statusCode).send({ error: classified.message });
    },
  );
}
