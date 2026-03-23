import { Firestore } from "@google-cloud/firestore";

let db: Firestore | null = null;

// In-memory fallback for tests and local development without GCP credentials
const memoryStore = new Map<string, Map<string, Record<string, unknown>>>();

/**
 * Check if we should use Firestore or in-memory fallback.
 * Tests and local dev without credentials use in-memory.
 */
export function isUsingFirestore(): boolean {
  return process.env.NODE_ENV !== "test" && !process.env.USE_MEMORY_DB;
}

export function getDb(): Firestore {
  if (db) return db;

  db = new Firestore({
    projectId: process.env.GCP_PROJECT_ID || "pageyoink-api",
  });

  return db;
}

// --- In-memory store for tests ---

export function memGet(
  collection: string,
  docId: string,
): Record<string, unknown> | null {
  return memoryStore.get(collection)?.get(docId) || null;
}

export function memSet(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): void {
  if (!memoryStore.has(collection)) {
    memoryStore.set(collection, new Map());
  }
  const existing = memoryStore.get(collection)!.get(docId) || {};
  memoryStore.get(collection)!.set(docId, { ...existing, ...data });
}

export function memQuery(
  collection: string,
  filters: Record<string, unknown>,
): Array<{ id: string; data: Record<string, unknown> }> {
  const coll = memoryStore.get(collection);
  if (!coll) return [];

  const results: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const [id, data] of coll.entries()) {
    let matches = true;
    for (const [key, value] of Object.entries(filters)) {
      if (key.endsWith(">=")) {
        const field = key.slice(0, -2);
        if ((data[field] as string) < (value as string)) matches = false;
      } else if (data[key] !== value) {
        matches = false;
      }
    }
    if (matches) results.push({ id, data });
  }
  return results;
}

export function memAll(
  collection: string,
): Array<{ id: string; data: Record<string, unknown> }> {
  const coll = memoryStore.get(collection);
  if (!coll) return [];
  return Array.from(coll.entries()).map(([id, data]) => ({ id, data }));
}

export function closeDb(): void {
  if (db) {
    db.terminate();
    db = null;
  }
  memoryStore.clear();
}
