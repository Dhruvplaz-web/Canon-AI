export type VisualRegionLabel =
  | "HEADLINE"
  | "SUBHEAD"
  | "BODY_CLAIM"
  | "DISCLAIMER_LEGAL"
  | "PARTNER_BADGE"
  | "LOGO";

export type VisualViolationSeverity = "CRITICAL" | "HIGH" | "WARNING" | "PASS";

export interface VisualViolation {
  code: string; // e.g. "ASCI-DISC-01", "CCPA-SEC4-2", "WCAG-CONTRAST-AA", "RBI-PARTNER-NBFC"
  severity: VisualViolationSeverity;
  ruleTitle: string;
  statutoryCitation: string;
  detectedValue: string;
  requiredThreshold: string;
  remediationAction: string;
}

export interface NormalizedCoordinates {
  ymin: number; // 0.0 to 1.0 (relative to canvas height)
  xmin: number; // 0.0 to 1.0 (relative to canvas width)
  ymax: number;
  xmax: number;
}

export interface VisualBoundingBox {
  id: string;
  label: VisualRegionLabel;
  textExtracted: string;
  coordinates: NormalizedCoordinates;
  metrics: {
    calculatedFontSizePt: number;
    canvasHeightPercentage: number;
    contrastRatio: number;
    textColorHex: string;
    backgroundColorHex: string;
    rotationDegrees?: number;
  };
  violations: VisualViolation[];
}

export interface VisualCreativeAsset {
  id: string;
  title: string;
  category: "FINTECH_LOAN" | "EDTECH_GUARANTEE" | "INSTITUTIONAL_BANK" | "FMCG_SURROGATE";
  channel:
    | "INSTAGRAM_POST"
    | "DISPLAY_BANNER_300X250"
    | "DISPLAY_BANNER_728X90"
    | "DISPLAY_BANNER_160X600"
    | "STORY_9_16";
  dimensions: {
    width: number;
    height: number;
  };
  headlineText: string;
  disclaimerText: string;
  backgroundTheme: string;
  regions: VisualBoundingBox[];
}

export interface VisualAuditReport {
  assetId: string;
  assetTitle: string;
  timestamp: string;
  overallVerdict: "COMPLIANT" | "FLAGGED_CRITICAL" | "ACTION_REQUIRED";
  statutoryFineExposureInr: number;
  criticalViolationsCount: number;
  warningsCount: number;
  isRemediated?: boolean;
  summaryMetrics: {
    minDisclaimerPt: number;
    headlineHeightPt: number;
    disclaimerToHeadlineRatio: number; // target >= 0.30 (30%) under ASCI
    lowestContrastRatio: number; // target >= 4.5:1 under WCAG
  };
  statutoryChecklist: {
    ruleId: string;
    title: string;
    standard: string;
    passed: boolean;
    mathFormula: string;
    scoreText: string;
  }[];
  regions: VisualBoundingBox[];
}

