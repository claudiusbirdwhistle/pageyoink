/**
 * Normalize a URL by prepending https:// if no protocol is specified.
 * Returns the normalized URL string, or an error string prefixed with "error:".
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();

  // Auto-prepend https:// if no protocol
  if (url && !url.match(/^https?:\/\//i)) {
    url = "https://" + url;
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return url;
  } catch {
    return "";
  }
}

/**
 * Validate and normalize a URL. Returns { url } or { error }.
 */
export function validateUrl(input: string): { url: string } | { url?: never; error: string } {
  const url = normalizeUrl(input);
  if (!url) {
    return { error: "Invalid URL: must be a valid http or https URL" };
  }
  return { url };
}
