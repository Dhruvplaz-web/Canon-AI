/**
 * Vernacular Matcher Types (v2)
 * Canonical shared type definitions for the entire vernacular matcher stack.
 */

export interface StatuteRecord {
  statute_id: string;
  name: string;
  provision: string;
  instrument_type: "statute" | "regulation" | "guideline" | "self_regulatory_code";
  binding: boolean;
  status: "in_force" | "repealed" | "draft_only_seen";
  source_quality: "primary_opened" | "secondary_only";
  official_url: string;
  url_status: "confirmed_opened" | "seen_in_footnote_unconfirmed" | "to_find";
  replaced_from: string;
  notes: string;
  action_for_human: string;
  verbatim_excerpt: string;
  verified_by: string;
  verified_on: string;
  quote_verified: boolean;
  annexure_illustrations_binding?: boolean;
  draft_url_seen?: string;
}

export interface ExemplarEntry {
  id: string;
  text: string;
  script: "romanized" | "devanagari" | "tamil" | "bengali" | "mixed";
  language: "hinglish" | "hindi" | "marathi" | "tanglish" | "banglish" | "english" | "bengali" | "tamil";
  label: "violation" | "safe";
  category: string;
  rule_code: string;
  concept_id: string | null;
  style: "direct_branded" | "indirect_no_brand" | "non_latin_script" | "slangy_short" | "polite_disguised" | "safe_lookalike";
  statute: string;
  statute_id: string;
  secondary_statute_ids?: string[];
  provision_override?: string;
  ai_explanation_draft: string;
  needs_review?: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  explanation: string;
  paired_with: string | null;
  split: "tune" | "test";
}

export interface ConceptGroup {
  id: string;
  description: string;
  match: "whole_word" | "regex";
  scripts_included: string[];
  words: string[];
}

export interface CombinationRule {
  id: string;
  anchor_group: string | null;
  requires_all_of: string[];
  exclude_groups?: string[];
  non_overlapping_spans?: boolean;
  min_distinct_groups?: number | null;
  timer_pattern_override?: boolean;
  restricted_brand_required?: boolean;
  restricted_brands?: string[];
  without_brand_severity?: string;
  without_brand_confidence?: string;
  legal_caveat?: string;
  within_words: number;
  category: string;
  rule_code: string;
  severity: string;
  confidence: "high" | "medium" | "low";
  statute_id: string;
  note?: string;
}

export interface SafeBlocker {
  phrase: string;
  note: string;
  effect: "downgrade_to_review";
}

export interface RegressionCases {
  must_not_fire: string[];
  must_fire: string[];
  note: string;
}

export interface StressTestCase {
  id: string;
  text: string;
  script: string;
  language: string;
  expected: "violation" | "safe";
  category: string | null;
  rule_code: string | null;
  severity: string | null;
  difficulty: "paraphrase" | "spelling_trick" | "mixed_script" | "needs_ai" | "safe_lookalike";
  expected_layer: "exemplar" | "word_group" | "ai_only" | "none";
  note: string;
}

export interface VernacularData {
  exemplars: ExemplarEntry[];
  statutes: StatuteRecord[];
  conceptGroups: ConceptGroup[];
  combinationRules: CombinationRule[];
  safeBlockers: SafeBlocker[];
  cannotOverrideGroups: Set<string>;
  restrictedBrands: Record<string, string[]>;
  regressionCases: RegressionCases;
  stressTests: StressTestCase[];
}

export interface NormalizedCharOffset {
  char: string;
  origStart: number;
  origEnd: number;
}

export interface NormalizedText {
  originalText: string;
  normalizedText: string;
  offsetMap: NormalizedCharOffset[];
  tokens: {
    token: string;
    start: number;
    end: number;
    origStart: number;
    origEnd: number;
    normToken: string;
  }[];
}

export type FindingStatus = "violation" | "review" | "uncertain" | "safe";
export type FindingSource = "concept_rule" | "similarity" | "ai";

/**
 * Core finding type used by Layer 1 (conceptRules.ts) — uses receipt_a/receipt_b
 * with text/quote fields.
 */
export interface VernacularFindingV2 {
  id: string;
  ruleId: string;
  category: string;
  rule_code: string;
  statute_id: string;
  statute_name: string;
  provision: string;
  receipt_a: {
    text: string;
    start: number;
    end: number;
  };
  receipt_b: {
    quote: string;
    verified: boolean;
    source: string;
  };
  status: FindingStatus;
  source: FindingSource;
  severity: "CRITICAL" | "WARNING" | "INFO";
  confidence: "high" | "medium" | "low";
  score?: number;
  nearest_exemplar_id?: string;
  explanation: string;
  suggested_fix?: string;
  needs_review?: boolean;
  legal_caveat?: string;
  penalty_inr: number;
  matched_groups?: string[];
}

/**
 * Rich finding type used by Layer 2 (similarity.ts) and Layer 3 (aiCheck.ts).
 * Uses UI-friendly field names compatible with VernacularFinding v1.
 */
export interface SimilarityFinding {
  id: string;
  source: FindingSource;
  status: FindingStatus;
  category: string;
  rule_code: string;
  statute_id: string;
  receipt_a: {
    text: string;
    start: number;
    end: number;
  };
  receipt_b: {
    quote: string;
    verified: boolean;
    source: string;
  };
  ruleTitle: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  explanation: string;
  statutoryCitation: string;
  suggestedCompliantRewrite: string;
  statutoryPenaltyExposureInr: number;
  score?: number;
  matched_exemplar_id?: string;
  phoneticTrace?: string;
}

/**
 * Union of both finding types used in the orchestrator.
 */
export type AnyFinding = VernacularFindingV2 | SimilarityFinding;

/**
 * Type guard: Check if a finding is a SimilarityFinding.
 */
export function isSimilarityFinding(f: AnyFinding): f is SimilarityFinding {
  return "ruleTitle" in f;
}

export interface VernacularMatchResult {
  findings: VernacularFindingV2[];
  summary: {
    total: number;
    violations: number;
    reviews: number;
    uncertain: number;
    safe: number;
    safeSuppressed: number;
  };
  similarityFindings: SimilarityFinding[];
  timingMs: number;
  layerBreakdown: {
    layer1Count: number;
    layer2Count: number;
    layer3Count: number;
  };
  originalText: string;
  normalizedText: string;
}
