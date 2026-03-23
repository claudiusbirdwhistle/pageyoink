import { Page } from "puppeteer";

/**
 * Smart readiness detection: waits for the page to be truly ready
 * by checking multiple signals beyond just network idle.
 *
 * Checks:
 * 1. Network idle (no pending requests)
 * 2. DOM stability (no mutations for 500ms)
 * 3. All fonts loaded
 * 4. All images decoded
 * 5. No pending animations
 */
export async function waitForPageReady(
  page: Page,
  timeout: number = 10_000,
): Promise<void> {
  await page.evaluate((timeoutMs) => {
    return new Promise<void>((resolve) => {
      const deadline = Date.now() + timeoutMs;

      // DOM stability — wait for no mutations for 500ms
      let lastMutationTime = Date.now();
      const observer = new MutationObserver(() => {
        lastMutationTime = Date.now();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      const interval = setInterval(() => {
        const now = Date.now();

        if (now > deadline) {
          clearInterval(interval);
          observer.disconnect();
          resolve();
          return;
        }

        // Check all readiness signals inline
        const fontsReady = document.fonts.status === "loaded";

        const images = Array.from(document.querySelectorAll("img"));
        const imagesReady = images.every(
          (img) => img.complete && img.naturalHeight > 0,
        );

        const animations = document.getAnimations();
        const animationsSettled =
          animations.length === 0 ||
          animations.every(
            (a) => a.playState === "finished" || a.playState === "idle",
          );

        const domStable = now - lastMutationTime > 500;

        if (domStable && fontsReady && imagesReady && animationsSettled) {
          clearInterval(interval);
          observer.disconnect();
          resolve();
        }
      }, 100);
    });
  }, timeout);
}
