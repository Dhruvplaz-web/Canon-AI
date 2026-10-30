import { VisualCreativeAsset, VisualAuditReport, VisualBoundingBox, VisualViolation } from "./visualTypes";

/**
 * Converts a hex color string to normalized RGB values (0 to 1).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Calculates relative linear luminance per WCAG 2.1 / ISO 40500:2012.
 */
export function calculateRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const transform = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG 2.1 AA luminance contrast ratio: (L1 + 0.05) / (L2 + 0.05).
 * Guaranteed to return a value between 1.0 and 21.0.
 */
export function calculateWcagContrast(textColorHex: string, backgroundColorHex: string): number {
  const rgbText = hexToRgb(textColorHex);
  const rgbBg = hexToRgb(backgroundColorHex);
  const l1 = calculateRelativeLuminance(rgbText);
  const l2 = calculateRelativeLuminance(rgbBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 10) / 10;
}

/**
 * Core Deterministic Visual Audit Engine.
 * Audits bounding boxes against ASCI 2023, CCPA 2022, and WCAG AA standards.
 * Supports "isRemediated" simulation to demonstrate Canon's Auto-Fix capability.
 */
export function auditVisualCreative(
  asset: VisualCreativeAsset,
  isRemediated = false
): VisualAuditReport {
  let criticalCount = 0;
  let warningsCount = 0;
  let totalFineExposureInr = 0;

  // Locate the headline box to calculate relative ratio
  const headlineBox = asset.regions.find((r) => r.label === "HEADLINE");
  const headlinePt = headlineBox ? headlineBox.metrics.calculatedFontSizePt : 32.0;

  const auditedRegions: VisualBoundingBox[] = asset.regions.map((region) => {
    let dynamicViolations: VisualViolation[] = [...region.violations];
    const metrics = { ...region.metrics };

    // Apply 1-Click Remediation Fixes if toggled
    if (isRemediated) {
      if (region.label === "DISCLAIMER_LEGAL") {
        metrics.calculatedFontSizePt = Math.max(10.0, Math.round(headlinePt * 0.32 * 10) / 10);
        metrics.canvasHeightPercentage = 2.4;
        metrics.textColorHex = "#0F172A"; // High-contrast slate-900
        metrics.rotationDegrees = 0; // Straighten horizontal
        metrics.contrastRatio = calculateWcagContrast(metrics.textColorHex, metrics.backgroundColorHex);
        dynamicViolations = []; // All violations resolved!
      } else if (region.label === "PARTNER_BADGE") {
        metrics.calculatedFontSizePt = 9.5;
        metrics.canvasHeightPercentage = 2.0;
        metrics.textColorHex = "#0F172A";
        metrics.contrastRatio = 11.2;
        dynamicViolations = [];
      }
    } else {
      // Recompute contrast dynamically
      if (metrics.textColorHex && metrics.backgroundColorHex && metrics.textColorHex !== "transparent") {
        metrics.contrastRatio = calculateWcagContrast(metrics.textColorHex, metrics.backgroundColorHex);
      }

      // ASCI / CCPA Rules for Legal Disclaimers
      if (region.label === "DISCLAIMER_LEGAL") {
        // 1. Absolute font size check (8.0pt minimum under ASCI / CCPA guidelines)
        if (metrics.calculatedFontSizePt < 8.0 && !dynamicViolations.some((v) => v.code === "ASCI-DISC-01")) {
          dynamicViolations.push({
            code: "ASCI-DISC-01",
            severity: "CRITICAL",
            ruleTitle: "Microscopic Fine Print Violation",
            statutoryCitation: "ASCI Guidelines on Disclaimers (2023) Clause 1.4",
            detectedValue: `${metrics.calculatedFontSizePt.toFixed(1)}pt font height`,
            requiredThreshold: "≥ 8.0pt minimum absolute font size",
            remediationAction: "Increase font size to at least 8.5pt.",
          });
        }

        // 2. Relative headline ratio check (≥ 30% of headline size under ASCI)
        const ratio = metrics.calculatedFontSizePt / headlinePt;
        if (ratio < 0.30 && !dynamicViolations.some((v) => v.code === "ASCI-RATIO-30")) {
          dynamicViolations.push({
            code: "ASCI-RATIO-30",
            severity: "CRITICAL",
            ruleTitle: "Sub-30% Headline-to-Disclaimer Ratio",
            statutoryCitation: "ASCI Disclaimer Code: Qualifying Font Ratio ≥ 30%",
            detectedValue: `${Math.round(ratio * 100)}% of headline font size`,
            requiredThreshold: `≥ 30% (requires ≥ ${(headlinePt * 0.3).toFixed(1)}pt)`,
            remediationAction: `Scale disclaimer text height up to at least ${(headlinePt * 0.3).toFixed(1)}pt.`,
          });
        }

        // 3. WCAG Contrast Check (< 4.5:1 is a failure for normal text)
        if (metrics.contrastRatio < 4.5 && !dynamicViolations.some((v) => v.code === "WCAG-CONTRAST-AA")) {
          dynamicViolations.push({
            code: "WCAG-CONTRAST-AA",
            severity: "CRITICAL",
            ruleTitle: "Illegible Low-Contrast Disclaimer",
            statutoryCitation: "ISO/IEC 40500:2012 / WCAG 2.1 AA Criterion 1.4.3",
            detectedValue: `${metrics.contrastRatio.toFixed(1)}:1 contrast ratio`,
            requiredThreshold: "≥ 4.5:1 contrast against background",
            remediationAction: "Change text color to a higher contrast color value.",
          });
        }

        // 4. Orientation / Rotation check (sideways obscuration)
        if (metrics.rotationDegrees && Math.abs(metrics.rotationDegrees) > 15 && !dynamicViolations.some((v) => v.code === "CCPA-ROTATION-OBSCURATION")) {
          dynamicViolations.push({
            code: "CCPA-ROTATION-OBSCURATION",
            severity: "CRITICAL",
            ruleTitle: "Obscured Sideways Text Orientation",
            statutoryCitation: "CCPA Guidelines for Misleading Advertisements (2022) Sec 4(2)",
            detectedValue: `${metrics.rotationDegrees}° rotated angle`,
            requiredThreshold: "0° horizontal reading angle",
            remediationAction: "Render disclaimer in horizontal standard reading orientation.",
          });
        }
      }
    }

    // Accumulate counts and statutory risk
    dynamicViolations.forEach((v) => {
      if (v.severity === "CRITICAL") {
        criticalCount++;
        totalFineExposureInr += 1000000; // ₹10 Lakhs base penalty per statutory violation under CCPA 2019
      } else if (v.severity === "HIGH") {
        warningsCount++;
        totalFineExposureInr += 200000;
      }
    });

    return {
      ...region,
      metrics,
      violations: dynamicViolations,
    };
  });

  // Calculate summary metrics
  const disclaimerRegions = auditedRegions.filter((r) => r.label === "DISCLAIMER_LEGAL");
  const minDisclaimerPt = disclaimerRegions.length > 0
    ? Math.min(...disclaimerRegions.map((d) => d.metrics.calculatedFontSizePt))
    : headlinePt;
  const lowestContrastRatio = auditedRegions.length > 0
    ? Math.min(...auditedRegions.filter((r) => r.metrics.contrastRatio > 0).map((r) => r.metrics.contrastRatio))
    : 10.0;
  const disclaimerToHeadlineRatio = headlinePt > 0 ? minDisclaimerPt / headlinePt : 1.0;

  // Cap statutory exposure at ₹50 Lakhs (the statutory ceiling under Consumer Protection Act 2019)
  const cappedFineExposure = isRemediated ? 0 : Math.min(totalFineExposureInr, 5000000);

  const overallVerdict: VisualAuditReport["overallVerdict"] = isRemediated
    ? "COMPLIANT"
    : criticalCount > 0
    ? "FLAGGED_CRITICAL"
    : warningsCount > 0
    ? "ACTION_REQUIRED"
    : "COMPLIANT";

  // Formal Statutory Checklist
  const statutoryChecklist = [
    {
      ruleId: "ASCI-1.4",
      title: "Relative Font-to-Headline Proportion",
      standard: "ASCI Disclaimer Code 2023",
      passed: isRemediated || disclaimerToHeadlineRatio >= 0.30,
      mathFormula: "H_disclaimer / H_headline ≥ 0.30",
      scoreText: `${Math.round(disclaimerToHeadlineRatio * 100)}% (Min 30%)`,
    },
    {
      ruleId: "CCPA-4.2",
      title: "Absolute Disclaimer Legibility Floor",
      standard: "Consumer Protection Act 2019 (CCPA)",
      passed: isRemediated || minDisclaimerPt >= 8.0,
      mathFormula: "Disclaimer_Pt ≥ 8.0pt (Height ≥ 1.8%)",
      scoreText: `${minDisclaimerPt.toFixed(1)}pt (Min 8.0pt)`,
    },
    {
      ruleId: "WCAG-1.4.3",
      title: "Luminance Background Contrast",
      standard: "ISO/IEC 40500:2012 (WCAG 2.1 AA)",
      passed: isRemediated || lowestContrastRatio >= 4.5,
      mathFormula: "(L_light + 0.05) / (L_dark + 0.05) ≥ 4.5:1",
      scoreText: `${lowestContrastRatio.toFixed(1)}:1 (Min 4.5:1)`,
    },
    {
      ruleId: "RBI-DL-3.1",
      title: "Regulated NBFC Partner Transparency",
      standard: "RBI Digital Lending Guidelines 2022",
      passed: isRemediated || !auditedRegions.some((r) => r.violations.some((v) => v.code === "RBI-DIGITAL-LENDING-2022")),
      mathFormula: "Disclosure(Partner_NBFC) = TRUE",
      scoreText: isRemediated || !auditedRegions.some((r) => r.violations.some((v) => v.code === "RBI-DIGITAL-LENDING-2022"))
        ? "Verified Disclosed"
        : "Missing Partner CoR",
    },
  ];

  return {
    assetId: asset.id,
    assetTitle: asset.title,
    timestamp: new Date().toISOString(),
    overallVerdict,
    statutoryFineExposureInr: cappedFineExposure,
    criticalViolationsCount: isRemediated ? 0 : criticalCount,
    warningsCount: isRemediated ? 0 : warningsCount,
    isRemediated,
    summaryMetrics: {
      minDisclaimerPt: Math.round(minDisclaimerPt * 10) / 10,
      headlineHeightPt: Math.round(headlinePt * 10) / 10,
      disclaimerToHeadlineRatio: Math.round(disclaimerToHeadlineRatio * 100) / 100,
      lowestContrastRatio: Math.round(lowestContrastRatio * 10) / 10,
    },
    statutoryChecklist,
    regions: auditedRegions,
  };
}
