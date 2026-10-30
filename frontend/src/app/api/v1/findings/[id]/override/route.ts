import { NextRequest, NextResponse } from "next/server";
import { reviewQueueStore } from "@/app/api/v1/review/queue/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const item = reviewQueueStore.find((f) => f.id === id);
    if (item) {
      item.status = "OVERRIDDEN";
    }

    return NextResponse.json({
      success: true,
      finding_id: id,
      reason_code: body.reason_code,
      notes: body.notes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Override failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
