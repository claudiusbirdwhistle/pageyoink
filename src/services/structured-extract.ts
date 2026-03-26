import { Page } from "puppeteer";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Structured extraction: extract typed JSON from web pages.
 *
 * Strategy:
 * 1. Extract JSON-LD, microdata, schema.org, and Open Graph from page
 * 2. Map structured data to user's requested schema
 * 3. If fields remain unfilled, use LLM fallback
 */

export interface StructuredSchema {
  [key: string]: "string" | "number" | "boolean" | "string[]" | "number[]";
}

export interface StructuredResult {
  data: Record<string, unknown>;
  source: Record<string, "json-ld" | "og" | "meta" | "llm" | "not_found">;
  schemaTypes: string[];
}

/**
 * Extract all structured data from a page (JSON-LD, Open Graph, meta tags).
 */
export async function extractStructuredData(page: Page): Promise<{
  jsonLd: Record<string, unknown>[];
  og: Record<string, string>;
  meta: Record<string, string>;
  schemaTypes: string[];
}> {
  return await page.evaluate(`(function() {
    var result = { jsonLd: [], og: {}, meta: {}, schemaTypes: [] };

    // JSON-LD
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var data = JSON.parse(scripts[i].textContent || "");
        if (Array.isArray(data)) {
          for (var j = 0; j < data.length; j++) result.jsonLd.push(data[j]);
        } else {
          result.jsonLd.push(data);
        }
        if (data["@type"]) result.schemaTypes.push(String(data["@type"]));
      } catch(e) {}
    }

    // Open Graph
    var ogTags = document.querySelectorAll('meta[property^="og:"]');
    for (var k = 0; k < ogTags.length; k++) {
      var prop = ogTags[k].getAttribute("property") || "";
      var content = ogTags[k].getAttribute("content") || "";
      result.og[prop.replace("og:", "")] = content;
    }

    // Meta tags
    var metaTags = document.querySelectorAll("meta[name]");
    for (var m = 0; m < metaTags.length; m++) {
      var name = metaTags[m].getAttribute("name") || "";
      var value = metaTags[m].getAttribute("content") || "";
      if (name && value) result.meta[name] = value;
    }

    return result;
  })()`) as {
    jsonLd: Record<string, unknown>[];
    og: Record<string, string>;
    meta: Record<string, string>;
    schemaTypes: string[];
  };
}

/**
 * Map extracted structured data to a user-defined schema.
 * Returns filled fields and tracks the source of each value.
 */
export function mapToSchema(
  structuredData: {
    jsonLd: Record<string, unknown>[];
    og: Record<string, string>;
    meta: Record<string, string>;
  },
  schema: StructuredSchema,
): { data: Record<string, unknown>; source: Record<string, string>; missing: string[] } {
  const data: Record<string, unknown> = {};
  const source: Record<string, string> = {};
  const missing: string[] = [];

  for (const [field, type] of Object.entries(schema)) {
    const fieldLower = field.toLowerCase();
    let found = false;

    // Search JSON-LD first (richest structured data)
    for (const ld of structuredData.jsonLd) {
      const value = findInObject(ld, fieldLower);
      if (value !== undefined) {
        data[field] = coerce(value, type);
        source[field] = "json-ld";
        found = true;
        break;
      }
    }

    if (found) continue;

    // Search Open Graph
    if (structuredData.og[fieldLower] || structuredData.og[field]) {
      const value = structuredData.og[fieldLower] || structuredData.og[field];
      data[field] = coerce(value, type);
      source[field] = "og";
      continue;
    }

    // Search meta tags
    if (structuredData.meta[fieldLower] || structuredData.meta[field]) {
      const value = structuredData.meta[fieldLower] || structuredData.meta[field];
      data[field] = coerce(value, type);
      source[field] = "meta";
      continue;
    }

    missing.push(field);
    source[field] = "not_found";
  }

  return { data, source, missing };
}

/**
 * LLM fallback: extract missing fields from page content.
 * Requires either a user-supplied API key or the server's own key.
 */
export async function llmExtract(
  htmlContent: string,
  missingFields: Record<string, string>,
  apiKey: string,
  model: string = "claude-haiku-4-5-20251001",
): Promise<Record<string, unknown>> {
  const client = new Anthropic({ apiKey });

  // Trim HTML to fit in context (keep first 30K chars)
  const trimmed = htmlContent.length > 30000
    ? htmlContent.substring(0, 30000) + "\n...[truncated]"
    : htmlContent;

  const fieldList = Object.entries(missingFields)
    .map(([name, type]) => `  "${name}": ${type}`)
    .join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract the following fields from this web page HTML. Return ONLY valid JSON with the requested fields. If a field cannot be found, set it to null.

Fields to extract:
${fieldList}

HTML content:
${trimmed}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {};
    }
  }

  return {};
}

// --- Helpers ---

function findInObject(obj: Record<string, unknown>, key: string): unknown {
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase() === key) return v;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const found = findInObject(v as Record<string, unknown>, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function coerce(
  value: unknown,
  type: string,
): unknown {
  switch (type) {
    case "string":
      return String(value);
    case "number":
      return Number(value) || 0;
    case "boolean":
      return Boolean(value);
    case "string[]":
      return Array.isArray(value) ? value.map(String) : [String(value)];
    case "number[]":
      return Array.isArray(value) ? value.map(Number) : [Number(value)];
    default:
      return value;
  }
}
