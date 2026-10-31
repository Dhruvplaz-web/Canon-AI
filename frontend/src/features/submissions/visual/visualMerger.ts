import { VisualBoundingBox, NormalizedCoordinates, VisualViolation } from "./visualTypes";
import { Tier2EnrichmentResult, GoogleVisionLogoResult } from "./googleVisionService";

/**
 * Computes Intersection-over-Union (IoU) between two bounding boxes
 * in normalized (0.0 to 1.0) coordinate space.
 */
function computeIoU(a: NormalizedCoordinates, b: NormalizedCoordinates): number {
  const xLeft = Math.max(a.xmin, b.xmin);
  const yTop = Math.max(a.ymin, b.ymin);
  const xRight = Math.min(a.xmax, b.xmax);
  const yBottom = Math.min(a.ymax, b.ymax);

  if (xRight < xLeft || yBottom < yTop) {
    return 0.0;
  }

  const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
  const aArea = (a.xmax - a.xmin) * (a.ymax - a.ymin);
  const bArea = (b.xmax - b.xmin) * (b.ymax - b.ymin);
  const unionArea = aArea + bArea - intersectionArea;

  return unionArea <= 0 ? 0.0 : intersectionArea / unionArea;
}

/**
 * Merges Tier 1 geometric bounding boxes (from client-side Tesseract + Canvas Sampler)
 * with Tier 2 commercial logo and trademark identities (from Google Cloud Vision).
 *
 * Guarantees:
 * 1. Physical typographical font sizes (pt) and WCAG contrast from Tier 1 are preserved.
 * 2. Purely graphical emblems missed by OCR are added as distinct LOGO boxes.
 * 3. Trademark violations (surrogate alcobev/tobacco marks) are injected with statutory citations.
 */
export function mergeDualOcrResults(
  tier1Regions: VisualBoundingBox[],
  tier2Enrichment: Tier2EnrichmentResult
): VisualBoundingBox[] {
  if (!tier2Enrichment.isAvailable || tier2Enrichment.detectedLogos.length === 0) {
    return tier1Regions;
  }

  const mergedRegions: VisualBoundingBox[] = [...tier1Regions];
  const matchedLogoIndices = new Set<number>();

  // 1. Enrich matching Tier 1 regions
  for (let i = 0; i < mergedRegions.length; i++) {
    const region = mergedRegions[i];

    for (let j = 0; j < tier2Enrichment.detectedLogos.length; j++) {
      const logo = tier2Enrichment.detectedLogos[j];
      const iou = computeIoU(region.coordinates, logo.coordinates);

      // Match if overlapping (> 0.25 IoU) or if both are positioned in the header/logo area
      if (iou > 0.25 || (region.label === "LOGO" && iou > 0.1)) {
        matchedLogoIndices.add(j);

        const isRegulated = logo.metadata.trademarkStatus === "VERIFIED_REGULATED";
        const isSurrogate = logo.metadata.trademarkStatus === "UNREGISTERED_OR_SURROGATE";

        mergedRegions[i] = {
          ...region,
          label: isRegulated ? "PARTNER_BADGE" : "LOGO",
          textExtracted: `${logo.brandName} (${Math.round(logo.confidenceScore * 100)}% verified)`,
          logoMetadata: logo.metadata,
        };

        // If restricted surrogate trademark detected, flag it
        if (isSurrogate) {
          const violation: VisualViolation = {
            code: "ASCI-SURROGATE-TRADEMARK",
            severity: "CRITICAL",
            ruleTitle: "Prohibited Surrogate Trademark Coupling",
            statutoryCitation: "ASCI Brand Extension Guidelines Clause 3.2 & CCPA 2022 Guideline 9",
            detectedValue: `Restricted master brand mark: '${logo.brandName}'`,
            requiredThreshold: "No identical trademark coupling with restricted commodities",
            remediationAction: "Decouple restricted parent brand equity and logo from commodity extension.",
          };
          if (!mergedRegions[i].violations.some((v) => v.code === violation.code)) {
            mergedRegions[i].violations.push(violation);
          }
        }
        break;
      }
    }
  }

  // 2. Add purely graphical logos that had no readable text (and thus missed by Tier 1 OCR)
  tier2Enrichment.detectedLogos.forEach((logo: GoogleVisionLogoResult, idx: number) => {
    if (!matchedLogoIndices.has(idx)) {
      const isRegulated = logo.metadata.trademarkStatus === "VERIFIED_REGULATED";
      const isSurrogate = logo.metadata.trademarkStatus === "UNREGISTERED_OR_SURROGATE";

      const violations: VisualViolation[] = [];
      if (isSurrogate) {
        violations.push({
          code: "ASCI-SURROGATE-TRADEMARK",
          severity: "CRITICAL",
          ruleTitle: "Prohibited Surrogate Trademark Coupling",
          statutoryCitation: "ASCI Brand Extension Guidelines Clause 3.2 & CCPA 2022 Guideline 9",
          detectedValue: `Restricted master brand emblem: '${logo.brandName}'`,
          requiredThreshold: "No identical trademark coupling with restricted commodities",
          remediationAction: "Decouple restricted parent brand mark from advertisement.",
        });
      }

      const newLogoBox: VisualBoundingBox = {
        id: `logo-tier2-${idx + 1}`,
        label: isRegulated ? "PARTNER_BADGE" : "LOGO",
        textExtracted: `${logo.brandName} (Visual Emblem • ${Math.round(logo.confidenceScore * 100)}% Match)`,
        coordinates: logo.coordinates,
        metrics: {
          calculatedFontSizePt: 16.0,
          canvasHeightPercentage: 3.5,
          contrastRatio: 9.5,
          textColorHex: "#0F172A",
          backgroundColorHex: "#FFFFFF",
          rotationDegrees: 0,
        },
        violations,
        logoMetadata: logo.metadata,
      };

      mergedRegions.unshift(newLogoBox); // Prepend to top of inspection list
    }
  });

  return mergedRegions;
}

