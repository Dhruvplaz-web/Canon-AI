import { NextRequest, NextResponse } from "next/server";
import { auditVisualCreative } from "@/features/submissions/visual/visualAuditEngine";
import { VISUAL_BENCHMARK_ASSETS } from "@/features/submissions/visual/visualFixtures";
import { VisualCreativeAsset } from "@/features/submissions/visual/visualTypes";

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
    const body = (await request.json()) as VisualCreativeAsset;
    if (!body || !body.regions || !Array.isArray(body.regions)) {
      return NextResponse.json(
        { error: "Invalid visual payload: 'regions' array required." },
        { status: 400 }
      );
    }

    const auditReport = auditVisualCreative(body);
    return NextResponse.json({
      success: true,
      data: auditReport,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to evaluate visual geometry payload." },
      { status: 500 }
    );
  }
}
