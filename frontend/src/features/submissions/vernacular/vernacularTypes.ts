import { PhoneticTraceStep } from "./indicNormalizer";

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
  severity: "CRITICAL" | "HIGH" | "WARNING" | "INFO";
  statutoryCitation: string;
  ruleTitle: string;
  ruleCode: string; // e.g. "ASCI-SURR-01", "CCPA-URG-01", "RBI-LEND-02"
  detectedViolationExplanation: string;
  suggestedCompliantRewrite: string;
  statutoryPenaltyExposureInr: number;
  phoneticTrace?: {
    original: string;
    canonical: string;
    steps: PhoneticTraceStep[];
  };
  bipartiteEntityMatch?: {
    masterBrand: string;
    innocuousExtension: string;
    surrogateCategory: string;
  };
  status?: "violation" | "review" | "clear" | "uncertain";
  sourceTag?: "rule" | "embedding" | "AI-assisted";
  receiptA?: {
    text: string;
    start: number;
    end: number;
  };
  receiptB?: {
    quote: string;
    verified: boolean;
    source?: string;
    matchedExemplarText?: string;
  };
  statuteName?: string;
  provision?: string;
  quoteVerified?: boolean;
  score?: number;
  margin?: number;
  isBrandOnly?: boolean;
  legalCaveat?: string;
  matchedExemplarText?: string;
}

export interface VernacularAuditReport {
  originalText: string;
  normalizedText: string;
  findingsCount: number;
  criticalCount: number;
  totalStatutoryExposureInr: number;
  detectedCategories: VernacularCategory[];
  remediatedText: string;
  findings: VernacularFinding[];
  status?: "violation" | "review" | "clear";
  offlineMode?: boolean;
}
