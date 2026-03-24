import { Page } from "puppeteer";

export interface PageMetadata {
  /** Page title from <title> tag */
  title: string;
  /** Meta description */
  description: string | null;
  /** Canonical URL */
  canonicalUrl: string | null;
  /** HTML lang attribute */
  language: string | null;
  /** Favicon URL */
  favicon: string | null;
  /** Open Graph metadata */
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
    siteName: string | null;
  };
  /** Twitter Card metadata */
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    site: string | null;
  };
  /** Page statistics */
  stats: {
    wordCount: number;
    linkCount: number;
    internalLinks: number;
    externalLinks: number;
    imageCount: number;
    scriptCount: number;
    styleSheetCount: number;
  };
  /** JSON-LD structured data (if present) */
  jsonLd: unknown[] | null;
  /** The URL as loaded (after redirects) */
  loadedUrl: string;
}

/**
 * Extract comprehensive metadata from a loaded Puppeteer page.
 * This runs entirely in the browser context for efficiency.
 */
export async function extractMetadata(page: Page): Promise<PageMetadata> {
  return page.evaluate(() => {
    const getMeta = (name: string): string | null => {
      const el =
        document.querySelector(`meta[property="${name}"]`) ||
        document.querySelector(`meta[name="${name}"]`);
      return el?.getAttribute("content") || null;
    };

    const getLink = (rel: string): string | null => {
      const el = document.querySelector(`link[rel="${rel}"]`);
      return el?.getAttribute("href") || null;
    };

    // Count links
    const links = Array.from(document.querySelectorAll("a[href]"));
    const currentHost = window.location.hostname;
    let internalLinks = 0;
    let externalLinks = 0;
    for (const link of links) {
      try {
        const href = (link as HTMLAnchorElement).href;
        if (!href || href.startsWith("javascript:") || href.startsWith("#")) continue;
        const url = new URL(href, window.location.origin);
        if (url.hostname === currentHost) internalLinks++;
        else externalLinks++;
      } catch {
        // Skip malformed URLs
      }
    }

    // Word count from body text
    const bodyText = document.body?.innerText || "";
    const wordCount = bodyText.trim().split(/\s+/).filter((w) => w.length > 0).length;

    // JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const jsonLd: unknown[] = [];
    jsonLdScripts.forEach((script) => {
      try {
        jsonLd.push(JSON.parse(script.textContent || ""));
      } catch {
        // Skip malformed JSON-LD
      }
    });

    // Favicon: try multiple sources
    const favicon =
      getLink("icon") ||
      getLink("shortcut icon") ||
      getLink("apple-touch-icon") ||
      "/favicon.ico";

    return {
      title: document.title || "",
      description: getMeta("description"),
      canonicalUrl: getLink("canonical"),
      language: document.documentElement.lang || null,
      favicon: favicon ? new URL(favicon, window.location.origin).href : null,
      og: {
        title: getMeta("og:title"),
        description: getMeta("og:description"),
        image: getMeta("og:image"),
        type: getMeta("og:type"),
        url: getMeta("og:url"),
        siteName: getMeta("og:site_name"),
      },
      twitter: {
        card: getMeta("twitter:card"),
        title: getMeta("twitter:title"),
        description: getMeta("twitter:description"),
        image: getMeta("twitter:image"),
        site: getMeta("twitter:site"),
      },
      stats: {
        wordCount,
        linkCount: internalLinks + externalLinks,
        internalLinks,
        externalLinks,
        imageCount: document.querySelectorAll("img").length,
        scriptCount: document.querySelectorAll("script").length,
        styleSheetCount: document.querySelectorAll("link[rel='stylesheet']").length,
      },
      jsonLd: jsonLd.length > 0 ? jsonLd : null,
      loadedUrl: window.location.href,
    };
  });
}
