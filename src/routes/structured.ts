import { FastifyInstance } from "fastify";
import { getBrowser } from "../services/browser.js";
import { cleanPage } from "../services/cleanup.js";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";
import {
  extractStructuredData,
  mapToSchema,
  llmExtract,
  StructuredSchema,
} from "../services/structured-extract.js";

interface StructuredBody {
  url: string;
  schema?: StructuredSchema;
  clean?: boolean;
  timeout?: number;
  llm_api_key?: string;
  model?: string;
}

export async function structuredRoute(app: FastifyInstance) {
  // POST /v1/extract/structured — extract typed JSON from a page
  app.post<{ Body: StructuredBody }>(
    "/v1/extract/structured",
    {
      schema: {
        description:
          "Extract structured data from a web page as typed JSON. " +
          "First checks JSON-LD, schema.org, and Open Graph metadata (free, instant). " +
          "Falls back to LLM extraction for missing fields (requires API key). " +
          'Omit schema for auto-extract mode (returns all structured data found on page).',
        tags: ["Extract"],
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL to extract structured data from.",
            },
            schema: {
              type: "object",
              description:
                'JSON object defining fields to extract. Keys are field names, values are types: "string", "number", "boolean", "string[]", "number[]". Example: {"name":"string","price":"number","in_stock":"boolean"}',
              additionalProperties: { type: "string" },
            },
            clean: {
              type: "boolean",
              description: "Remove overlays before extraction. Default: true.",
            },
            timeout: {
              type: "number",
              description: "Max page load time in ms. Default: 30000.",
            },
            llm_api_key: {
              type: "string",
              description:
                "Anthropic API key for LLM fallback extraction. If omitted, only JSON-LD/OG/meta data is returned (fields not found in structured data will be null).",
            },
            model: {
              type: "string",
              description:
                'LLM model for fallback extraction. Default: claude-haiku-4-5-20251001. Options: claude-haiku-4-5-20251001, claude-sonnet-4-6.',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        url: rawUrl,
        schema,
        clean = true,
        timeout = 30_000,
        llm_api_key,
        model,
      } = request.body;

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(validated.url, {
          waitUntil: "load",
          timeout: Math.min(timeout, 60_000),
        });
        await new Promise((r) => setTimeout(r, 500));

        if (clean) {
          await cleanPage(page);
        }

        // Step 1: Extract all structured data from page
        const structuredData = await extractStructuredData(page);

        // Auto-extract mode: no schema provided, return all structured data
        if (!schema) {
          return reply.send({
            jsonLd: structuredData.jsonLd,
            og: structuredData.og,
            meta: structuredData.meta,
            schemaTypes: structuredData.schemaTypes,
            url: validated.url,
          });
        }

        // Step 2: Map structured data to user's schema
        const mapped = mapToSchema(structuredData, schema);

        // Step 3: LLM fallback for missing fields
        if (mapped.missing.length > 0 && llm_api_key) {
          const serverApiKey = process.env.ANTHROPIC_API_KEY;
          const apiKey = llm_api_key || serverApiKey;

          if (apiKey) {
            const missingSchema: Record<string, string> = {};
            for (const field of mapped.missing) {
              missingSchema[field] = schema[field];
            }

            const html = await page.evaluate(
              `document.documentElement.outerHTML`,
            ) as string;
            const llmData = await llmExtract(html, missingSchema, apiKey, model);

            for (const [field, value] of Object.entries(llmData)) {
              if (value !== null && value !== undefined) {
                mapped.data[field] = value;
                mapped.source[field] = "llm";
              }
            }
          }
        }

        return reply.send({
          data: mapped.data,
          source: mapped.source,
          schemaTypes: structuredData.schemaTypes,
          url: validated.url,
        });
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Structured extraction failed");
        return reply
          .status(classified.statusCode)
          .send({ error: classified.message });
      } finally {
        await page.close();
      }
    },
  );
}
