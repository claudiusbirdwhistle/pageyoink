import sharp from "sharp";

export interface Annotation {
  type: "arrow" | "box" | "blur" | "highlight" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** End point for arrows */
  toX?: number;
  toY?: number;
  /** Color as hex (default: #ff0000) */
  color?: string;
  /** Line/border thickness (default: 3) */
  thickness?: number;
  /** Text content for text annotations */
  text?: string;
  /** Font size for text (default: 24) */
  fontSize?: number;
  /** Blur radius for blur annotations (default: 10) */
  blurRadius?: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Apply annotations to a screenshot image.
 * Supports: box (rectangle outline), blur (region blur),
 * highlight (semi-transparent overlay), and text labels.
 *
 * Arrow annotations are rendered as a line with an arrowhead.
 */
export async function annotateScreenshot(
  imageBuffer: Buffer,
  annotations: Annotation[],
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width || 1280;
  const imgHeight = metadata.height || 720;

  // Build SVG overlay for vector annotations (boxes, arrows, text)
  const svgParts: string[] = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}">`,
  );

  // Collect blur regions to apply separately
  const blurRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  }> = [];

  for (const ann of annotations) {
    const color = ann.color || "#ff0000";
    const thickness = ann.thickness || 3;

    switch (ann.type) {
      case "box":
        svgParts.push(
          `<rect x="${ann.x}" y="${ann.y}" width="${ann.width || 100}" height="${ann.height || 100}" ` +
            `fill="none" stroke="${color}" stroke-width="${thickness}" rx="4"/>`,
        );
        break;

      case "highlight":
        svgParts.push(
          `<rect x="${ann.x}" y="${ann.y}" width="${ann.width || 100}" height="${ann.height || 100}" ` +
            `fill="${color}" fill-opacity="0.25" rx="4"/>`,
        );
        break;

      case "arrow": {
        const toX = ann.toX ?? ann.x + 100;
        const toY = ann.toY ?? ann.y;
        // Arrow line
        svgParts.push(
          `<line x1="${ann.x}" y1="${ann.y}" x2="${toX}" y2="${toY}" ` +
            `stroke="${color}" stroke-width="${thickness}" stroke-linecap="round"/>`,
        );
        // Arrowhead
        const angle = Math.atan2(toY - ann.y, toX - ann.x);
        const headLen = 15;
        const a1x = toX - headLen * Math.cos(angle - 0.4);
        const a1y = toY - headLen * Math.sin(angle - 0.4);
        const a2x = toX - headLen * Math.cos(angle + 0.4);
        const a2y = toY - headLen * Math.sin(angle + 0.4);
        svgParts.push(
          `<polygon points="${toX},${toY} ${a1x.toFixed(1)},${a1y.toFixed(1)} ${a2x.toFixed(1)},${a2y.toFixed(1)}" fill="${color}"/>`,
        );
        break;
      }

      case "text": {
        const fontSize = ann.fontSize || 24;
        const { r, g, b } = hexToRgb(color);
        // Text with background
        const textLen = (ann.text || "").length * fontSize * 0.6;
        svgParts.push(
          `<rect x="${ann.x - 4}" y="${ann.y - fontSize}" width="${textLen + 8}" height="${fontSize + 8}" ` +
            `fill="rgba(0,0,0,0.7)" rx="4"/>`,
        );
        svgParts.push(
          `<text x="${ann.x}" y="${ann.y}" font-family="sans-serif" font-size="${fontSize}" ` +
            `fill="rgb(${r},${g},${b})" font-weight="bold">${escapeXml(ann.text || "")}</text>`,
        );
        break;
      }

      case "blur":
        blurRegions.push({
          x: Math.max(0, ann.x),
          y: Math.max(0, ann.y),
          width: Math.min(ann.width || 100, imgWidth - ann.x),
          height: Math.min(ann.height || 100, imgHeight - ann.y),
          radius: ann.blurRadius || 10,
        });
        break;
    }
  }

  svgParts.push("</svg>");

  // Start with the original image
  let result = sharp(imageBuffer);

  // Apply blur regions first
  if (blurRegions.length > 0) {
    // For each blur region, extract, blur, and composite back
    let currentBuffer = await result.png().toBuffer();

    for (const region of blurRegions) {
      const blurred = await sharp(currentBuffer)
        .extract({
          left: region.x,
          top: region.y,
          width: region.width,
          height: region.height,
        })
        .blur(region.radius)
        .toBuffer();

      currentBuffer = await sharp(currentBuffer)
        .composite([
          {
            input: blurred,
            left: region.x,
            top: region.y,
          },
        ])
        .png()
        .toBuffer();
    }

    result = sharp(currentBuffer);
  }

  // Composite SVG overlay on top
  const svgBuffer = Buffer.from(svgParts.join("\n"));
  result = result.composite([{ input: svgBuffer, left: 0, top: 0 }]);

  return result.png().toBuffer();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
