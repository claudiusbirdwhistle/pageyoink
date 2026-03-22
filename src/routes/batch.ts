import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { generatePdf } from "../services/pdf.js";
import crypto from "crypto";

interface BatchItem {
  url: string;
  type?: "screenshot" | "pdf";
  format?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  width?: number;
  height?: number;
  clean?: boolean;
  smartWait?: boolean;
}

interface BatchRequest {
  items: BatchItem[];
  webhook?: string;
}

interface BatchResultItem {
  url: string;
  type: string;
  status: "success" | "error";
  contentType?: string;
  data?: string; // base64 encoded
  error?: string;
}

interface BatchJob {
  id: string;
  status: "processing" | "complete" | "failed";
  createdAt: string;
  completedAt?: string;
  results: BatchResultItem[];
  total: number;
  completed: number;
}

// In-memory job storage (replace with persistent storage for production)
const jobs = new Map<string, BatchJob>();

const MAX_BATCH_SIZE = 50;

export async function batchRoute(app: FastifyInstance) {
  // POST: Submit a batch job
  app.post<{ Body: BatchRequest }>(
    "/v1/batch",
    {
      schema: {
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              maxItems: MAX_BATCH_SIZE,
              items: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["screenshot", "pdf"],
                  },
                  format: { type: "string", enum: ["png", "jpeg"] },
                  quality: { type: "number" },
                  fullPage: { type: "boolean" },
                  width: { type: "number" },
                  height: { type: "number" },
                  clean: { type: "boolean" },
                  smartWait: { type: "boolean" },
                },
              },
            },
            webhook: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { items, webhook } = request.body;

      // Validate all URLs
      for (const item of items) {
        try {
          const parsed = new URL(item.url);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return reply.status(400).send({
              error: `Invalid URL: ${item.url} — only http and https protocols are supported`,
            });
          }
        } catch {
          return reply.status(400).send({
            error: `Invalid URL: ${item.url}`,
          });
        }
      }

      // Validate webhook URL if provided
      if (webhook) {
        try {
          const parsed = new URL(webhook);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return reply.status(400).send({
              error: "Invalid webhook URL",
            });
          }
        } catch {
          return reply.status(400).send({
            error: "Invalid webhook URL",
          });
        }
      }

      const jobId = crypto.randomUUID();
      const job: BatchJob = {
        id: jobId,
        status: "processing",
        createdAt: new Date().toISOString(),
        results: [],
        total: items.length,
        completed: 0,
      };

      jobs.set(jobId, job);

      // Process in background
      processBatch(job, items, webhook, request.log).catch((err) => {
        request.log.error({ err, jobId }, "Batch processing failed");
        job.status = "failed";
      });

      return reply.status(202).send({
        jobId,
        status: "processing",
        total: items.length,
        statusUrl: `/v1/batch/${jobId}`,
      });
    },
  );

  // GET: Check batch job status
  app.get<{ Params: { jobId: string } }>(
    "/v1/batch/:jobId",
    async (request, reply) => {
      const { jobId } = request.params;
      const job = jobs.get(jobId);

      if (!job) {
        return reply.status(404).send({ error: "Job not found" });
      }

      return {
        id: job.id,
        status: job.status,
        total: job.total,
        completed: job.completed,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        results:
          job.status === "complete"
            ? job.results
            : undefined,
      };
    },
  );
}

async function processBatch(
  job: BatchJob,
  items: BatchItem[],
  webhook: string | undefined,
  log: { error: (...args: unknown[]) => void },
): Promise<void> {
  // Process items sequentially to avoid overwhelming the browser
  for (const item of items) {
    const type = item.type || "screenshot";
    const resultItem: BatchResultItem = {
      url: item.url,
      type,
      status: "success",
    };

    try {
      if (type === "screenshot") {
        const result = await takeScreenshot({
          url: item.url,
          format: item.format || "png",
          quality: item.quality,
          fullPage: item.fullPage || false,
          width: item.width,
          height: item.height,
          clean: item.clean || false,
          smartWait: item.smartWait || false,
        });
        resultItem.contentType = result.contentType;
        resultItem.data = result.buffer.toString("base64");
      } else {
        const result = await generatePdf({
          url: item.url,
          clean: item.clean || false,
          smartWait: item.smartWait || false,
        });
        resultItem.contentType = "application/pdf";
        resultItem.data = result.buffer.toString("base64");
      }
    } catch (err) {
      resultItem.status = "error";
      resultItem.error =
        err instanceof Error ? err.message : "Processing failed";
    }

    job.results.push(resultItem);
    job.completed++;
  }

  job.status = "complete";
  job.completedAt = new Date().toISOString();

  // Fire webhook if configured
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          status: "complete",
          total: job.total,
          completed: job.completed,
          results: job.results,
        }),
      });
    } catch (err) {
      log.error({ err, webhook }, "Failed to send webhook notification");
    }
  }
}
