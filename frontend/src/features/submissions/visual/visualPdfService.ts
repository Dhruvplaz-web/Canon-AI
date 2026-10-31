import * as pdfjsLib from "pdfjs-dist";

// Set worker source safely for Next.js browser environment
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfRasterizeResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts Page 1 of any uploaded PDF ad creative into a high-DPI image
 * suitable for visual canvas rendering and OCR layout extraction.
 */
export async function convertPdfFirstPageToImage(file: File | Blob): Promise<PdfRasterizeResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // High-DPI scale (2.0) ensures microscopic fine print remains sharply legible for OCR
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for PDF rasterization.");
  }

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: viewport.width,
    height: viewport.height,
  };
}
