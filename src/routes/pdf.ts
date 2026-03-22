import { FastifyInstance } from "fastify";
import { generatePdf } from "../services/pdf.js";

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
          },
        },
      },
    },
    async (request, reply) => {
      const { url, format, landscape, print_background, timeout, clean, smart_wait } =
        request.query;

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
        const result = await generatePdf({
          url,
          format: format || "A4",
          landscape: landscape === "true",
          printBackground: print_background !== "false",
          margin: buildMargin(request.query),
          timeout: timeout ? parseInt(timeout, 10) : undefined,
          clean: clean === "true",
          smartWait: smart_wait === "true",
        });

        return reply
          .header("Content-Type", "application/pdf")
          .header(
            "Content-Disposition",
            'inline; filename="document.pdf"',
          )
          .send(result.buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "PDF generation failed";
        request.log.error({ err }, "PDF generation failed");
        return reply.status(500).send({ error: message });
      }
    },
  );

  // POST: HTML-to-PDF
  app.post<{ Body: PdfBody }>(
    "/v1/pdf",
    {
      schema: {
        body: {
          type: "object",
          required: ["html"],
          properties: {
            html: { type: "string" },
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
          },
        },
      },
    },
    async (request, reply) => {
      const { html, format, landscape, printBackground, margin, timeout, clean, smartWait } =
        request.body;

      try {
        const result = await generatePdf({
          html,
          format: format || "A4",
          landscape: landscape || false,
          printBackground: printBackground !== false,
          margin,
          timeout,
          clean: clean || false,
          smartWait: smartWait || false,
        });

        return reply
          .header("Content-Type", "application/pdf")
          .header(
            "Content-Disposition",
            'inline; filename="document.pdf"',
          )
          .send(result.buffer);
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
