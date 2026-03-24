import { resolve } from "dns/promises";
import { URL } from "url";
import { isIP } from "net";

/**
 * Private and reserved IP ranges that must never be accessed by user-provided URLs.
 * Prevents SSRF attacks against internal services, cloud metadata endpoints, etc.
 */
const BLOCKED_IPV4_RANGES: Array<{ prefix: number[]; mask: number }> = [
  { prefix: [0], mask: 8 },           // 0.0.0.0/8 — current network
  { prefix: [10], mask: 8 },          // 10.0.0.0/8 — private
  { prefix: [100, 64], mask: 10 },    // 100.64.0.0/10 — carrier-grade NAT
  { prefix: [127], mask: 8 },         // 127.0.0.0/8 — loopback
  { prefix: [169, 254], mask: 16 },   // 169.254.0.0/16 — link-local / cloud metadata
  { prefix: [172, 16], mask: 12 },    // 172.16.0.0/12 — private
  { prefix: [192, 0, 0], mask: 24 },  // 192.0.0.0/24 — IETF protocol assignments
  { prefix: [192, 0, 2], mask: 24 },  // 192.0.2.0/24 — TEST-NET-1
  { prefix: [192, 168], mask: 16 },   // 192.168.0.0/16 — private
  { prefix: [198, 18], mask: 15 },    // 198.18.0.0/15 — benchmarking
  { prefix: [198, 51, 100], mask: 24 }, // 198.51.100.0/24 — TEST-NET-2
  { prefix: [203, 0, 113], mask: 24 }, // 203.0.113.0/24 — TEST-NET-3
  { prefix: [224], mask: 4 },         // 224.0.0.0/4 — multicast
  { prefix: [240], mask: 4 },         // 240.0.0.0/4 — reserved
];

/**
 * Blocked hostnames that should never be accessed regardless of IP resolution.
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "kubernetes.default.svc",
  "kubernetes.default",
]);

function ipToOctets(ip: string): number[] {
  return ip.split(".").map(Number);
}

function ipToUint32(octets: number[]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function prefixToUint32(prefix: number[], mask: number): { base: number; maskBits: number } {
  const padded = [...prefix, 0, 0, 0, 0].slice(0, 4);
  const base = ipToUint32(padded);
  const maskBits = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;
  return { base, maskBits };
}

function isPrivateIPv4(ip: string): boolean {
  const octets = ipToOctets(ip);
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    return true; // Malformed = blocked
  }

  const ipNum = ipToUint32(octets);

  for (const range of BLOCKED_IPV4_RANGES) {
    const { base, maskBits } = prefixToUint32(range.prefix, range.mask);
    if ((ipNum & maskBits) === (base & maskBits)) {
      return true;
    }
  }

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Loopback ::1
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  // Link-local fe80::/10
  if (lower.startsWith("fe80:") || lower.startsWith("fe80")) return true;
  // Unique local fc00::/7
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // IPv4-mapped ::ffff:x.x.x.x
  const v4Match = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match) return isPrivateIPv4(v4Match[1]);
  return false;
}

/**
 * Check if an IP address is in a private/reserved range.
 */
export function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  if (isIP(ip) === 6) return isPrivateIPv6(ip);
  return true; // Unrecognized format = blocked
}

/**
 * Validate a URL for SSRF safety. Resolves DNS and checks that the
 * resolved IP is not in a private/reserved range.
 *
 * @returns null if safe, or an error message string if blocked
 */
export async function checkSsrf(urlString: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return "Invalid URL";
  }

  // Only allow http and https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "Only http and https URLs are allowed";
  }

  const hostname = parsed.hostname;

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return "Access to internal services is not allowed";
  }

  // Check if hostname is already an IP
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      return "Access to private/internal IP addresses is not allowed";
    }
    return null; // IP is public, OK
  }

  // Resolve DNS and check all resolved IPs
  try {
    const addresses = await resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        return "URL resolves to a private/internal IP address";
      }
    }
  } catch {
    // DNS resolution failed — could be a non-existent domain.
    // Let the browser handle this error naturally.
    return null;
  }

  return null; // Safe
}
