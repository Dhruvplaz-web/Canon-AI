import { NextRequest, NextResponse } from "next/server";
import { submissionsStore, approvalsStore } from "@/app/api/v1/submissions/store";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const approvalId = `appr_${crypto.randomUUID().slice(0, 8)}`;

    const approvalItem = {
      id: approvalId,
      workspace_id: "wks_01j7acme0000000000000001",
      submission_id: id,
      submission_version_id: `ver_${id}_1`,
      approved_by: "usr_rachel",
      approver_name: "Rachel Reviewer",
      approver_email: "rachel@acmefinancial.com",
      decision: "APPROVED",
      approval_type: body.approval_type || "FINAL_SIGNOFF",
      notes: body.notes || "Brand compliance sign-off granted.",
      signed_off_at: timestamp,
      created_at: timestamp,
    };

    if (!approvalsStore[id]) {
      approvalsStore[id] = [];
    }
    approvalsStore[id].push(approvalItem);

    if (submissionsStore[id]) {
      submissionsStore[id].status = "APPROVED";
      submissionsStore[id].latest_approval = {
        id: approvalId,
        decision: "APPROVED",
        approver_name: "Rachel Reviewer",
        signed_off_at: timestamp,
        notes: approvalItem.notes,
      };
    }

    return NextResponse.json(approvalItem);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
