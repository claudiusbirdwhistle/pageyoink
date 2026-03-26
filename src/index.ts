import { buildApp } from "./app.js";
import { getBrowser, closeBrowser } from "./services/browser.js";
import { closeDb } from "./services/database.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    await app.close();
    await closeBrowser();
    closeDb();
    console.log("PageYoink shut down cleanly.");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`PageYoink API running on ${HOST}:${PORT}`);

    // Pre-warm browser so first request doesn't pay cold start cost
    getBrowser().then(() => {
      console.log("Browser pre-warmed and ready.");
    }).catch((err) => {
      console.warn("Browser pre-warm failed (will retry on first request):", err);
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
