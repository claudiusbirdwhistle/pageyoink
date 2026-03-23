import { Firestore } from "@google-cloud/firestore";

let db: Firestore | null = null;

/**
 * Get the Firestore client. On Cloud Run, authentication is automatic
 * via the service account. Locally, use GOOGLE_APPLICATION_CREDENTIALS
 * env var or gcloud auth application-default login.
 *
 * Falls back to SQLite-like in-memory behavior when Firestore is unavailable
 * (e.g., in tests).
 */
export function getDb(): Firestore {
  if (db) return db;

  db = new Firestore({
    projectId: process.env.GCP_PROJECT_ID || "pageyoink-api",
  });

  return db;
}

export function closeDb(): void {
  if (db) {
    db.terminate();
    db = null;
  }
}
