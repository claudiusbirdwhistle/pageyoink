import { Page } from "puppeteer";

/**
 * Scroll through the entire page to trigger lazy-loaded images,
 * then scroll back to top. This forces intersection observers
 * and lazy loading attributes to fire.
 */
export async function triggerLazyImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const scrollHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      let currentPosition = 0;
      const scrollStep = viewportHeight * 0.8;

      const interval = setInterval(() => {
        currentPosition += scrollStep;

        if (currentPosition >= scrollHeight) {
          // Scroll back to top
          window.scrollTo(0, 0);
          clearInterval(interval);

          // Wait for images to finish loading after scroll
          setTimeout(resolve, 1500);
          return;
        }

        window.scrollTo(0, currentPosition);
      }, 200);
    });
  });
}
