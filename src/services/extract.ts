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
  /** Warning message if content extraction was degraded */
  warning?: string;
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
  // Use string-based script to avoid __name decorator issues in tsx dev mode
  const { html, url, title: pageTitle } = await page.evaluate(`(function() {
    return {
      html: document.documentElement.outerHTML,
      url: document.location.href,
      title: document.title
    };
  })()`) as { html: string; url: string; title: string };

  // Parse with JSDOM for Readability
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  let contentHtml: string;
  let title: string;
  let author: string | null = null;
  let excerpt = "";
  let warning: string | undefined;

  if (article && article.content && article.content.trim().length > 0) {
    // Readability found an article
    contentHtml = article.content;
    title = article.title || pageTitle;
    author = article.byline || null;
    excerpt = article.excerpt || "";
  } else {
    // Fallback: extract body content directly (Readability couldn't identify article)
    contentHtml = await page.evaluate(`(function() {
      var clone = document.body.cloneNode(true);
      var removeSelectors = "script, style, nav, footer, header, [role='navigation'], [role='banner'], [aria-hidden='true']";
      clone.querySelectorAll(removeSelectors).forEach(function(el) { el.remove(); });
      return clone.innerHTML;
    })()`) as string;
    title = pageTitle;
    warning = "No article content detected. Returning full page body text as fallback.";
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

  const result: ExtractResult = {
    content,
    format,
    title,
    wordCount,
    url,
    excerpt,
    author,
  };
  if (warning) result.warning = warning;
  return result;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

/**
 * Extract all HTML tables from a loaded page as structured JSON.
 */
export async function extractTables(page: Page): Promise<TableData[]> {
  return await page.evaluate(`(function() {
    var tables = document.querySelectorAll("table");
    var result = [];
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var caption = table.querySelector("caption");
      var headerRow = table.querySelector("thead tr") || table.querySelector("tr");
      var headers = [];
      if (headerRow) {
        var ths = headerRow.querySelectorAll("th");
        if (ths.length > 0) {
          for (var h = 0; h < ths.length; h++) {
            headers.push((ths[h].textContent || "").trim());
          }
        } else {
          var tds = headerRow.querySelectorAll("td");
          for (var h2 = 0; h2 < tds.length; h2++) {
            headers.push((tds[h2].textContent || "").trim());
          }
        }
      }

      var bodyRows = table.querySelectorAll("tbody tr");
      if (bodyRows.length === 0) {
        bodyRows = table.querySelectorAll("tr");
      }
      var rows = [];
      var startIdx = (headerRow && bodyRows[0] === headerRow) ? 1 : 0;
      for (var r = startIdx; r < bodyRows.length; r++) {
        var cells = bodyRows[r].querySelectorAll("td, th");
        var row = [];
        for (var c = 0; c < cells.length; c++) {
          row.push((cells[c].textContent || "").trim());
        }
        if (row.length > 0) rows.push(row);
      }

      if (headers.length > 0 || rows.length > 0) {
        var entry = { headers: headers, rows: rows };
        if (caption) entry.caption = (caption.textContent || "").trim();
        result.push(entry);
      }
    }
    return result;
  })()`) as TableData[];
}
