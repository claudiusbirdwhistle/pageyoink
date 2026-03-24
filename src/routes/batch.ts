import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { generatePdf } from "../services/pdf.js";
import {
  getDb,
  isUsingFirestore,
  memSet,
  memGet,
} from "../services/database.js";
import crypto from "crypto";
import { checkSsrf } from "../utils/ssrf.js";

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

const MAX_BATCH_SIZE = 50;

// --- Job storage (Firestore in production, in-memory in tests) ---

async function createJob(id: string, total: number): Promise<void> {
  const data = {
    status: "processing",
    createdAt: new Date().toISOString(),
    completedAt: null,
    total,
    completed: 0,
    results: [],
  };

  if (!isUsingFirestore()) {
    memSet("batch_jobs", id, data);
    return;
  }

  const db = getDb();
  await db.collection("batch_jobs").doc(id).set(data);
}

async function getJob(id: string) {
  let data: Record<string, unknown> | null;

  if (!isUsingFirestore()) {
    data = memGet("batch_jobs", id);
  } else {
    const db = getDb();
    const doc = await db.collection("batch_jobs").doc(id).get();
    if (!doc.exists) return null;
    data = doc.data() as Record<string, unknown>;
  }

  if (!data) return null;

  return {
    id,
    status: data.status as string,
    createdAt: data.createdAt as string,
    completedAt: data.completedAt as string | null,
    total: data.total as number,
    completed: data.completed as number,
    results: data.results as BatchResultItem[],
  };
}

async function updateJobProgress(
  id: string,
  completed: number,
  results: BatchResultItem[],
): Promise<void> {
  if (!isUsingFirestore()) {
    memSet("batch_jobs", id, { completed, results });
    return;
  }
  const db = getDb();
  await db.collection("batch_jobs").doc(id).update({ completed, results });
}

async function completeJob(
  id: string,
  status: "complete" | "failed",
  results: BatchResultItem[],
  completed: number,
): Promise<void> {
  const update = {
    status,
    completedAt: new Date().toISOString(),
    completed,
    results,
  };

  if (!isUsingFirestore()) {
    memSet("batch_jobs", id, update);
    return;
  }
  const db = getDb();
  await db.collection("batch_jobs").doc(id).update(update);
}

// --- Route ---

export async function batchRoute(app: FastifyInstance) {
  // POST: Submit a batch job
  app.post<{ Body: BatchRequest }>(
    "/v1/batch",
    {
      schema: {
        description: "Submit a batch of URLs for async screenshot/PDF processing. Returns a job ID for status tracking. Results delivered via polling or webhook.",
        tags: ["Batch"],
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              maxItems: MAX_BATCH_SIZE,
              description: `Array of capture jobs (1-${MAX_BATCH_SIZE} items). Each item is processed sequentially.`,
              items: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", description: "Target URL to capture." },
                  type: {
                    type: "string",
                    enum: ["screenshot", "pdf"],
                    description: "Capture type. Default: screenshot.",
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
            webhook: { type: "string", description: "URL to POST results to when the batch completes. Receives JSON with jobId, status, total, completed, and results array." },
          },
        },
      },
    },
    async (request, reply) => {
      const { items, webhook } = request.body;

      // Validate all URLs (including SSRF checks)
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
        const ssrfCheck = await checkSsrf(item.url);
        if (ssrfCheck) {
          return reply.status(400).send({
            error: `Blocked URL: ${item.url} — ${ssrfCheck}`,
          });
        }
      }

      // Validate webhook URL if provided (including SSRF)
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
        const webhookSsrf = await checkSsrf(webhook);
        if (webhookSsrf) {
          return reply.status(400).send({
            error: `Invalid webhook URL: ${webhookSsrf}`,
          });
        }
      }

      const jobId = crypto.randomUUID();
      await createJob(jobId, items.length);

      // Process in background
      processBatch(jobId, items, webhook, request.log).catch(async (err) => {
        request.log.error({ err, jobId }, "Batch processing failed");
        await completeJob(jobId, "failed", [], 0);
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
      const job = await getJob(jobId);

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
        results: job.status === "complete" ? job.results : undefined,
      };
    },
  );
}

async function processBatch(
  jobId: string,
  items: BatchItem[],
  webhook: string | undefined,
  log: { error: (...args: unknown[]) => void },
): Promise<void> {
  const results: BatchResultItem[] = [];
  let completed = 0;

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

    results.push(resultItem);
    completed++;
    await updateJobProgress(jobId, completed, results);
  }

  await completeJob(jobId, "complete", results, completed);

  // Fire webhook if configured
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          status: "complete",
          total: items.length,
          completed,
          results,
        }),
      });
    } catch (err) {
      log.error({ err, webhook }, "Failed to send webhook notification");
    }
  }
}
