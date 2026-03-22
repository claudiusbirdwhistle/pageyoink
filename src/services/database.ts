import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

let db: Database.Database | null = null;

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "pageyoink.db");

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage (
      api_key TEXT NOT NULL,
      date TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      PRIMARY KEY (api_key, date, endpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_key_date ON usage(api_key, date);
  `);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
