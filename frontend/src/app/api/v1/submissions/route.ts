import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { submissionsStore, SubmissionRecord } from "./store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `sub_${crypto.randomUUID().slice(0, 8)}`;
    const record: SubmissionRecord = {
      id,
      title: body.title || "Untitled Draft Campaign",
      channel: body.channel || "web_landing_page",
      content: body.content || "",
      current_version_number: 1,
      status: "DRAFT",
      created_at: new Date().toISOString(),
      latest_approval: null,
    };
    submissionsStore[id] = record;

    return NextResponse.json(record);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create draft";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(Object.values(submissionsStore));
}
