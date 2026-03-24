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

  // Phase 2: Scroll again slowly to let intersection observers fire
  // Some sites (NYTimes) use JS intersection observers that need elements
  // to be in the viewport briefly for content to render
  await page.evaluate(async (maxTimeMs: number) => {
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;
    const step = viewportHeight * 0.5;
    const startTime = Date.now();

    for (let y = 0; y < scrollHeight; y += step) {
      if (Date.now() - startTime > maxTimeMs) break;
      window.scrollTo(0, y);
      // Longer pause to let intersection observers fire and render
      await new Promise<void>((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  }, Math.min(MAX_SCROLL_TIME_MS, 10_000));

  // Phase 3: Force all lazy images to load eagerly
  await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll("img"));
    for (const img of images) {
      if (img.loading === "lazy") {
        img.loading = "eager";
      }
      // Force unloaded images to re-request
      if (img.src && !img.src.startsWith("data:") && img.naturalWidth === 0) {
        const src = img.src;
        img.src = "";
        img.src = src;
      }
    }
    // Also handle <picture> <source> elements — force srcset evaluation
    const pictures = document.querySelectorAll("picture");
    pictures.forEach((pic) => {
      const img = pic.querySelector("img");
      if (img && img.naturalWidth === 0 && img.src) {
        // Remove sources temporarily to force img src fallback
        const sources = pic.querySelectorAll("source");
        sources.forEach((s) => s.remove());
        const src = img.src;
        img.src = "";
        img.src = src;
      }
    });
  });

  // Phase 4: Wait for all images to finish loading
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll("img"));
    const promises = images
      .filter((img) => img.src && !img.src.startsWith("data:") && !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            if (img.complete) resolve();
          }),
      );

    await Promise.race([
      Promise.all(promises),
      new Promise<void>((resolve) => setTimeout(resolve, 10000)),
    ]);
  });

  // Phase 5: Wait for browser to finish painting
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
