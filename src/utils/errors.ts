/**
 * Detect if an error from page navigation is a client error (bad URL, DNS, etc.)
 * rather than a server error, and return an appropriate status code + message.
 */
export function classifyNavigationError(err: unknown): {
  statusCode: number;
  message: string;
} {
  const msg = err instanceof Error ? err.message : String(err);

  // DNS resolution failures — the URL doesn't exist
  if (msg.includes("ERR_NAME_NOT_RESOLVED")) {
    return {
      statusCode: 400,
      message: "Could not resolve hostname. Check that the URL is correct.",
    };
  }

  // Connection refused — nothing listening on that port
  if (msg.includes("ERR_CONNECTION_REFUSED")) {
    return {
      statusCode: 400,
      message: "Connection refused by the target server.",
    };
  }

  // Invalid URL that somehow passed validation
  if (msg.includes("ERR_INVALID_URL") || msg.includes("Invalid URL")) {
    return { statusCode: 400, message: "Invalid URL." };
  }

  // SSL/TLS errors
  if (
    msg.includes("ERR_CERT_") ||
    msg.includes("ERR_SSL_") ||
    msg.includes("ERR_BAD_SSL_CLIENT_AUTH_CERT")
  ) {
    return {
      statusCode: 400,
      message: "SSL/TLS error connecting to the target site.",
    };
  }

  // Too many redirects
  if (msg.includes("ERR_TOO_MANY_REDIRECTS")) {
    return {
      statusCode: 400,
      message: "Too many redirects while loading the URL.",
    };
  }

  // HTTP/2 protocol errors
  if (msg.includes("ERR_HTTP2_PROTOCOL_ERROR")) {
    return {
      statusCode: 502,
      message: "HTTP/2 protocol error from the target site. Retrying with HTTP/1.1.",
    };
  }

  // Navigation timeout — could be client or server, treat as 504
  if (msg.includes("Navigation timeout") || msg.includes("TimeoutError")) {
    return {
      statusCode: 504,
      message: "Page load timed out. The site may be slow or unresponsive.",
    };
  }

  // Default: server error
  return { statusCode: 500, message: msg || "An unexpected error occurred." };
}
