// In-memory usage tracking for MVP
// TODO: Replace with persistent storage (SQLite or Redis) for production

interface UsageRecord {
  count: number;
  date: string; // YYYY-MM-DD
}

const usage = new Map<string, UsageRecord>();

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getKey(apiKey: string): string {
  return `${apiKey}:${todayKey()}`;
}

export function trackUsage(apiKey: string): void {
  const key = getKey(apiKey);
  const record = usage.get(key);
  if (record) {
    record.count++;
  } else {
    usage.set(key, { count: 1, date: todayKey() });
  }
}

export function getUsage(apiKey: string): number {
  const key = getKey(apiKey);
  return usage.get(key)?.count || 0;
}

export function getUsageStats(): { totalKeys: number; totalRequests: number } {
  let totalRequests = 0;
  const keys = new Set<string>();

  for (const [compositeKey, record] of usage.entries()) {
    const apiKey = compositeKey.split(":")[0];
    keys.add(apiKey);
    totalRequests += record.count;
  }

  return { totalKeys: keys.size, totalRequests };
}

export function resetUsage(): void {
  usage.clear();
}
