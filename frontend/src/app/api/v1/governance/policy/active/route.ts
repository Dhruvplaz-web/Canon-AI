import { NextResponse } from "next/server";
import { ACTIVE_RULES } from "@/lib/compliance-engine";

export async function GET() {
  const rules = ACTIVE_RULES.map((r, i) => ({
    id: `rul_${r.rule_code.toLowerCase()}`,
    rule_code: r.rule_code,
    category: r.category,
    severity: r.severity,
    title: r.title,
    description: `Statutory compliance enforcement for ${r.category.toLowerCase()}.`,
    pattern_or_term: r.regex.source,
    suggested_replacement: r.suggested_fix,
    source_citation: {
      document_title: r.source_citation.document,
      section: r.source_citation.section,
      exact_quote: r.source_citation.exact_quote,
      page: i + 1,
    },
    is_active: true,
  }));

  const approvedClaims = [
    {
      id: "clm_uptime_01",
      claim_code: "CLAIM-001",
      claim_text: "99.99% uptime for institutional treasury clients",
      substantiation: "Certified SOC-2 Type II audit report, Q4 2025.",
      valid_from: "2025-01-01",
      valid_until: "2026-12-31",
      is_active: true,
    },
    {
      id: "clm_fdic_02",
      claim_code: "CLAIM-002",
      claim_text: "FDIC-insured partner institution up to $250,000",
      substantiation: "Evolve Bank & Trust formal deposit agreement, Exhibit C.",
      valid_from: "2024-01-01",
      valid_until: "2027-12-31",
      is_active: true,
    },
  ];

  const sourceDocument = {
    id: "doc_acme_master_2026",
    title: "Acme Financial Official Brand Guidelines (2026 Edition)",
    document_type: "PDF",
    storage_path: "/storage/policies/acme_guidelines_2026_v1.pdf",
    content_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    page_count: 14,
    extracted_text:
      "SECTION 1: STATUTORY BRAND IDENTITY\n" +
      "1.1 Acme is a financial technology company, not a bank. Marketing collateral must never instruct consumers to 'bank on us' or imply Acme holds banking charters.\n" +
      "1.2 All digital asset custody offerings must use formal nomenclature: 'Digital asset custody solutions'. Avoid speculative slang ('crypto tokens', 'crypto assets').\n" +
      "1.3 Copywriters must never use the phrase 'guaranteed returns', 'risk-free yield', or 'guaranteed APY'. Historical returns must carry explicit market volatility disclosures.\n" +
      "1.4 The phrase 'instant loan' or 'instant approval' is prohibited. Use 'pre-qualified digital underwriting in as little as 3 minutes'.\n\n" +
      "SECTION 2: VERIFIED SUBSTANTIATED CLAIMS\n" +
      "2.1 Any statement quoting system uptime ('99.99% uptime') must cite active SLA certificate.\n" +
      "2.2 FDIC insurance representations must explicitly name the depository banking partner.\n\n" +
      "SECTION 3: EDITORIAL VOICE AND TONE\n" +
      "3.1 Internet slang, hype terminology ('super dope yields', 'moon shot', 'to the moon', 'HODL') is forbidden.\n" +
      "3.2 The brand name must strictly appear in Title Case as 'Acme'.",
    status: "PROCESSED",
  };

  return NextResponse.json({
    id: "pol_acme_2026_v1",
    version_number: "1.0",
    status: "ACTIVE",
    compiled_rules_count: rules.length,
    change_summary: "Initial baseline policy compilation from statutory brand charter.",
    approved_by: "Alice Brand (Brand Manager)",
    approved_at: "2026-01-01T00:00:00Z",
    effective_date: "2026-01-01",
    source_document: sourceDocument,
    rules,
    approved_claims: approvedClaims,
  });
}
