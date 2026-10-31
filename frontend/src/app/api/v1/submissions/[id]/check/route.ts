import { NextRequest, NextResponse } from "next/server";
import { verifyMarketingCopy } from "@/lib/compliance-engine";
import { submissionsStore } from "@/app/api/v1/submissions/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = submissionsStore[id];
    let contentToCheck = existing ? existing.content : "";

    // If client supplied content in body
    try {
      const body = await req.json();
      if (body.content) contentToCheck = body.content;
    } catch {
      // Body may be empty
    }

    if (!contentToCheck) {
      contentToCheck = "Acme Financial delivers enterprise treasury solutions.";
    }

    const checkResult = verifyMarketingCopy(contentToCheck, id);
    return NextResponse.json(checkResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Check pipeline execution failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
