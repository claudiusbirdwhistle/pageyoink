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
  deviceScaleFactor?: number;
  clean?: boolean;
  smartWait?: boolean;
  timeout?: number;
}

export interface PdfOptions {
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  clean?: boolean;
  smartWait?: boolean;
  timeout?: number;
}

export interface OgImageOptions {
  title: string;
  subtitle?: string;
  author?: string;
  domain?: string;
  theme?: "light" | "dark" | "gradient";
  brandColor?: string;
  fontSize?: "small" | "medium" | "large";
  format?: "png" | "jpeg";
  quality?: number;
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
    if (options.deviceScaleFactor)
      params.set("device_scale_factor", String(options.deviceScaleFactor));
    if (options.clean) params.set("clean", "true");
    if (options.smartWait) params.set("smart_wait", "true");
    if (options.timeout) params.set("timeout", String(options.timeout));

    const response = await this.fetch(`/v1/screenshot?${params}`);
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate a PDF from a URL.
   * Returns the PDF as a Buffer.
   */
  async pdfFromUrl(url: string, options: PdfOptions = {}): Promise<Buffer> {
    const params = new URLSearchParams({ url });
    if (options.format) params.set("format", options.format);
    if (options.landscape) params.set("landscape", "true");
    if (options.printBackground === false)
      params.set("print_background", "false");
    if (options.clean) params.set("clean", "true");
    if (options.smartWait) params.set("smart_wait", "true");
    if (options.timeout) params.set("timeout", String(options.timeout));

    const response = await this.fetch(`/v1/pdf?${params}`);
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate a PDF from HTML content.
   * Returns the PDF as a Buffer.
   */
  async pdfFromHtml(html: string, options: PdfOptions = {}): Promise<Buffer> {
    const response = await this.fetch("/v1/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, ...options }),
    });
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate an OG image from template options.
   * Returns the image as a Buffer.
   */
  async ogImage(options: OgImageOptions): Promise<Buffer> {
    const response = await this.fetch("/v1/og-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    return Buffer.from(await response.arrayBuffer());
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
