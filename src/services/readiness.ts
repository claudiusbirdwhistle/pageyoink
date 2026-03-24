import { Page } from "puppeteer";

/**
 * Smart readiness detection: waits for the page to be truly ready
 * by checking multiple signals simultaneously.
 *
 * Signals:
 * 1. No pending network requests for stabilityMs
 * 2. No DOM mutations for stabilityMs
 * 3. All fonts loaded
 * 4. All images decoded
 * 5. No pending animations
 *
 * Uses two-phase stability: if quiet is interrupted by new activity,
 * the timer resets. Only resolves after sustained quiet.
 *
 * @param page - Puppeteer page
 * @param timeout - Max wait time in ms (default 10000)
 * @param stabilityMs - How long signals must be stable (default 500)
 */
export async function waitForPageReady(
  page: Page,
  timeout: number = 10_000,
  stabilityMs: number = 500,
): Promise<void> {
  // Phase 1: Track in-flight network requests from outside page.evaluate
  // (page.evaluate can't see Puppeteer's request events)
  let pendingRequests = 0;
  let lastNetworkActivity = Date.now();

  const onRequest = () => {
    pendingRequests++;
    lastNetworkActivity = Date.now();
  };
  const onRequestDone = () => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    lastNetworkActivity = Date.now();
  };

  page.on("request", onRequest);
  page.on("requestfinished", onRequestDone);
  page.on("requestfailed", onRequestDone);

  try {
    const deadline = Date.now() + timeout;

    // Poll until all signals are stable
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));

      const now = Date.now();

      // Network must be idle (no pending requests + no activity for stabilityMs)
      const networkIdle =
        pendingRequests === 0 && now - lastNetworkActivity > stabilityMs;

      if (!networkIdle) continue;

      // Check browser-side signals (DOM, fonts, images, animations)
      // Use string-based script to avoid __name decorator issues in tsx dev mode
      const browserReady = await page.evaluate(`(function(stabMs) {
        var lastMutation = window.__pageyoink_lastMutation || 0;
        var domStable = Date.now() - lastMutation > stabMs;

        var fontsReady = document.fonts.status === "loaded";

        var images = Array.from(document.querySelectorAll("img"));
        var imagesReady = images.every(function(img) {
          return img.complete || img.naturalHeight > 0 || !img.src || img.src.startsWith("data:");
        });

        var animations = document.getAnimations();
        var animationsSettled =
          animations.length === 0 ||
          animations.every(function(a) {
            return a.playState === "finished" || a.playState === "idle";
          });

        return domStable && fontsReady && imagesReady && animationsSettled;
      })(${stabilityMs})`);

      if (browserReady) {
        return; // All signals stable — page is ready
      }
    }

    // Timeout reached — return with whatever we have
  } finally {
    page.off("request", onRequest);
    page.off("requestfinished", onRequestDone);
    page.off("requestfailed", onRequestDone);
  }
}

/**
 * Install the DOM mutation observer on the page.
 * Call this AFTER page.goto() but BEFORE waitForPageReady().
 * The observer writes the last mutation timestamp to a window property
 * that waitForPageReady reads.
 */
export async function installMutationTracker(page: Page): Promise<void> {
  // Use string-based script to avoid __name decorator issues in tsx dev mode
  await page.evaluate(`(function() {
    window.__pageyoink_lastMutation = Date.now();

    var observer = new MutationObserver(function() {
      window.__pageyoink_lastMutation = Date.now();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }
  })()`);
}
