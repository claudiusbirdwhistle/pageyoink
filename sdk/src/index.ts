export interface PageYoinkConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ScreenshotOptions {
  url: string;
  format?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  width?: number;
  height?: number;
  viewports?: number;
  deviceScaleFactor?: number;
  clean?: boolean;
  smartWait?: boolean;
  blockAds?: boolean | "stealth";
  maxScroll?: number;
  css?: string;
  js?: string;
  userAgent?: string;
  selector?: string;
  transparent?: boolean;
  click?: string;
  clickCount?: number;
  fonts?: string[];
  ttl?: number;
  fresh?: boolean;
  timeout?: number;
}

export interface PdfUrlOptions {
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  clean?: boolean;
  smartWait?: boolean;
  blockAds?: boolean | "stealth";
  maxScroll?: number;
  css?: string;
  js?: string;
  userAgent?: string;
  scale?: number;
  maxPages?: number;
  ttl?: number;
  fresh?: boolean;
  timeout?: number;
}

export interface PdfHtmlOptions {
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  clean?: boolean;
  smartWait?: boolean;
  blockAds?: boolean | "stealth";
  maxScroll?: number;
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  userAgent?: string;
  proxy?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  pageRanges?: string;
  scale?: number;
  maxPages?: number;
  watermark?: {
    text: string;
    fontSize?: number;
    color?: string;
    opacity?: number;
    rotation?: number;
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  timezone?: string;
  timeout?: number;
}

export interface DiffOptions {
  url1: string;
  url2: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  clean?: boolean;
  blockAds?: boolean | "stealth";
  threshold?: number;
  format?: "json" | "image";
}

export interface DiffResult {
  diffPixels: number;
  totalPixels: number;
  diffPercentage: number;
  identical: boolean;
  width: number;
  height: number;
  diffImage: string; // base64
}

export interface BatchItem {
  url: string;
  type?: "screenshot" | "pdf";
  format?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  width?: number;
  height?: number;
  clean?: boolean;
  smartWait?: boolean;
  blockAds?: boolean | "stealth";
}

export interface BatchResult {
  jobId: string;
  status: "processing" | "complete" | "failed";
  total: number;
  completed: number;
  results?: Array<{
    url: string;
    type: string;
    status: "success" | "error";
    contentType?: string;
    data?: string;
    error?: string;
  }>;
}

export interface UsageData {
  apiKey: string;
  period: { days: number; from: string; to: string };
  totalRequests: number;
  byEndpoint: Array<{ endpoint: string; requests: number }>;
  daily: Array<{ date: string; endpoint: string; requests: number }>;
}

export class PageYoink {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: PageYoinkConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "https://api.pageyoink.dev").replace(
      /\/$/,
      "",
    );
  }

  /**
   * Take a screenshot of a URL.
   * Returns the image as a Buffer.
   */
  async screenshot(options: ScreenshotOptions): Promise<Buffer> {
    const params = new URLSearchParams({ url: options.url });
    if (options.format) params.set("format", options.format);
    if (options.quality) params.set("quality", String(options.quality));
    if (options.fullPage) params.set("full_page", "true");
    if (options.width) params.set("width", String(options.width));
    if (options.height) params.set("height", String(options.height));
    if (options.viewports) params.set("viewports", String(options.viewports));
    if (options.deviceScaleFactor)
      params.set("device_scale_factor", String(options.deviceScaleFactor));
    if (options.clean) params.set("clean", "true");
    if (options.smartWait) params.set("smart_wait", "true");
    if (options.blockAds)
      params.set("block_ads", options.blockAds === "stealth" ? "stealth" : "true");
    if (options.maxScroll) params.set("max_scroll", String(options.maxScroll));
    if (options.css) params.set("css", options.css);
    if (options.js) params.set("js", options.js);
    if (options.userAgent) params.set("user_agent", options.userAgent);
    if (options.selector) params.set("selector", options.selector);
    if (options.transparent) params.set("transparent", "true");
    if (options.click) params.set("click", options.click);
    if (options.clickCount) params.set("click_count", String(options.clickCount));
    if (options.ttl) params.set("ttl", String(options.ttl));
    if (options.fresh) params.set("fresh", "true");
    if (options.timeout) params.set("timeout", String(options.timeout));

    const response = await this.fetch(`/v1/screenshot?${params}`);
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate a PDF from a URL.
   * Returns the PDF as a Buffer.
   */
  async pdfFromUrl(url: string, options: PdfUrlOptions = {}): Promise<Buffer> {
    const params = new URLSearchParams({ url });
    if (options.format) params.set("format", options.format);
    if (options.landscape) params.set("landscape", "true");
    if (options.printBackground === false)
      params.set("print_background", "false");
    if (options.clean) params.set("clean", "true");
    if (options.smartWait) params.set("smart_wait", "true");
    if (options.blockAds)
      params.set("block_ads", options.blockAds === "stealth" ? "stealth" : "true");
    if (options.maxScroll) params.set("max_scroll", String(options.maxScroll));
    if (options.css) params.set("css", options.css);
    if (options.js) params.set("js", options.js);
    if (options.userAgent) params.set("user_agent", options.userAgent);
    if (options.scale) params.set("scale", String(options.scale));
    if (options.maxPages) params.set("max_pages", String(options.maxPages));
    if (options.ttl) params.set("ttl", String(options.ttl));
    if (options.fresh) params.set("fresh", "true");
    if (options.timeout) params.set("timeout", String(options.timeout));

    const response = await this.fetch(`/v1/pdf?${params}`);
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate a PDF from HTML content or a URL with full options.
   * Returns the PDF as a Buffer.
   */
  async pdfFromHtml(
    html: string,
    options: PdfHtmlOptions = {},
  ): Promise<Buffer> {
    const response = await this.fetch("/v1/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, ...options }),
    });
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Compare two URLs visually.
   * Returns diff stats and a diff image.
   */
  async diff(options: DiffOptions): Promise<DiffResult | Buffer> {
    const response = await this.fetch("/v1/diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (options.format === "image") {
      return Buffer.from(await response.arrayBuffer());
    }
    return response.json();
  }

  /**
   * Submit a batch of URLs for processing.
   * Returns a job ID for tracking.
   */
  async batch(
    items: BatchItem[],
    webhook?: string,
  ): Promise<{ jobId: string; statusUrl: string }> {
    const response = await this.fetch("/v1/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, webhook }),
    });
    return response.json();
  }

  /**
   * Check the status of a batch job.
   */
  async batchStatus(jobId: string): Promise<BatchResult> {
    const response = await this.fetch(`/v1/batch/${jobId}`);
    return response.json();
  }

  /**
   * Get usage statistics for the current API key.
   */
  async usage(days: number = 30): Promise<UsageData> {
    const response = await this.fetch(`/v1/usage?days=${days}`);
    return response.json();
  }

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const response = await globalThis.fetch(url, {
      ...init,
      headers: {
        "x-api-key": this.apiKey,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      let message: string;
      try {
        message = JSON.parse(body).error || body;
      } catch {
        message = body;
      }
      throw new PageYoinkError(message, response.status);
    }

    return response;
  }
}

export class PageYoinkError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PageYoinkError";
    this.statusCode = statusCode;
  }
}

export default PageYoink;
