import { Page } from "puppeteer";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export interface ExtractResult {
  /** Extracted content in the requested format */
  content: string;
  /** Format of the content */
  format: "markdown" | "text" | "html";
  /** Page title */
  title: string;
  /** Word count of extracted content */
  wordCount: number;
  /** URL of the page */
  url: string;
  /** Short excerpt (first ~200 chars) */
  excerpt: string;
  /** Author if detected */
  author: string | null;
}

/**
 * Extract clean content from a loaded Puppeteer page.
 *
 * Uses Mozilla Readability to identify the main content (stripping nav,
 * ads, sidebars) and Turndown to convert to Markdown.
 *
 * Falls back to full body text if Readability can't identify an article.
 */
export async function extractContent(
  page: Page,
  format: "markdown" | "text" | "html" = "markdown",
): Promise<ExtractResult> {
  // Get the page HTML and URL from the browser
  const { html, url, title: pageTitle } = await page.evaluate(() => ({
    html: document.documentElement.outerHTML,
    url: document.location.href,
    title: document.title,
  }));

  // Parse with JSDOM for Readability
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  let contentHtml: string;
  let title: string;
  let author: string | null = null;
  let excerpt = "";

  if (article && article.content) {
    // Readability found an article
    contentHtml = article.content;
    title = article.title || pageTitle;
    author = article.byline || null;
    excerpt = article.excerpt || "";
  } else {
    // Fallback: extract body content directly
    contentHtml = await page.evaluate(() => {
      // Remove script, style, nav, footer, header elements for cleaner output
      const clone = document.body.cloneNode(true) as HTMLElement;
      const removeSelectors = "script, style, nav, footer, header, [role='navigation'], [role='banner'], [aria-hidden='true']";
      clone.querySelectorAll(removeSelectors).forEach((el) => el.remove());
      return clone.innerHTML;
    });
    title = pageTitle;
  }

  let content: string;

  if (format === "html") {
    content = contentHtml;
  } else if (format === "text") {
    // Strip HTML tags for plain text
    const textDom = new JSDOM(contentHtml);
    content = (textDom.window.document.body.textContent || "").trim();
    // Normalize whitespace
    content = content.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ");
  } else {
    // Markdown conversion
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    // Preserve tables
    turndown.addRule("table", {
      filter: ["table"],
      replacement: (_content, node) => {
        const table = node as HTMLTableElement;
        const rows = Array.from(table.rows);
        if (rows.length === 0) return "";

        const lines: string[] = [];
        for (let i = 0; i < rows.length; i++) {
          const cells = Array.from(rows[i].cells).map(
            (cell) => cell.textContent?.trim() || "",
          );
          lines.push("| " + cells.join(" | ") + " |");
          if (i === 0) {
            // Add header separator
            lines.push("| " + cells.map(() => "---").join(" | ") + " |");
          }
        }
        return "\n\n" + lines.join("\n") + "\n\n";
      },
    });

    content = turndown.turndown(contentHtml);
    // Clean up excessive blank lines
    content = content.replace(/\n{3,}/g, "\n\n").trim();
  }

  // Word count
  const textForCount = format === "text"
    ? content
    : new JSDOM(contentHtml).window.document.body.textContent || "";
  const wordCount = textForCount
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Generate excerpt if not from Readability
  if (!excerpt) {
    const plainText = format === "text"
      ? content
      : new JSDOM(contentHtml).window.document.body.textContent || "";
    excerpt = plainText.trim().substring(0, 200).replace(/\s+/g, " ");
    if (plainText.length > 200) excerpt += "...";
  }

  return {
    content,
    format,
    title,
    wordCount,
    url,
    excerpt,
    author,
  };
}
