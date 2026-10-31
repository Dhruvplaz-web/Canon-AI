import { NextRequest, NextResponse } from "next/server";
import { submissionsStore, approvalsStore } from "@/app/api/v1/submissions/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = approvalsStore[id] || [];

    // If submission has latest_approval, ensure it is included
    const sub = submissionsStore[id];
    if (existing.length === 0 && sub?.latest_approval) {
      existing.push({
        id: sub.latest_approval.id,
        workspace_id: "wks_01j7acme0000000000000001",
        submission_id: id,
        submission_version_id: `ver_${id}_1`,
        approved_by: "usr_rachel",
        approver_name: sub.latest_approval.approver_name,
        approver_email: "rachel@acmefinancial.com",
        decision: sub.latest_approval.decision,
        approval_type: "FINAL_SIGNOFF",
        notes: sub.latest_approval.notes || "Compliance sign-off approved.",
        signed_off_at: sub.latest_approval.signed_off_at,
        created_at: sub.latest_approval.signed_off_at,
      });
    }

    return NextResponse.json(existing);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load approvals";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
