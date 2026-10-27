import { NextRequest, NextResponse } from "next/server";
import { submissionsStore } from "@/app/api/v1/submissions/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (submissionsStore[id]) {
      submissionsStore[id].content = body.content || submissionsStore[id].content;
    }
    return NextResponse.json({
      id: `ver_${Date.now()}`,
      submission_id: id,
      content: body.content,
      version_number: 2,
      created_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record version";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
