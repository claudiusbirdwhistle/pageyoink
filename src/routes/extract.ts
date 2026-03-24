import { FastifyInstance, FastifyRequest } from "fastify";
import { getBrowser, launchProxyBrowser } from "../services/browser.js";
import { extractContent, ExtractResult } from "../services/extract.js";
import { cleanPage } from "../services/cleanup.js";
import { validateUrlSafe } from "../utils/url.js";

interface ExtractQuery {
  url: string;
  format?: "markdown" | "text" | "html";
  clean?: string;
  timeout?: string;
}

export async function extractRoute(app: FastifyInstance) {
  app.get<{ Querystring: ExtractQuery }>(
    "/v1/extract",
    {
      schema: {
        description:
          "Extract clean content from any URL as Markdown, plain text, or HTML. Uses Mozilla Readability to identify the main article content, stripping navigation, ads, and sidebars. Perfect for feeding web content into LLMs and RAG pipelines.",
        tags: ["Extract"],
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL to extract content from.",
            },
            format: {
              type: "string",
              enum: ["markdown", "text", "html"],
              description:
                "Output format. 'markdown' (default): clean Markdown with headings, links, tables. 'text': plain text only. 'html': cleaned HTML from Readability.",
            },
            clean: {
              type: "string",
              description:
                "Remove cookie banners, popups, and chat widgets before extraction. Pass 'true' to enable. Default: true.",
            },
            timeout: {
              type: "string",
              description:
                "Max time in ms to wait for page load. Default: 30000. Max: 60000.",
            },
          },
        },
        response: {
          200: {
            description: "Extracted content.",
            type: "object",
            properties: {
              content: { type: "string", description: "Extracted content in the requested format." },
              format: { type: "string" },
              title: { type: "string" },
              wordCount: { type: "number" },
              url: { type: "string" },
              excerpt: { type: "string" },
              author: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        url,
        format = "markdown",
        clean,
        timeout,
      } = request.query;

      const validated = await validateUrlSafe(url);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      const effectiveTimeout = Math.min(
        timeout ? parseInt(timeout, 10) : 30_000,
        60_000,
      );
      // Clean mode defaults to true for extraction (you almost always want clean content)
      const shouldClean = clean !== "false";

      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        const response = await page.goto(validated.url, {
          waitUntil: "load",
          timeout: effectiveTimeout,
        });
        await new Promise((r) => setTimeout(r, 1000));

        // Check for non-HTML content types
        const contentType = response?.headers()?.["content-type"] || "";
        if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
          return reply.status(400).send({
            error: `URL returned non-HTML content (${contentType.split(";")[0]}). Extraction requires an HTML page.`,
          });
        }

        if (shouldClean) {
          await cleanPage(page);
        }

        const result = await extractContent(page, format);
        return reply.send(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Content extraction failed";
        request.log.error({ err }, "Extraction failed");
        return reply.status(500).send({ error: message });
      } finally {
        await page.close();
      }
    },
  );
}
