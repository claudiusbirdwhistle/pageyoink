import { Page } from "puppeteer";

const DEFAULT_MAX_SCROLL_SCREENS = 10;
const MAX_SCROLL_TIME_MS = 15_000;

/**
 * Scroll through the page to trigger lazy-loaded images,
 * then scroll back to top and wait for all images to finish loading.
 * Caps scrolling to avoid infinite scroll traps.
 *
 * @param maxScrollScreens - Max viewport heights to scroll (default 10)
 */
export async function triggerLazyImages(
  page: Page,
  maxScrollScreens: number = DEFAULT_MAX_SCROLL_SCREENS,
): Promise<void> {
  // Phase 1: Scroll through the page to trigger lazy loading
  await page.evaluate(
    async (maxScreens: number, maxTimeMs: number) => {
      await new Promise<void>((resolve) => {
        const viewportHeight = window.innerHeight;
        const maxScrollPx = viewportHeight * maxScreens;
        const scrollStep = viewportHeight * 0.8;
        const startTime = Date.now();

        let currentPosition = 0;
        let lastScrollHeight = document.body.scrollHeight;
        let stableCount = 0;

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const scrollHeight = document.body.scrollHeight;

          const atMaxDepth = currentPosition >= maxScrollPx;
          const pastContent = currentPosition >= scrollHeight;
          const timedOut = elapsed >= maxTimeMs;

          if (scrollHeight === lastScrollHeight) {
            stableCount++;
          } else {
            stableCount = 0;
            lastScrollHeight = scrollHeight;
          }
          const contentStable =
            stableCount >= 3 && currentPosition >= scrollHeight;

          if (atMaxDepth || pastContent || contentStable || timedOut) {
            // Scroll back to top
            window.scrollTo(0, 0);
            clearInterval(interval);
            resolve();
            return;
          }

          currentPosition += scrollStep;
          window.scrollTo(0, currentPosition);
        }, 200);
      });
    },
    maxScrollScreens,
    MAX_SCROLL_TIME_MS,
  );

  // Phase 2: Force-decode all images and wait for completion
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll("img"));
    const promises = images
      .filter((img) => img.src && !img.src.startsWith("data:") && !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            // If already complete by the time we attach listeners
            if (img.complete) resolve();
          }),
      );

    // Wait for all pending images, with a timeout
    await Promise.race([
      Promise.all(promises),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);
  });

  // Phase 3: Wait for browser to finish painting
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
