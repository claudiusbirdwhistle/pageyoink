import { Page } from "puppeteer";

const DEFAULT_MAX_SCROLL_SCREENS = 10;
const MAX_SCROLL_TIME_MS = 15_000;

/**
 * Scroll through the page to trigger lazy-loaded images,
 * then scroll back to top. Caps scrolling to avoid infinite
 * scroll traps (Reddit, Twitter, etc.).
 *
 * @param maxScrollScreens - Max viewport heights to scroll (default 10)
 */
export async function triggerLazyImages(
  page: Page,
  maxScrollScreens: number = DEFAULT_MAX_SCROLL_SCREENS,
): Promise<void> {
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

          // Stop conditions:
          // 1. Reached max scroll depth
          // 2. Scrolled past the page content (non-infinite)
          // 3. Scroll height hasn't changed for 3 checks (content done loading)
          // 4. Time limit exceeded
          const atMaxDepth = currentPosition >= maxScrollPx;
          const pastContent = currentPosition >= scrollHeight;
          const timedOut = elapsed >= maxTimeMs;

          if (scrollHeight === lastScrollHeight) {
            stableCount++;
          } else {
            stableCount = 0;
            lastScrollHeight = scrollHeight;
          }
          const contentStable = stableCount >= 3 && currentPosition >= scrollHeight;

          if (atMaxDepth || pastContent || contentStable || timedOut) {
            window.scrollTo(0, 0);
            clearInterval(interval);
            setTimeout(resolve, 1500);
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
}
