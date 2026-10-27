import { NextRequest, NextResponse } from "next/server";
import { reviewQueueStore } from "@/app/api/v1/review/queue/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const findingIds: string[] = body.finding_ids || [];
    const reasonCode = body.reason_code || "RC-01";
    const notes = body.notes || "";

    findingIds.forEach((id) => {
      const item = reviewQueueStore.find((f) => f.id === id);
      if (item) {
        item.status = "OVERRIDDEN";
      }
    });

    return NextResponse.json({
      success: true,
      overridden_count: findingIds.length,
      reason_code: reasonCode,
      notes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch override failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
