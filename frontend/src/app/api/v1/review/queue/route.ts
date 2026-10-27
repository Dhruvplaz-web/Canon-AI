import { NextRequest, NextResponse } from "next/server";

export const reviewQueueStore = [
  {
    id: "fnd_rev_01",
    check_run_id: "chk_demo_01",
    submission_id: "sub_demo_01",
    submission_title: "Acme Q4 Global Growth Campaign",
    submission_channel: "web_landing_page",
    submission_status: "PENDING_REVIEW",
    creator_id: "usr_charlie",
    creator_name: "Charlie Creator",
    rule_code: "TERM-001",
    category: "TERMINOLOGY",
    severity: "CRITICAL",
    title: "Prohibition of Unqualified Banking Verbs",
    matched_text: "bank on us",
    start_offset: 14,
    end_offset: 24,
    suggested_fix: "Partner with Acme Financial Technologies, an FDIC-insured banking partner.",
    receipt_a_draft_span: "bank on us",
    receipt_b_rule_quote: 'Marketing collateral must never instruct consumers to "bank on us" or imply Acme itself holds banking charters.',
    source_document_title: "ACME-GUIDELINES-2026-V1",
    source_section: "SECTION 1: STATUTORY BRAND IDENTITY",
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "fnd_rev_02",
    check_run_id: "chk_demo_01",
    submission_id: "sub_demo_01",
    submission_title: "Acme Q4 Global Growth Campaign",
    submission_channel: "web_landing_page",
    submission_status: "PENDING_REVIEW",
    creator_id: "usr_charlie",
    creator_name: "Charlie Creator",
    rule_code: "TONE-002",
    category: "TONE",
    severity: "WARNING",
    title: "Ban on Slang & Financial Colloquialisms",
    matched_text: "super dope yields",
    start_offset: 45,
    end_offset: 62,
    suggested_fix: "Competitive interest rates on digital treasury solutions.",
    receipt_a_draft_span: "super dope yields",
    receipt_b_rule_quote: 'The use of internet slang, hype terminology ("super dope yields", "moon shot", "HODL") is prohibited.',
    source_document_title: "ACME-GUIDELINES-2026-V1",
    source_section: "SECTION 3: EDITORIAL VOICE AND TONE",
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "fnd_rev_03",
    check_run_id: "chk_demo_02",
    submission_id: "sub_demo_02",
    submission_title: "Institutional Fixed Income Ad",
    submission_channel: "paid_search",
    submission_status: "PENDING_REVIEW",
    creator_id: "usr_charlie",
    creator_name: "Charlie Creator",
    rule_code: "TERM-003",
    category: "TERMINOLOGY",
    severity: "CRITICAL",
    title: "Strict Ban on Performance Guarantees",
    matched_text: "guaranteed returns",
    start_offset: 28,
    end_offset: 46,
    suggested_fix: "Historical projected APY; yields subject to market volatility.",
    receipt_a_draft_span: "guaranteed returns",
    receipt_b_rule_quote: 'Copywriters must never use the phrase "guaranteed returns", "risk-free yield", or "guaranteed APY".',
    source_document_title: "ACME-GUIDELINES-2026-V1",
    source_section: "SECTION 1: STATUTORY BRAND IDENTITY",
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "fnd_rev_04",
    check_run_id: "chk_demo_03",
    submission_id: "sub_demo_03",
    submission_title: "Fintech SMB Working Capital Promo",
    submission_channel: "social_media",
    submission_status: "PENDING_REVIEW",
    creator_id: "usr_charlie",
    creator_name: "Charlie Creator",
    rule_code: "TERM-004",
    category: "TERMINOLOGY",
    severity: "WARNING",
    title: "Loan Approval Speed Disclosures",
    matched_text: "instant loan approval in seconds",
    start_offset: 32,
    end_offset: 64,
    suggested_fix: "Pre-qualified digital underwriting in as little as 3 minutes.",
    receipt_a_draft_span: "instant loan approval in seconds",
    receipt_b_rule_quote: 'The phrase "instant loan" or "instant approval" is deceptive and forbidden.',
    source_document_title: "ACME-GUIDELINES-2026-V1",
    source_section: "SECTION 1: STATUTORY BRAND IDENTITY",
    status: "PENDING_REVIEW",
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

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
