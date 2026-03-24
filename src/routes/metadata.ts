import { FastifyInstance } from "fastify";
import { getBrowser } from "../services/browser.js";
import { extractMetadata } from "../services/metadata.js";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";

interface MetadataQuery {
  url: string;
  timeout?: string;
}

export async function metadataRoute(app: FastifyInstance) {
  app.get<{ Querystring: MetadataQuery }>(
    "/v1/metadata",
    {
      schema: {
        description:
          "Extract comprehensive metadata from any URL — title, description, Open Graph tags, Twitter Cards, favicon, structured data (JSON-LD), and page statistics (word count, link count, images). Lightweight and fast.",
        tags: ["Metadata"],
        querystring: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL to extract metadata from.",
            },
            timeout: {
              type: "string",
              description: "Max time in ms to wait for page load. Default: 15000. Max: 60000.",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { url, timeout } = request.query;

      const validated = await validateUrlSafe(url);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      // Shorter default timeout for metadata (lighter operation)
      const effectiveTimeout = Math.min(
        timeout ? parseInt(timeout, 10) : 15_000,
        60_000,
      );

      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(validated.url, {
          waitUntil: "load",
          timeout: effectiveTimeout,
        });
        // Brief wait for any JS-rendered meta tags
        await new Promise((r) => setTimeout(r, 500));

        const metadata = await extractMetadata(page);
        return reply.send(metadata);
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Metadata extraction failed");
        return reply.status(classified.statusCode).send({ error: classified.message });
      } finally {
        await page.close();
      }
    },
  );
}
