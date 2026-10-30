export interface ProposalItem {
  id: string;
  proposal_code: string;
  policy_version_id: string;
  target_rule_code: string;
  title: string;
  rationale: string;
  proposed_diff: {
    action: string;
    rule_code: string;
    previous_text: string;
    proposed_text: string;
    channel_scope_added: string;
  };
  status: string;
  adopted_at?: string;
}

export const proposalsStore: ProposalItem[] = [
  {
    id: "prop-01",
    proposal_code: "PROP-CLAIM-01",
    policy_version_id: "pol_acme_2026_v1",
    target_rule_code: "CLAIM-001",
    title: "Permit Substantiated 2026 SOC-2 SLA Claims for Institutional Collateral",
    rationale:
      "Reviewers have executed 38 overrides on CLAIM-001 because sales collateral cited verified SOC-2 2026 SLA data. Updating the AST pattern to accept verified claim citations eliminates 85% of false-positive review friction.",
    proposed_diff: {
      action: "MODIFY_RULE_AST",
      rule_code: "CLAIM-001",
      previous_text: "Prohibit all unqualified 99.99% uptime claims unconditionally.",
      proposed_text:
        "Allow 99.99% uptime statements if accompanied by certified SOC-2 SLA citation or active ledger reference.",
      channel_scope_added: "institutional_sales_decks, enterprise_landing_pages",
    },
    status: "PENDING_APPROVAL",
  },
  {
    id: "prop-02",
    proposal_code: "PROP-TERM-02",
    policy_version_id: "pol_acme_2026_v1",
    target_rule_code: "TERM-004",
    title: "Underwriting Speed Clarification for Instant Loans",
    rationale:
      "Clarify acceptable loan approval timeline messaging across consumer fintech products.",
    proposed_diff: {
      action: "MODIFY_RULE_AST",
      rule_code: "TERM-004",
      previous_text: "Strict ban on instant loan terminology.",
      proposed_text: "Permit 'digital approval in as little as 3 minutes' with statutory qualification.",
      channel_scope_added: "paid_search, social_ads",
    },
    status: "PENDING_APPROVAL",
  },
];
