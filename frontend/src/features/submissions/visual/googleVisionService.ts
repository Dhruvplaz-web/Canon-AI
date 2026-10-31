import { NormalizedCoordinates, LogoDetectionMetadata, VisualBoundingBox } from "./visualTypes";

export interface GoogleVisionLogoResult {
  brandName: string;
  confidenceScore: number;
  coordinates: NormalizedCoordinates;
  metadata: LogoDetectionMetadata;
}

export interface GoogleVisionTextResult {
  text: string;
  coordinates: NormalizedCoordinates;
}

export interface Tier2EnrichmentResult {
  isAvailable: boolean;
  status: "ENRICHED" | "FALLBACK_OFFLINE";
  detectedLogos: GoogleVisionLogoResult[];
  fullTextDetected?: string;
  provider: "GOOGLE_CLOUD_VISION_V1" | "CLIENT_SIDE_HEURISTIC";
  latencyMs: number;
}

// Whitelist of regulated Indian financial entities & regulators
const REGULATED_FINANCIAL_ENTITIES = [
  "reserve bank of india",
  "rbi",
  "sebi",
  "securities and exchange board of india",
  "kotak prime ltd",
  "kotak mahindra",
  "hdfc bank",
  "state bank of india",
  "sbi",
  "bajaj finance",
  "icici bank",
];

// Restricted / Surrogate brand registry for trademark alert
const RESTRICTED_SURROGATE_BRANDS = [
  "royal challenge",
  "vimal",
  "1xbet",
  "parimatch",
  "kamla pasand",
  "bagpiper",
  "imperial blue",
  "fairplay",
  "lotus365",
  "dafanews",
];

/**
 * Normalizes Google Vision's boundingPoly vertices into Canon's 0.0 to 1.0 coordinates
 */
function normalizeVertices(
  vertices: Array<{ x?: number; y?: number }>,
  width: number,
  height: number
): NormalizedCoordinates {
  if (!vertices || vertices.length === 0) {
    return { ymin: 0, xmin: 0, ymax: 0.1, xmax: 0.2 };
  }

  const xs = vertices.map((v) => v.x ?? 0);
  const ys = vertices.map((v) => v.y ?? 0);

  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(width, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(height, Math.max(...ys));

  return {
    ymin: Math.round((minY / height) * 1000) / 1000,
    xmin: Math.round((minX / width) * 1000) / 1000,
    ymax: Math.round((maxY / height) * 1000) / 1000,
    xmax: Math.round((maxX / width) * 1000) / 1000,
  };
}

/**
 * Calls Google Cloud Vision REST API to detect logos and deep vernacular text.
 * Gracefully returns fallback status if no key is configured or network is offline.
 */
export async function enrichCreativeWithGoogleVision(
  imageBase64OrDataUrl: string,
  dimensions: { width: number; height: number }
): Promise<Tier2EnrichmentResult> {
  const startTime = Date.now();
  const apiKey =
    process.env.GOOGLE_VISION_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY ||
    "";

  // Clean data URL prefix if present to obtain pure base64
  const cleanBase64 = imageBase64OrDataUrl.replace(/^data:image\/[a-z]+;base64,/, "");

  if (!apiKey || apiKey === "demo_key" || cleanBase64.length < 100) {
    return {
      isAvailable: false,
      status: "FALLBACK_OFFLINE",
      detectedLogos: [],
      provider: "CLIENT_SIDE_HEURISTIC",
      latencyMs: Date.now() - startTime,
    };
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: cleanBase64 },
              features: [
                { type: "LOGO_DETECTION", maxResults: 10 },
                { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[Tier-2 Vision] API returned HTTP ${response.status}. Using offline fallback.`);
      return {
        isAvailable: false,
        status: "FALLBACK_OFFLINE",
        detectedLogos: [],
        provider: "CLIENT_SIDE_HEURISTIC",
        latencyMs: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const result = data.responses?.[0] || {};
    const logoAnnotations = result.logoAnnotations || [];
    const fullTextAnnotation = result.fullTextAnnotation?.text || "";

    const detectedLogos: GoogleVisionLogoResult[] = logoAnnotations.map(
      (logo: { description: string; score: number; boundingPoly: { vertices: Array<{ x?: number; y?: number }> } }) => {
        const brandName = logo.description.trim();
        const lowerName = brandName.toLowerCase();
        const coords = normalizeVertices(logo.boundingPoly?.vertices || [], dimensions.width, dimensions.height);

        const isRegulated = REGULATED_FINANCIAL_ENTITIES.some((entity) => lowerName.includes(entity));
        const isSurrogate = RESTRICTED_SURROGATE_BRANDS.some((brand) => lowerName.includes(brand));

        const trademarkStatus = isRegulated
          ? "VERIFIED_REGULATED"
          : isSurrogate
          ? "UNREGISTERED_OR_SURROGATE"
          : "AUTHORIZED_COMMERCIAL";

        return {
          brandName,
          confidenceScore: Math.round((logo.score || 0.9) * 100) / 100,
          coordinates: coords,
          metadata: {
            brandName,
            confidenceScore: Math.round((logo.score || 0.9) * 100) / 100,
            isAuthorizedPartner: isRegulated,
            trademarkStatus,
          },
        };
      }
    );

    return {
      isAvailable: true,
      status: "ENRICHED",
      detectedLogos,
      fullTextDetected: fullTextAnnotation,
      provider: "GOOGLE_CLOUD_VISION_V1",
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    console.warn("[Tier-2 Vision] Request failed. Operating in offline fallback mode:", error);
    return {
      isAvailable: false,
      status: "FALLBACK_OFFLINE",
      detectedLogos: [],
      provider: "CLIENT_SIDE_HEURISTIC",
      latencyMs: Date.now() - startTime,
    };
  }
}

