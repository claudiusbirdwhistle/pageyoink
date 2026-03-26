/**
 * In-memory capture progress tracking.
 * Stores the current pipeline stage for each active request.
 * Entries auto-expire after 60 seconds to prevent memory leaks.
 */

export type CaptureStage =
  | "navigating"
  | "loaded"
  | "scrolling"
  | "cleaning"
  | "rendering"
  | "extracting"
  | "complete"
  | "error";

interface ProgressEntry {
  stage: CaptureStage;
  startTime: number;
  updatedAt: number;
}

const progress = new Map<string, ProgressEntry>();
const EXPIRY_MS = 60_000;

export function progressStart(requestId: string): void {
  progress.set(requestId, {
    stage: "navigating",
    startTime: Date.now(),
    updatedAt: Date.now(),
  });
}

export function progressUpdate(
  requestId: string,
  stage: CaptureStage,
): void {
  const entry = progress.get(requestId);
  if (entry) {
    entry.stage = stage;
    entry.updatedAt = Date.now();
  }
}

export function progressGet(
  requestId: string,
): { stage: CaptureStage; elapsed: number } | null {
  const entry = progress.get(requestId);
  if (!entry) return null;

  // Auto-expire old entries
  if (Date.now() - entry.startTime > EXPIRY_MS) {
    progress.delete(requestId);
    return null;
  }

  return {
    stage: entry.stage,
    elapsed: Math.round((Date.now() - entry.startTime) / 100) / 10,
  };
}

export function progressEnd(requestId: string): void {
  progress.delete(requestId);
}

/**
 * Cleanup expired entries. Call periodically to prevent leaks.
 */
export function progressCleanup(): number {
  let cleaned = 0;
  const now = Date.now();
  for (const [key, entry] of progress.entries()) {
    if (now - entry.startTime > EXPIRY_MS) {
      progress.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}
