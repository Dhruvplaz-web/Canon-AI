import { NextRequest, NextResponse } from "next/server";
import { verifyMarketingCopy } from "@/lib/compliance-engine";
import { submissionsStore } from "@/app/api/v1/submissions/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const queryAsOf = url.searchParams.get("as_of");

    const existing = submissionsStore[id];
    let contentToCheck = existing ? existing.content : "";
    let asOf: string | null = queryAsOf;
    let channel: string | undefined = existing?.channel;

    // If client supplied content, as_of, or channel in body
    try {
      const body = await req.json();
      if (body.content) contentToCheck = body.content;
      if (body.as_of) asOf = body.as_of;
      if (body.channel) channel = body.channel;
    } catch {
      // Body may be empty
    }

    if (!contentToCheck) {
      contentToCheck = "Acme Financial delivers enterprise treasury solutions.";
    }

    const checkResult = verifyMarketingCopy(contentToCheck, id, asOf || undefined, channel);
    return NextResponse.json(checkResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Check pipeline execution failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
