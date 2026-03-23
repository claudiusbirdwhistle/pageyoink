import { PuppeteerBlocker } from "@ghostery/adblocker-puppeteer";
import { Page } from "puppeteer";

let blocker: PuppeteerBlocker | null = null;

/**
 * Get or initialize the ad blocker instance.
 * The blocker is a singleton — filter lists are loaded once and reused.
 */
async function getBlocker(): Promise<PuppeteerBlocker> {
  if (blocker) return blocker;

  // Load default filter lists (EasyList, EasyPrivacy, Peter Lowe's, uBlock filters)
  blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);

  return blocker;
}

/**
 * Enable ad blocking on a page.
 * Call this BEFORE navigating to the URL.
 */
export async function enableAdBlocking(page: Page): Promise<void> {
  const b = await getBlocker();
  await b.enableBlockingInPage(page);
}

/**
 * Disable ad blocking on a page (cleanup).
 */
export async function disableAdBlocking(page: Page): Promise<void> {
  const b = await getBlocker();
  b.disableBlockingInPage(page);
}
