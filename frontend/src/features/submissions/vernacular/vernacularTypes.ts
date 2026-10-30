export type VernacularCategory =
  | "SURROGATE_ALCOBEV"
  | "SURROGATE_TOBACCO"
  | "SURROGATE_BETTING"
  | "PREDATORY_FINTECH_PROMISE"
  | "FALSE_URGENCY_DARK_PATTERN"
  | "PROHIBITED_MAGIC_REMEDY";

export interface VernacularFinding {
  id: string;
  sourceTextSpan: string;
  startIndex: number;
  endIndex: number;
  category: VernacularCategory;
  severity: "CRITICAL" | "HIGH";
  statutoryCitation: string;
  ruleTitle: string;
  ruleCode: string; // e.g. "ASCI-SURR-01", "CCPA-URG-01", "RBI-LEND-02"
  detectedViolationExplanation: string;
  suggestedCompliantRewrite: string;
  statutoryPenaltyExposureInr: number;
}

export interface VernacularAuditReport {
  originalText: string;
  normalizedText: string;
  findingsCount: number;
  criticalCount: number;
  totalStatutoryExposureInr: number;
  detectedCategories: VernacularCategory[];
  findings: VernacularFinding[];
}
