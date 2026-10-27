import { NextRequest, NextResponse } from "next/server";
import { callMultiProviderRewrite } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = body.content || "";
    const findings = body.findings || [];
    const brandTone = body.brand_tone || "high-conversion, professional and compliant";

    const result = await callMultiProviderRewrite(content, findings, brandTone);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Rewrite engine failure";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
