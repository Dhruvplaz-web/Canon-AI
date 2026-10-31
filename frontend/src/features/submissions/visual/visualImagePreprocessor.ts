/**
 * Visual Image Preprocessing Service
 * Optimizes creative assets for:
 * 1. High-recall OCR: Adaptive contrast stretching to detect faint grey fine print.
 * 2. Fast cloud dispatch: Downscaling large multi-megapixel banners to <350KB.
 */

/**
 * Preprocesses an image on an offscreen canvas to maximize OCR character recall.
 * Stretches contrast so faint grey fine print (#A1A1AA) becomes crisp dark text,
 * and pale background tint (#FEF3C7) becomes pure white.
 */
export function preprocessImageForOcr(imageElement: HTMLImageElement): string {
  if (typeof document === "undefined") return imageElement.src;

  const canvas = document.createElement("canvas");
  const width = imageElement.naturalWidth || imageElement.width || 1200;
  const height = imageElement.naturalHeight || imageElement.height || 628;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return imageElement.src;

  ctx.drawImage(imageElement, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return imageElement.src; // Fallback on cross-origin
  }

  const d = imageData.data;

  // 1. Convert to grayscale and find min/max luminance histogram
  let minLum = 255;
  let maxLum = 0;
  const luminances = new Uint8Array(d.length / 4);

  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    // Perceptual relative luminance: Y = 0.299R + 0.587G + 0.114B
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    luminances[j] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // 2. Linear Contrast Histogram Stretching: Stretch [minLum, maxLum] to [0, 255]
  const range = Math.max(1, maxLum - minLum);

  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    let normalized = ((luminances[j] - minLum) / range) * 255;

    // Slight gamma curve to darken faint fine print text while blowing out background highlights
    normalized = Math.pow(normalized / 255, 1.25) * 255;
    const finalVal = Math.min(255, Math.max(0, Math.round(normalized)));

    d[i] = finalVal;     // R
    d[i + 1] = finalVal; // G
    d[i + 2] = finalVal; // B
    // d[i + 3] remains alpha
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Compresses and downscales large banners (e.g. 4000x2000px camera photos or 300DPI PDFs)
 * to a lightweight payload (max 1600px width/height, ~200-350KB)
 * prior to dispatching to the Tier 2 Cloud Vision API.
 */
export function compressImageForCloudDispatch(
  imageElement: HTMLImageElement,
  maxDimension = 1600,
  quality = 0.85
): string {
  if (typeof document === "undefined") return imageElement.src;

  const naturalW = imageElement.naturalWidth || imageElement.width || 1200;
  const naturalH = imageElement.naturalHeight || imageElement.height || 628;

  let targetW = naturalW;
  let targetH = naturalH;

  if (naturalW > maxDimension || naturalH > maxDimension) {
    if (naturalW >= naturalH) {
      targetW = maxDimension;
      targetH = Math.round((naturalH / naturalW) * maxDimension);
    } else {
      targetH = maxDimension;
      targetW = Math.round((naturalW / naturalH) * maxDimension);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return imageElement.src;

  ctx.drawImage(imageElement, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", quality);
}

