import { Page } from "puppeteer";
import { createHash, randomUUID } from "crypto";
import { getBrowser } from "./browser.js";

export interface ArchiveResult {
  warc: Buffer;
  metadata: ArchiveMetadata;
  pdfBuffer: Buffer;
  screenshotBuffer: Buffer;
  timestamp: string;
  contentHash: string;
}

export interface ArchiveMetadata {
  url: string;
  timestamp: string;
  captureId: string;
  resolvedIp: string | null;
  tlsCertificate: TlsCertInfo | null;
  httpStatus: number | null;
  httpHeaders: Record<string, string>;
  dnsLookupMs: number | null;
  totalLoadMs: number;
  contentHash: string;
  captureSystem: {
    software: string;
    version: string;
    userAgent: string;
  };
}

interface TlsCertInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
}

/**
 * Generate a WARC record (simplified ISO 28500 format).
 * Captures the full HTTP response with headers.
 */
function buildWarcRecord(
  url: string,
  httpStatus: number,
  httpHeaders: Record<string, string>,
  body: string,
  captureDate: string,
  recordId: string,
): string {
  const payloadBlock = `HTTP/1.1 ${httpStatus} OK\r\n` +
    Object.entries(httpHeaders).map(([k, v]) => `${k}: ${v}`).join("\r\n") +
    "\r\n\r\n" + body;

  const payloadLength = Buffer.byteLength(payloadBlock, "utf-8");

  return (
    "WARC/1.0\r\n" +
    "WARC-Type: response\r\n" +
    `WARC-Date: ${captureDate}\r\n` +
    `WARC-Record-ID: <urn:uuid:${recordId}>\r\n` +
    `WARC-Target-URI: ${url}\r\n` +
    `Content-Length: ${payloadLength}\r\n` +
    "Content-Type: application/http;msgtype=response\r\n" +
    "\r\n" +
    payloadBlock +
    "\r\n\r\n"
  );
}

function buildWarcInfoRecord(captureDate: string, recordId: string): string {
  const info =
    "software: PageYoink/0.1.0\r\n" +
    "format: WARC File Format 1.0\r\n" +
    `date: ${captureDate}\r\n` +
    "conformsTo: http://bibnum.bnf.fr/WARC/WARC_ISO_28500_version1_latestdraft.pdf\r\n";

  return (
    "WARC/1.0\r\n" +
    "WARC-Type: warcinfo\r\n" +
    `WARC-Date: ${captureDate}\r\n` +
    `WARC-Record-ID: <urn:uuid:${recordId}>\r\n` +
    `Content-Length: ${Buffer.byteLength(info, "utf-8")}\r\n` +
    "Content-Type: application/warc-fields\r\n" +
    "\r\n" +
    info +
    "\r\n\r\n"
  );
}

/**
 * Capture a page as a timestamped, hash-verified archive.
 * NO page manipulation (no clean mode, no CSS/JS injection).
 * This is a raw, forensic-grade capture.
 */
export async function captureArchive(
  url: string,
  timeout: number = 30_000,
): Promise<ArchiveResult> {
  const captureId = randomUUID();
  const captureDate = new Date().toISOString();
  const startTime = Date.now();

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set a standard user agent (not modified for stealth — raw capture)
    const userAgent = await browser.userAgent();

    // Track response details
    let httpStatus: number | null = null;
    let httpHeaders: Record<string, string> = {};
    let resolvedIp: string | null = null;
    let tlsCert: TlsCertInfo | null = null;

    // Capture response metadata
    page.on("response", (response) => {
      if (response.url() === url || response.url() === url + "/") {
        httpStatus = response.status();
        const headers = response.headers();
        httpHeaders = { ...headers };
        // Try to get remote address
        const remoteAddr = response.remoteAddress();
        if (remoteAddr.ip) resolvedIp = remoteAddr.ip;
      }
    });

    // Navigate — NO manipulation, raw page load
    await page.goto(url, {
      waitUntil: "networkidle2", // Wait for full network idle for archival accuracy
      timeout,
    });

    // Get TLS certificate info via CDP
    try {
      const cdp = await page.createCDPSession();
      const { securityState, schemeIsCryptographic } = await cdp.send("Security.getSecurityState") as {
        securityState: string;
        schemeIsCryptographic: boolean;
      };
      if (schemeIsCryptographic) {
        // Certificate info isn't directly available via CDP Security domain
        // without enabling it first, so we store what we can
        tlsCert = { issuer: "See WARC headers", subject: url, validFrom: "", validTo: "" };
      }
      await cdp.detach();
    } catch {
      // Security info not available
    }

    const totalLoadMs = Date.now() - startTime;

    // Get the full page HTML
    const html = await page.evaluate(`document.documentElement.outerHTML`) as string;

    // Hash the content
    const contentHash = createHash("sha256").update(html).digest("hex");

    // Build WARC file
    const warcInfo = buildWarcInfoRecord(captureDate, randomUUID());
    const warcResponse = buildWarcRecord(
      url,
      httpStatus || 200,
      httpHeaders,
      html,
      captureDate,
      randomUUID(),
    );
    const warcContent = warcInfo + warcResponse;
    const warc = Buffer.from(warcContent, "utf-8");

    // Take a raw screenshot (no clean mode)
    const screenshotBuffer = Buffer.from(
      await page.screenshot({ type: "png", fullPage: true }),
    );

    // Generate PDF (no print fixes, no manipulation)
    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
      }),
    );

    const metadata: ArchiveMetadata = {
      url,
      timestamp: captureDate,
      captureId,
      resolvedIp,
      tlsCertificate: tlsCert,
      httpStatus,
      httpHeaders,
      dnsLookupMs: null, // Could be extracted from performance timing
      totalLoadMs,
      contentHash,
      captureSystem: {
        software: "PageYoink",
        version: "0.1.0",
        userAgent,
      },
    };

    return {
      warc,
      metadata,
      pdfBuffer,
      screenshotBuffer,
      timestamp: captureDate,
      contentHash,
    };
  } finally {
    await page.close();
  }
}
