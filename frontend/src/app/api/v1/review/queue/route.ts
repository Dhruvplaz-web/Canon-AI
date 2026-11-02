import { NextRequest, NextResponse } from "next/server";
import { reviewQueueStore } from "./store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "10", 10);

  let filtered = [...reviewQueueStore];

  if (severity && severity !== "ALL") {
    filtered = filtered.filter((i) => i.severity === severity);
  }
  if (channel && channel !== "ALL") {
    filtered = filtered.filter((i) => i.submission_channel === channel);
  }
  if (status && status !== "ALL") {
    filtered = filtered.filter((i) => i.status === status);
  }
  if (search) {
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(search) ||
        i.matched_text.toLowerCase().includes(search) ||
        i.rule_code.toLowerCase().includes(search) ||
        i.submission_title.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return NextResponse.json({
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || `fnd_rev_${Date.now()}`;
    const newItem = {
      id,
      check_run_id: body.check_run_id || `chk_${Date.now()}`,
      submission_id: body.submission_id || `sub_vern_${Date.now()}`,
      submission_title: body.submission_title || "Vernacular Ad Copy Audit",
      submission_channel: body.submission_channel || "vernacular_copy",
      submission_status: "PENDING_REVIEW",
      creator_id: body.creator_id || "usr_vernacular",
      creator_name: body.creator_name || "Vernacular Compliance Radar",
      rule_code: body.rule_code || "VERN-REV-01",
      category: body.category || "VERNACULAR_STATUTORY",
      severity: body.severity || "WARNING",
      title: body.title || "Vernacular Human Review Required",
      matched_text: body.matched_text || body.receipt_a_draft_span || "",
      start_offset: body.start_offset || 0,
      end_offset: body.end_offset || 0,
      suggested_fix: body.suggested_fix || "Conduct editorial and legal compliance signoff.",
      receipt_a_draft_span: body.receipt_a_draft_span || body.matched_text || "",
      receipt_b_rule_quote: body.receipt_b_rule_quote || "Review required under statutory guidelines.",
      source_document_title: body.source_document_title || "STATUTES-2026",
      source_section: body.source_section || "Vernacular Compliance",
      status: "PENDING_REVIEW",
      created_at: new Date().toISOString(),
    };

    // Prepend to review queue store
    reviewQueueStore.unshift(newItem);

    return NextResponse.json({
      success: true,
      item: newItem,
      total: reviewQueueStore.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to queue review item" },
      { status: 500 }
    );
  }
}
