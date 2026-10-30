import { normalizeIndicPhonetics } from "./indicNormalizer";
import {
  SURROGATE_KNOWLEDGE_BASE,
  VERNACULAR_PATTERN_RULES,
} from "./vernacularLexicon";
import {
  VernacularAuditReport,
  VernacularFinding,
  VernacularCategory,
} from "./vernacularTypes";

/**
 * Deterministic Indic Vernacular & Surrogate Audit Engine.
 * Evaluates Hinglish ad copy for:
 * 1. Bipartite surrogate advertising (Alcobev / Pan Masala / Betting)
 * 2. Deceptive Hindi financial guarantees ("bina document", "paisa double")
 * 3. False urgency dark patterns ("sirf 2 ghante bache")
 * 4. Magic remedy health claims ("shartiya ilaaj")
 */
export function auditVernacularCopy(rawText: string): VernacularAuditReport {
  if (!rawText || typeof rawText !== "string") {
    return {
      originalText: "",
      normalizedText: "",
      findingsCount: 0,
      criticalCount: 0,
      totalStatutoryExposureInr: 0,
      detectedCategories: [],
      findings: [],
    };
  }

  const normalized = normalizeIndicPhonetics(rawText);
  const findings: VernacularFinding[] = [];
  const detectedCategoriesSet = new Set<VernacularCategory>();
  let totalExposure = 0;
  let counter = 0;

  // --------------------------------------------------------------------------
  // 1. BIPARTITE SURROGATE COUPLING CHECK
  // Evaluates co-occurrence of Restricted Brand + Innocuous Extension Token
  // --------------------------------------------------------------------------
  SURROGATE_KNOWLEDGE_BASE.forEach((group) => {
    // Search both raw and normalized text for brand names
    const textLower = rawText.toLowerCase();

    for (const brand of group.restrictedBrands) {
      if (textLower.includes(brand) || normalized.includes(brand)) {
        // Master brand found! Now check for innocuous extension co-occurrence
        for (const ext of group.innocuousExtensions) {
          if (textLower.includes(ext) || normalized.includes(ext)) {
            // Find span in raw text for visual highlighting
            const brandIdx = textLower.indexOf(brand);
            const extIdx = textLower.indexOf(ext);
            const start = Math.min(brandIdx !== -1 ? brandIdx : 0, extIdx !== -1 ? extIdx : 0);
            const end = Math.max(
              brandIdx !== -1 ? brandIdx + brand.length : rawText.length,
              extIdx !== -1 ? extIdx + ext.length : rawText.length
            );

            const spanText = rawText.substring(start, end);

            findings.push({
              id: `vern-surr-${++counter}`,
              sourceTextSpan: spanText,
              startIndex: start,
              endIndex: end,
              category: group.category,
              severity: "CRITICAL",
              statutoryCitation: group.statutoryCitation,
              ruleTitle: group.ruleTitle,
              ruleCode: group.ruleCode,
              detectedViolationExplanation: `${group.explanation} Matched: '${brand}' with extension '${ext}'.`,
              suggestedCompliantRewrite: group.suggestedAction,
              statutoryPenaltyExposureInr: group.penaltyInr,
            });

            detectedCategoriesSet.add(group.category);
            totalExposure += group.penaltyInr;
            break; // Avoid duplicate alerts for same brand in same sentence
          }
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 2. PATTERN RULES (FinTech, Dark Patterns, Magic Remedies)
  // Evaluates both original text and phonetically normalized text
  // --------------------------------------------------------------------------
  VERNACULAR_PATTERN_RULES.forEach((rule) => {
    for (const pattern of rule.regexPatterns) {
      // Test original text first
      let match = pattern.exec(rawText);

      // If no match in original, test against phonetically normalized text
      if (!match) {
        match = pattern.exec(normalized);
      }

      if (match) {
        const start = match.index;
        const end = match.index + match[0].length;
        const spanText = rawText.substring(start, Math.min(end, rawText.length)) || match[0];

        // Ensure we don't push duplicate findings for the same span
        const alreadyFlagged = findings.some(
          (f) => f.ruleCode === rule.ruleCode && Math.abs(f.startIndex - start) < 10
        );

        if (!alreadyFlagged) {
          findings.push({
            id: `vern-pat-${++counter}`,
            sourceTextSpan: spanText,
            startIndex: start,
            endIndex: end,
            category: rule.category,
            severity: rule.severity,
            statutoryCitation: rule.statutoryCitation,
            ruleTitle: rule.ruleTitle,
            ruleCode: rule.ruleCode,
            detectedViolationExplanation: rule.explanation,
            suggestedCompliantRewrite: rule.suggestedAction,
            statutoryPenaltyExposureInr: rule.penaltyInr,
          });

          detectedCategoriesSet.add(rule.category);
          totalExposure += rule.penaltyInr;
        }
      }
    }
  });

  // Cap total exposure at ₹50 Lakhs statutory ceiling under CCPA 2019
  const cappedExposure = Math.min(totalExposure, 5000000);

  return {
    originalText: rawText,
    normalizedText: normalized,
    findingsCount: findings.length,
    criticalCount: findings.filter((f) => f.severity === "CRITICAL").length,
    totalStatutoryExposureInr: cappedExposure,
    detectedCategories: Array.from(detectedCategoriesSet),
    findings,
  };
}
