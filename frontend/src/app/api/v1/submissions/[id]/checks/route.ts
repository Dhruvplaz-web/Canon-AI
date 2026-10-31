import { NextRequest, NextResponse } from "next/server";
import { verifyMarketingCopy } from "@/lib/compliance-engine";
import { submissionsStore } from "@/app/api/v1/submissions/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sub = submissionsStore[id];
    const content = sub ? sub.content : "Acme Financial delivers enterprise treasury solutions.";
    const checkResult = verifyMarketingCopy(content, id);

    return NextResponse.json([checkResult]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load checks";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
