import { NextRequest, NextResponse } from "next/server";
import { auditVernacularCopy } from "@/features/submissions/vernacular/vernacularAuditEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || "";

    const report = auditVernacularCopy(text);

    return NextResponse.json({
      success: true,
      data: report,
      statutoryFrameworksApplied: [
        "ASCI Code Chapter III (Surrogate / Indirect Advertising)",
        "Consumer Protection Act 2019 (CCPA) - Guideline 9 (Surrogate Ads)",
        "CCPA Dark Patterns Guidelines (2023) - Schedule 1 (False Urgency)",
        "Drugs and Magic Remedies (Objectionable Ads) Act 1954 - Section 3",
        "RBI Digital Lending Guidelines (2022) - Section 3",
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Vernacular check failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

