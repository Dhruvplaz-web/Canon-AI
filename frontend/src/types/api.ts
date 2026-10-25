/**
 * Canon API TypeScript Contract & Domain Model Interfaces
 * Mapped to 08_api_contract.md and 07_data_model.md
 */

export type UserRole =
  | "creator"
  | "reviewer"
  | "approver"
  | "brand_manager"
  | "it_admin"
  | "agency"
  | "exec";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspace_id: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export type PolicyStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface SourceCitation {
  document: string;
  section: string;
  page?: number;
  exact_quote: string;
}

export interface Rule {
  id: string;
  rule_code: string;
  category: "TERMINOLOGY" | "CLAIM" | "TONE" | "ACCESSIBILITY";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  forbidden_term?: string;
  suggested_replacement?: string;
  source_citation: SourceCitation;
}

export interface ApprovedClaim {
  id: string;
  claim_code: string;
  claim_text: string;
  substantiation: string;
  valid_from: string;
  valid_until: string;
  status: "ACTIVE" | "EXPIRED";
}

export interface Policy {
  id: string;
  workspace_id: string;
  name: string;
  version: string;
  status: PolicyStatus;
  effective_date: string;
  rules: Rule[];
  approved_claims: ApprovedClaim[];
}

export type SubmissionStatus = "DRAFT" | "QUEUED" | "CHECKING" | "COMPLETED" | "FAILED";

export interface Submission {
  id: string;
  workspace_id: string;
  creator_id: string;
  title: string;
  channel: string;
  content: string;
  status: SubmissionStatus;
  created_at: string;
}

export type FindingStatus = "PENDING_REVIEW" | "OVERRIDDEN" | "FIXED" | "CONFIRMED";

export interface Finding {
  id: string;
  submission_id: string;
  rule_code: string;
  category: "TERMINOLOGY" | "CLAIM" | "TONE" | "ACCESSIBILITY";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  matched_text: string;
  start_offset: number;
  end_offset: number;
  suggested_fix?: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document: string;
  source_section: string;
  status: FindingStatus;
  override_reason?: string;
}

export interface CheckRunResult {
  check_run_id: string;
  submission_id: string;
  policy_version: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  total_findings: number;
  findings: Finding[];
  claims_verified: number;
  stale_claims_detected: number;
  created_at: string;
}

export interface RuleHealthMetric {
  rule_code: string;
  title: string;
  category: string;
  total_evaluations: number;
  total_flags: number;
  total_overrides: number;
  override_rate: number;
  diagnostic_status: "HEALTHY" | "MONITOR" | "SCOPE_MISMATCH";
  primary_override_reason: string;
}

export interface BacktestSimulation {
  historical_submissions_analyzed: number;
  prior_compliance_pass_rate: number;
  simulated_compliance_pass_rate: number;
  false_positives_eliminated: number;
  regressions_detected: number;
  net_velocity_gain_hours: number;
  safety_score: number;
  recommendation: "SAFE_FOR_HUMAN_APPROVAL" | "MANUAL_LEGAL_AUDIT_REQUIRED";
}

export interface RuleProposal {
  proposal_id: string;
  policy_version_from: string;
  policy_version_to: string;
  target_rule_code: string;
  rule_title: string;
  title: string;
  rationale: string;
  diff: {
    action: string;
    rule_code: string;
    previous_text: string;
    proposed_text: string;
    channel_scope_added?: string;
  };
  backtest_simulation: BacktestSimulation;
}

export interface StandardError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}
