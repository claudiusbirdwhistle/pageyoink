import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface DiffResult {
  /** Number of pixels that differ */
  diffPixels: number;
  /** Total pixels compared */
  totalPixels: number;
  /** Percentage of pixels that differ (0-100) */
  diffPercentage: number;
  /** Whether the images are considered identical (below threshold) */
  identical: boolean;
  /** PNG buffer of the diff image (red = different pixels) */
  diffImage: Buffer;
  /** Width of compared images */
  width: number;
  /** Height of compared images */
  height: number;
}

/**
 * Compare two PNG images and return a visual diff.
 *
 * @param image1 - First PNG image buffer
 * @param image2 - Second PNG image buffer
 * @param threshold - Color difference threshold 0-1 (default 0.1)
 */
export function compareImages(
  image1: Buffer,
  image2: Buffer,
  threshold: number = 0.1,
): DiffResult {
  const png1 = PNG.sync.read(image1);
  const png2 = PNG.sync.read(image2);

  // Use the larger dimensions
  const width = Math.max(png1.width, png2.width);
  const height = Math.max(png1.height, png2.height);

  // Pad smaller image with transparent pixels if sizes differ
  const data1 = padImage(png1, width, height);
  const data2 = padImage(png2, width, height);

  const diffPng = new PNG({ width, height });

  const diffPixels = pixelmatch(data1, data2, diffPng.data, width, height, {
    threshold,
    includeAA: false,
  });

  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  return {
    diffPixels,
    totalPixels,
    diffPercentage: Math.round(diffPercentage * 100) / 100,
    identical: diffPixels === 0,
    diffImage: PNG.sync.write(diffPng),
    width,
    height,
  };
}

function padImage(png: PNG, targetWidth: number, targetHeight: number): Buffer {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png.data as unknown as Buffer;
  }

  const padded = Buffer.alloc(targetWidth * targetHeight * 4, 0);
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const srcIdx = (y * png.width + x) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      padded[dstIdx] = png.data[srcIdx];
      padded[dstIdx + 1] = png.data[srcIdx + 1];
      padded[dstIdx + 2] = png.data[srcIdx + 2];
      padded[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return padded;
}
