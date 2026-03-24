#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE =
  process.env.PAGEYOINK_API_URL ||
  "https://pageyoink-1085551159615.us-east1.run.app";
const API_KEY = process.env.PAGEYOINK_API_KEY || "";

const TOOLS = [
  {
    name: "web_page",
    description:
      "Load any URL and get its content as markdown, a screenshot, PDF, or metadata. " +
      "One tool for all web page needs. Returns multiple outputs from a single page load.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to capture (e.g., https://example.com)",
        },
        outputs: {
          type: "array",
          items: {
            type: "string",
            enum: ["screenshot", "pdf", "markdown", "text", "html", "metadata"],
          },
          description:
            "Which outputs to generate. Default: [markdown, metadata]. " +
            "Options: screenshot (PNG image), pdf (PDF document), " +
            "markdown (clean content as Markdown), text (plain text), " +
            "html (cleaned HTML), metadata (title, OG tags, stats).",
        },
        clean: {
          type: "boolean",
          description:
            "Remove cookie banners, popups, chat widgets before capture. Default: true.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "screenshot",
    description:
      "Take a screenshot of a web page. Returns a PNG image.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to screenshot",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "extract",
    description:
      "Extract clean content from a web page as Markdown. " +
      "Strips navigation, ads, and sidebars. Perfect for reading web content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to extract content from",
        },
        format: {
          type: "string",
          enum: ["markdown", "text", "html"],
          description: "Output format. Default: markdown.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "metadata",
    description:
      "Get metadata about a web page: title, description, OG tags, " +
      "Twitter Cards, favicon, word count, link count, JSON-LD structured data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to analyze",
        },
      },
      required: ["url"],
    },
  },
];

async function callApi(
  path: string,
  options: { method?: string; body?: unknown; timeout?: number } = {},
): Promise<unknown> {
  const { method = "GET", body, timeout = 45000 } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    // Binary response (screenshot, PDF)
    const buffer = await response.arrayBuffer();
    return { base64: Buffer.from(buffer).toString("base64"), contentType };
  } finally {
    clearTimeout(timeoutId);
  }
}

const server = new Server(
  {
    name: "pageyoink",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "web_page": {
        const url = args?.url as string;
        const outputs = (args?.outputs as string[]) || ["markdown", "metadata"];
        const clean = args?.clean !== false;

        const result = (await callApi("/v1/page", {
          method: "POST",
          body: { url, outputs, clean },
          timeout: 60000,
        })) as Record<string, unknown>;

        // Format response for the AI agent
        const parts: string[] = [];

        if (result.markdown && typeof result.markdown === "object") {
          const md = result.markdown as Record<string, unknown>;
          parts.push(`# ${md.title || "Content"}\n\n${md.content}`);
          if (md.wordCount) parts.push(`\n\n---\n*${md.wordCount} words*`);
        }

        if (result.metadata && typeof result.metadata === "object") {
          const meta = result.metadata as Record<string, unknown>;
          const og = meta.og as Record<string, unknown> | undefined;
          const stats = meta.stats as Record<string, unknown> | undefined;
          parts.push("\n\n## Page Metadata");
          parts.push(`- **Title:** ${meta.title || "N/A"}`);
          if (meta.description) parts.push(`- **Description:** ${meta.description}`);
          if (og?.image) parts.push(`- **OG Image:** ${og.image}`);
          if (stats) {
            parts.push(`- **Words:** ${stats.wordCount}, **Links:** ${stats.linkCount}, **Images:** ${stats.imageCount}`);
          }
        }

        const content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = [];

        if (parts.length > 0) {
          content.push({ type: "text", text: parts.join("\n") });
        }

        if (result.screenshot && typeof result.screenshot === "object") {
          const ss = result.screenshot as Record<string, unknown>;
          content.push({
            type: "image",
            data: ss.base64 as string,
            mimeType: "image/png",
          });
        }

        if (content.length === 0) {
          content.push({ type: "text", text: JSON.stringify(result, null, 2) });
        }

        return { content };
      }

      case "screenshot": {
        const url = args?.url as string;
        const result = (await callApi(
          `/trial/screenshot?url=${encodeURIComponent(url)}&clean=true`,
        )) as { base64: string; contentType: string };

        return {
          content: [
            {
              type: "image",
              data: result.base64,
              mimeType: "image/png",
            },
          ],
        };
      }

      case "extract": {
        const url = args?.url as string;
        const format = (args?.format as string) || "markdown";
        const result = (await callApi(
          `/v1/extract?url=${encodeURIComponent(url)}&format=${format}`,
        )) as Record<string, unknown>;

        return {
          content: [
            {
              type: "text",
              text: `# ${result.title || "Content"}\n\n${result.content}\n\n---\n*${result.wordCount} words*`,
            },
          ],
        };
      }

      case "metadata": {
        const url = args?.url as string;
        const result = (await callApi(
          `/v1/metadata?url=${encodeURIComponent(url)}`,
        )) as Record<string, unknown>;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
