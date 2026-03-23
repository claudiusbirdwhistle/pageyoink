import { FastifyInstance } from "fastify";
import { getBrowser } from "../services/browser.js";
import {
  renderOgTemplate,
  OgTemplateParams,
} from "../templates/og-templates.js";

interface OgImageQuery {
  title: string;
  subtitle?: string;
  author?: string;
  domain?: string;
  theme?: "light" | "dark" | "gradient";
  brand_color?: string;
  font_size?: "small" | "medium" | "large";
  template?: "default" | "split" | "minimal" | "bold";
  format?: "png" | "jpeg";
  quality?: string;
}

interface OgImageBody extends OgTemplateParams {
  format?: "png" | "jpeg";
  quality?: number;
}

export async function ogImageRoute(app: FastifyInstance) {
  // GET: query params for simple use
  app.get<{ Querystring: OgImageQuery }>(
    "/v1/og-image",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            author: { type: "string" },
            domain: { type: "string" },
            theme: { type: "string", enum: ["light", "dark", "gradient"] },
            brand_color: { type: "string" },
            font_size: { type: "string", enum: ["small", "medium", "large"] },
            template: { type: "string", enum: ["default", "split", "minimal", "bold"] },
            format: { type: "string", enum: ["png", "jpeg"] },
            quality: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        title,
        subtitle,
        author,
        domain,
        theme,
        brand_color,
        font_size,
        template,
        format = "png",
        quality,
      } = request.query;

      try {
        const buffer = await generateOgImage(
          {
            title,
            subtitle,
            author,
            domain,
            theme,
            brandColor: brand_color,
            fontSize: font_size,
            template,
          },
          format,
          quality ? parseInt(quality, 10) : undefined,
        );

        const contentType = format === "jpeg" ? "image/jpeg" : "image/png";
        return reply
          .header("Content-Type", contentType)
          .header(
            "Content-Disposition",
            `inline; filename="og-image.${format}"`,
          )
          .send(buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "OG image generation failed";
        request.log.error({ err }, "OG image generation failed");
        return reply.status(500).send({ error: message });
      }
    },
  );

  // POST: JSON body for full control
  app.post<{ Body: OgImageBody }>(
    "/v1/og-image",
    {
      schema: {
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            author: { type: "string" },
            domain: { type: "string" },
            theme: { type: "string", enum: ["light", "dark", "gradient"] },
            brandColor: { type: "string" },
            fontSize: { type: "string", enum: ["small", "medium", "large"] },
            template: { type: "string", enum: ["default", "split", "minimal", "bold"] },
            format: { type: "string", enum: ["png", "jpeg"] },
            quality: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        title,
        subtitle,
        author,
        domain,
        theme,
        brandColor,
        fontSize,
        template,
        format = "png",
        quality,
      } = request.body;

      try {
        const buffer = await generateOgImage(
          { title, subtitle, author, domain, theme, brandColor, fontSize, template },
          format,
          quality,
        );

        const contentType = format === "jpeg" ? "image/jpeg" : "image/png";
        return reply
          .header("Content-Type", contentType)
          .header(
            "Content-Disposition",
            `inline; filename="og-image.${format}"`,
          )
          .send(buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "OG image generation failed";
        request.log.error({ err }, "OG image generation failed");
        return reply.status(500).send({ error: message });
      }
    },
  );
}

async function generateOgImage(
  params: OgTemplateParams,
  format: "png" | "jpeg",
  quality?: number,
): Promise<Buffer> {
  const html = renderOgTemplate(params);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshotOptions: {
      type: "png" | "jpeg";
      quality?: number;
    } = { type: format };

    if (format === "jpeg" && quality !== undefined) {
      screenshotOptions.quality = Math.min(Math.max(quality, 1), 100);
    }

    return (await page.screenshot(screenshotOptions)) as Buffer;
  } finally {
    await page.close();
  }
}
