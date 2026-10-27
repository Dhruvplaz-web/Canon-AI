import { NextRequest, NextResponse } from "next/server";
import { submissionsStore } from "@/app/api/v1/submissions/route";
import { approvalsStore } from "@/app/api/v1/submissions/[id]/approvals/route";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const sendBackId = `sb_${crypto.randomUUID().slice(0, 8)}`;

    const sendBackItem = {
      id: sendBackId,
      workspace_id: "wks_01j7acme0000000000000001",
      submission_id: id,
      submission_version_id: `ver_${id}_1`,
      approved_by: "usr_rachel",
      approver_name: "Rachel Reviewer",
      approver_email: "rachel@acmefinancial.com",
      decision: "SENT_BACK",
      approval_type: "CHANGES_REQUESTED",
      notes: body.notes || "Sent back to creator for compliance revisions.",
      signed_off_at: timestamp,
      created_at: timestamp,
    };

    if (!approvalsStore[id]) {
      approvalsStore[id] = [];
    }
    approvalsStore[id].push(sendBackItem);

    if (submissionsStore[id]) {
      submissionsStore[id].status = "SENT_BACK";
      submissionsStore[id].latest_approval = {
        id: sendBackId,
        decision: "SENT_BACK",
        approver_name: "Rachel Reviewer",
        signed_off_at: timestamp,
        notes: sendBackItem.notes,
      };
    }

    return NextResponse.json(sendBackItem);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Send back failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}
