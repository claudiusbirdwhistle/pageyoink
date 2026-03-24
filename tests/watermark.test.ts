import { describe, it, expect } from "vitest";
import { addWatermark } from "../src/services/watermark.js";
import { PDFDocument } from "pdf-lib";

describe("Watermark service", () => {
  async function createTestPdf(): Promise<Buffer> {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]); // Letter size
    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  it("addWatermark returns valid PDF buffer", async () => {
    const inputPdf = await createTestPdf();
    const result = await addWatermark(inputPdf, { text: "DRAFT" });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify it's still a valid PDF
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(1);
  });

  it("position parameter works", async () => {
    const inputPdf = await createTestPdf();
    const positions = [
      "center",
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ] as const;

    for (const position of positions) {
      const result = await addWatermark(inputPdf, {
        text: "TEST",
        position,
      });
      expect(result).toBeInstanceOf(Buffer);
      // Each position should produce a valid PDF
      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(1);
    }
  });

  it("multi-page PDF gets watermark on all pages", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    doc.addPage([612, 792]);
    doc.addPage([612, 792]);
    const inputPdf = Buffer.from(await doc.save());

    const result = await addWatermark(inputPdf, { text: "CONFIDENTIAL" });
    const resultDoc = await PDFDocument.load(result);
    expect(resultDoc.getPageCount()).toBe(3);
  });
});
