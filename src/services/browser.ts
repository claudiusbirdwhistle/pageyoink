import puppeteer, { Browser } from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Register stealth plugin with puppeteer-extra
puppeteerExtra.use(StealthPlugin());

let browser: Browser | null = null;
let stealthBrowser: Browser | null = null;

const BASE_ARGS = [
  "--no-sandbox",           // Required in Docker containers without user namespace
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--no-first-run",
  // NOTE: --single-process REMOVED — it allows cross-request interference
  // NOTE: --no-sandbox kept because Docker typically runs as root.
  // Compensating control: SSRF protection prevents access to internal services.
  // TODO: Run browser as non-root user in Docker for defense-in-depth.
];

/**
 * Get the shared browser instance (no proxy).
 */
export async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: true,
    args: BASE_ARGS,
  });

  return browser;
}

/**
 * Get the shared stealth browser instance.
 * Uses puppeteer-extra with stealth plugin to evade bot detection.
 * Bypasses basic Cloudflare, DataDome, and similar anti-bot systems.
 */
export async function getStealthBrowser(): Promise<Browser> {
  if (stealthBrowser && stealthBrowser.connected) {
    return stealthBrowser;
  }

  stealthBrowser = await puppeteerExtra.launch({
    headless: true,
    args: BASE_ARGS,
  }) as unknown as Browser;

  return stealthBrowser;
}

/**
 * Launch a temporary browser with a proxy server.
 * Caller is responsible for closing it after use.
 *
 * @param proxy - Proxy URL (e.g., "http://user:pass@host:port" or "host:port")
 */
export async function launchProxyBrowser(proxy: string): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [...BASE_ARGS, `--proxy-server=${proxy}`],
  });
}

/**
 * Launch a temporary browser with HTTP/2 disabled.
 * Used as fallback when sites have HTTP/2 protocol errors.
 * Caller is responsible for closing it after use.
 */
export async function launchHttp1Browser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [...BASE_ARGS, "--disable-http2"],
  });
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
  if (stealthBrowser) {
    await stealthBrowser.close();
    stealthBrowser = null;
  }
}
