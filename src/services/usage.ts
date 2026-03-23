import { getDb } from "./database.js";
import { FieldValue } from "@google-cloud/firestore";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function trackUsage(apiKey: string, endpoint: string = "unknown"): void {
  const db = getDb();
  const date = todayKey();
  const docId = `${apiKey}:${date}:${endpoint}`;

  const ref = db.collection("usage").doc(docId);
  ref
    .set(
      {
        apiKey,
        date,
        endpoint,
        count: FieldValue.increment(1),
      },
      { merge: true },
    )
    .catch(() => {
      // Non-blocking — don't fail requests on usage tracking errors
    });
}

export async function getUsage(apiKey: string): Promise<number> {
  const db = getDb();
  const date = todayKey();

  const snapshot = await db
    .collection("usage")
    .where("apiKey", "==", apiKey)
    .where("date", "==", date)
    .get();

  let total = 0;
  snapshot.forEach((doc) => {
    total += doc.data().count || 0;
  });

  return total;
}

export async function getUsageStats(): Promise<{
  totalKeys: number;
  totalRequests: number;
}> {
  const db = getDb();

  const snapshot = await db.collection("usage").get();

  const keys = new Set<string>();
  let totalRequests = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    keys.add(data.apiKey);
    totalRequests += data.count || 0;
  });

  return { totalKeys: keys.size, totalRequests };
}

export function resetUsage(): void {
  // No-op for Firestore (used in tests)
}
