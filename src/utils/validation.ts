/**
 * Input validation utilities for request parameters.
 * Prevents resource exhaustion and invalid input attacks.
 */

export const MAX_VIEWPORT_WIDTH = 7680;   // 8K
export const MAX_VIEWPORT_HEIGHT = 7680;
export const MAX_CSS_SIZE = 100_000;       // 100KB
export const MAX_JS_SIZE = 100_000;        // 100KB
export const MAX_SCREENSHOT_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PDF_SIZE = 100 * 1024 * 1024;       // 100MB

/**
 * Validate viewport dimensions. Returns error string or null if valid.
 */
export function validateViewport(width?: number, height?: number): string | null {
  if (width !== undefined) {
    if (width < 1 || width > MAX_VIEWPORT_WIDTH) {
      return `Width must be between 1 and ${MAX_VIEWPORT_WIDTH}`;
    }
  }
  if (height !== undefined) {
    if (height < 1 || height > MAX_VIEWPORT_HEIGHT) {
      return `Height must be between 1 and ${MAX_VIEWPORT_HEIGHT}`;
    }
  }
  return null;
}

/**
 * Validate CSS input size.
 */
export function validateCssSize(css: string | undefined): string | null {
  if (css && css.length > MAX_CSS_SIZE) {
    return `CSS input exceeds maximum size of ${MAX_CSS_SIZE} characters`;
  }
  return null;
}

/**
 * Validate JS input size.
 */
export function validateJsSize(js: string | undefined): string | null {
  if (js && js.length > MAX_JS_SIZE) {
    return `JavaScript input exceeds maximum size of ${MAX_JS_SIZE} characters`;
  }
  return null;
}

/**
 * Validate geolocation values.
 */
export function validateGeolocation(
  lat: number,
  lng: number,
  accuracy?: number,
): string | null {
  if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
  if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180";
  if (accuracy !== undefined && accuracy < 0) return "Accuracy must be non-negative";
  return null;
}
