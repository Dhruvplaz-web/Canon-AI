import { NextRequest, NextResponse } from "next/server";
import { auditVisualCreative } from "@/features/submissions/visual/visualAuditEngine";
import { VISUAL_BENCHMARK_ASSETS } from "@/features/submissions/visual/visualFixtures";
import { VisualCreativeAsset } from "@/features/submissions/visual/visualTypes";
import { enrichCreativeWithGoogleVision } from "@/features/submissions/visual/googleVisionService";
import { mergeDualOcrResults } from "@/features/submissions/visual/visualMerger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId") || VISUAL_BENCHMARK_ASSETS[0].id;

  const asset = VISUAL_BENCHMARK_ASSETS.find((a) => a.id === assetId) || VISUAL_BENCHMARK_ASSETS[0];
  const auditReport = auditVisualCreative(asset);

  return NextResponse.json({
    success: true,
    data: auditReport,
    statutoryFrameworksApplied: [
      "ASCI Guidelines for Disclaimers (2023) - Clause 1.4",
      "Consumer Protection Act 2019 (CCPA) - Section 4(2) Misleading Advertisements",
      "ISO/IEC 40500:2012 / WCAG 2.1 AA - Criterion 1.4.3",
      "RBI Digital Lending Guidelines (2022) - Section 3.1",
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Support both wrapped payload { asset, imageBase64 } and direct VisualCreativeAsset
    const asset: VisualCreativeAsset = rawBody.asset || rawBody;
    const imagePayload: string = rawBody.imageBase64 || asset.imageUrl || "";

    if (!asset || !asset.regions || !Array.isArray(asset.regions)) {
      return NextResponse.json(
        { error: "Invalid visual payload: 'regions' array required." },
        { status: 400 }
      );
    }

    let finalRegions = [...asset.regions];
    let tier2Status: "ENRICHED" | "FALLBACK_OFFLINE" = "FALLBACK_OFFLINE";
    let tier2Provider = "CLIENT_SIDE_HEURISTIC";

    // Tier 2 Cloud Vision Pass if image is present
    if (imagePayload && imagePayload.length > 100) {
      const enrichment = await enrichCreativeWithGoogleVision(imagePayload, asset.dimensions);
      tier2Status = enrichment.status;
      tier2Provider = enrichment.provider;

      if (enrichment.isAvailable && enrichment.detectedLogos.length > 0) {
        finalRegions = mergeDualOcrResults(asset.regions, enrichment);
      }
    }

    const mergedAsset: VisualCreativeAsset = {
      ...asset,
      regions: finalRegions,
      tier2EnrichmentStatus: tier2Status,
    };

    const auditReport = auditVisualCreative(mergedAsset);

    return NextResponse.json({
      success: true,
      data: {
        ...auditReport,
        tier2EnrichmentStatus: tier2Status,
      },
      tier2Metadata: {
        provider: tier2Provider,
        status: tier2Status,
        activeRegulatedEntityWhitelist: 11,
      },
    });
  } catch (error: unknown) {
    console.error("[VisualCheck API] Evaluation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to evaluate visual geometry payload.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
