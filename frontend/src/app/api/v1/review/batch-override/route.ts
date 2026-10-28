import { NextRequest, NextResponse } from "next/server";
import { reviewQueueStore } from "@/app/api/v1/review/queue/route";

export async function POST(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("action") === "reset") {
      reviewQueueStore.forEach((f) => {
        f.status = "PENDING_REVIEW";
      });
      return NextResponse.json({
        success: true,
        message: "Review queue findings restored to PENDING_REVIEW state.",
      });
    }

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

    const auditLogId = `AUD-REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      overridden_count: findingIds.length,
      reason_code: reasonCode,
      notes,
      audit_log_id: auditLogId,
      results: findingIds.map((fid) => ({
        finding_id: fid,
        audit_log_id: auditLogId,
        status: "OVERRIDDEN",
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch override failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
