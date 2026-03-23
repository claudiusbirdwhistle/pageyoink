import { Page } from "puppeteer";

/**
 * Apply targeted fixes for Chrome's PDF renderer.
 *
 * Only touches elements that are specifically horizontal scroll containers
 * (carousels) where content is clipped. Does NOT apply blanket CSS rules
 * that could break page layout.
 */
export async function applyPrintFixes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Only target horizontal scroll containers:
      // - Has overflow-x hidden/scroll/auto
      // - Is wider than 300px (not a small UI element)
      // - Has children that extend beyond its bounds (content is clipped)
      const isHorizontalScroll =
        (style.overflowX === "hidden" ||
          style.overflowX === "scroll" ||
          style.overflowX === "auto") &&
        rect.width > 300;

      if (!isHorizontalScroll) continue;

      // Check if this element has content wider than its visible area
      const htmlEl = el as HTMLElement;
      const isClipping = htmlEl.scrollWidth > htmlEl.clientWidth + 10;

      if (isClipping) {
        // This is a carousel/horizontal scroll container with clipped content
        htmlEl.style.setProperty("overflow-x", "visible", "important");
        htmlEl.style.setProperty("overflow", "visible", "important");

        // If it's a flex container with nowrap, allow wrapping
        if (style.display === "flex" && style.flexWrap === "nowrap") {
          htmlEl.style.setProperty("flex-wrap", "wrap", "important");
        }
      }
    }
  });
}
