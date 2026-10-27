import { RuleHealthMetric, RuleProposal } from "@/types/api";

export const MOCK_RULE_HEALTH: RuleHealthMetric[] = [
  {
    rule_code: "TERM-007",
    title: "Educational Case Studies & Partner Portal Disclosures",
    category: "TERMINOLOGY",
    total_evaluations: 48,
    total_flags: 24,
    total_overrides: 9,
    override_rate: 0.375, // 37.5% - Flapping / Scope Mismatch
    diagnostic_status: "SCOPE_MISMATCH",
    primary_override_reason: "JUSTIFIED_EDUCATIONAL_CONTEXT",
  },
  {
    rule_code: "TERM-001",
    title: "Prohibition of Unqualified Banking Verbs",
    category: "TERMINOLOGY",
    total_evaluations: 52,
    total_flags: 12,
    total_overrides: 0,
    override_rate: 0.0,
    diagnostic_status: "HEALTHY",
    primary_override_reason: "NONE",
  },
  {
    rule_code: "CLAIM-001",
    title: "Uptime and Infrastructure Reliability Claims",
    category: "CLAIM",
    total_evaluations: 35,
    total_flags: 8,
    total_overrides: 1,
    override_rate: 0.125,
    diagnostic_status: "HEALTHY",
    primary_override_reason: "VERIFIED_EXTERNAL_REFERENCE",
  },
];

export const MOCK_SEEDED_PROPOSAL_PROP_01: RuleProposal = {
  proposal_id: "PROP-01",
  policy_version_from: "1.0",
  policy_version_to: "1.1",
  target_rule_code: "TERM-007",
  rule_title: "Educational Case Studies & Partner Portal Disclosures",
  title: "Exempt Verified Educational Case Studies on Enterprise Partner Portals",
  rationale:
    "Reviewer override analysis demonstrates that 38% of flags on TERM-007 were legitimately overridden for educational content published on enterprise partner portals. Refining the channel scope eliminates recurring false-positive friction without compromising public consumer compliance.",
  diff: {
    action: "MODIFY_RULE_SCOPE",
    rule_code: "TERM-007",
    previous_text:
      "All educational case studies and technical thought leadership articles must display full state statutory disclosures prominently.",
    proposed_text:
      "All educational case studies and technical thought leadership articles must display full state statutory disclosures prominently, except when published exclusively within verified enterprise partner portals.",
    channel_scope_added: "partner_portal",
  },
  backtest_simulation: {
    historical_submissions_analyzed: 24,
    prior_compliance_pass_rate: 0.583,
    simulated_compliance_pass_rate: 0.833,
    false_positives_eliminated: 6,
    regressions_detected: 0,
    net_velocity_gain_hours: 14.5,
    safety_score: 1.0,
    recommendation: "SAFE_FOR_HUMAN_APPROVAL",
  },
};
