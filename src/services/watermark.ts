import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

/**
 * Add a text watermark to every page of a PDF.
 */
export async function addWatermark(
  pdfBuffer: Buffer,
  options: WatermarkOptions,
): Promise<Buffer> {
  const {
    text,
    fontSize = 48,
    color = "#888888",
    opacity = 0.3,
    rotation = -45,
    position = "center",
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { r, g, b } = parseHexColor(color);
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = fontSize;

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();

    let x: number;
    let y: number;

    switch (position) {
      case "top-left":
        x = 40;
        y = height - 40 - textHeight;
        break;
      case "top-right":
        x = width - textWidth - 40;
        y = height - 40 - textHeight;
        break;
      case "bottom-left":
        x = 40;
        y = 40;
        break;
      case "bottom-right":
        x = width - textWidth - 40;
        y = 40;
        break;
      case "center":
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  const result = await pdfDoc.save();
  return Buffer.from(result);
}
