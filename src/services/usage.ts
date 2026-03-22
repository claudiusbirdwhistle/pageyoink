import { getDb } from "./database.js";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function trackUsage(apiKey: string, endpoint: string = "unknown"): void {
  const db = getDb();
  const date = todayKey();

  db.prepare(`
    INSERT INTO usage (api_key, date, endpoint, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(api_key, date, endpoint)
    DO UPDATE SET count = count + 1
  `).run(apiKey, date, endpoint);
}

export function getUsage(apiKey: string): number {
  const db = getDb();
  const date = todayKey();

  const row = db
    .prepare("SELECT SUM(count) as total FROM usage WHERE api_key = ? AND date = ?")
    .get(apiKey, date) as { total: number | null } | undefined;

  return row?.total || 0;
}

export function getUsageStats(): { totalKeys: number; totalRequests: number } {
  const db = getDb();

  const row = db
    .prepare(
      "SELECT COUNT(DISTINCT api_key) as totalKeys, COALESCE(SUM(count), 0) as totalRequests FROM usage",
    )
    .get() as { totalKeys: number; totalRequests: number };

  return row;
}

export function resetUsage(): void {
  const db = getDb();
  db.prepare("DELETE FROM usage").run();
}
