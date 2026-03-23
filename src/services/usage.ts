import {
  getDb,
  isUsingFirestore,
  memSet,
  memQuery,
  memAll,
} from "./database.js";
import { FieldValue } from "@google-cloud/firestore";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function trackUsage(
  apiKey: string,
  endpoint: string = "unknown",
): void {
  const date = todayKey();
  const docId = `${apiKey}:${date}:${endpoint}`;

  if (!isUsingFirestore()) {
    const existing = memQuery("usage", { apiKey, date, endpoint });
    if (existing.length > 0) {
      memSet("usage", docId, {
        count: ((existing[0].data.count as number) || 0) + 1,
      });
    } else {
      memSet("usage", docId, { apiKey, date, endpoint, count: 1 });
    }
    return;
  }

  const db = getDb();
  db.collection("usage")
    .doc(docId)
    .set(
      { apiKey, date, endpoint, count: FieldValue.increment(1) },
      { merge: true },
    )
    .catch(() => {});
}

export async function getUsage(apiKey: string): Promise<number> {
  const date = todayKey();

  if (!isUsingFirestore()) {
    const results = memQuery("usage", { apiKey, date });
    return results.reduce((sum, r) => sum + ((r.data.count as number) || 0), 0);
  }

  const db = getDb();
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
  if (!isUsingFirestore()) {
    const all = memAll("usage");
    const keys = new Set<string>();
    let totalRequests = 0;
    for (const { data } of all) {
      keys.add(data.apiKey as string);
      totalRequests += (data.count as number) || 0;
    }
    return { totalKeys: keys.size, totalRequests };
  }

  const db = getDb();
  const snapshot = await db.collection("usage").get();
  const keys = new Set<string>();
  let totalRequests = 0;
  snapshot.forEach((doc) => {
    keys.add(doc.data().apiKey);
    totalRequests += doc.data().count || 0;
  });
  return { totalKeys: keys.size, totalRequests };
}

export function resetUsage(): void {
  // Only meaningful for in-memory store
}
