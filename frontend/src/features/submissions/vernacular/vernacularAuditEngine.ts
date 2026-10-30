import {
  normalizeIndicPhonetics,
  getPhoneticTransformationTrace,
  tokenizeWithOffsets,
  transliterateDevanagariToLatin,
} from "./indicNormalizer";
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
 * Finds the character span of a target token or phrase in the original raw text,
 * accounting for phonetic elongations (e.g. 'sooodaaa' -> 'soda') and Devanagari transliterations.
 */
function findFuzzyOrPhoneticSpan(
  rawText: string,
  targetCanonical: string
): { start: number; end: number; matchedText: string } | null {
  if (!rawText || !targetCanonical) return null;

  const lower = rawText.toLowerCase();
  const directIdx = lower.indexOf(targetCanonical.toLowerCase());
  if (directIdx !== -1) {
    return {
      start: directIdx,
      end: directIdx + targetCanonical.length,
      matchedText: rawText.substring(directIdx, directIdx + targetCanonical.length),
    };
  }

  // Token-level search through raw text with phonetic normalization
  const tokens = tokenizeWithOffsets(rawText);
  const targetWords = targetCanonical.toLowerCase().split(/\s+/);

  for (let i = 0; i <= tokens.length - targetWords.length; i++) {
    let matches = true;
    for (let j = 0; j < targetWords.length; j++) {
      const tokenPhonetic = normalizeIndicPhonetics(tokens[i + j].token);
      const targetPhonetic = normalizeIndicPhonetics(targetWords[j]);
      if (tokenPhonetic !== targetPhonetic && !tokenPhonetic.includes(targetPhonetic)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      const start = tokens[i].start;
      const end = tokens[i + targetWords.length - 1].end;
      return {
        start,
        end,
        matchedText: rawText.substring(start, end),
      };
    }
  }

  return null;
}

/**
 * Generates an automatic, statutorily compliant Indian rewrite
 * eliminating surrogate brands, predatory promises, and false urgency.
 */
export function generateCompliantIndianRewrite(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // 1. Replace surrogate alcobev/tobacco mentions with responsible greeting
  cleaned = cleaned.replace(
    /(celebrate\s+(this\s+diwali|the\s+festival|festive\s+season)?\s*with\s+)?(royal\s+(select|challenge|stag)|bagpiper|mcdowell|imperial\s+blue|vimal|kamla\s+pasand|rajnigandha)[^.!?]*?(club\s+soda|silver\s+elaichi|water|packaged\s+drinking\s+water|music\s+cds)[!.]?/gi,
    "Celebrate this festive season with your family and loved ones!"
  );

  // 2. Replace illegal betting news surrogate mentions
  cleaned = cleaned.replace(
    /(1xbet|parimatch|fairplay|lotus365|betway|dafanews)[^.!?]*?(news|sports\s+news|prediction)[^.!?]*?[!.]?/gi,
    "Follow verified national cricket analysis and official BCCI sporting tournament updates."
  );

  // 3. Replace "bina document / bina paper" credit promises with regulated NBFC disclosure
  cleaned = cleaned.replace(
    /(bina|bagair|binaa)\s+(kisi\s+)?(document|kagaz|paper|cibil|salary\s*slip|jhanjhat)[^.!?]*?(chutki\s+me|turant|fatafat|2\s*minute\s*me)?\s*(paisa\s+double|loan|credit)?[!.]?/gi,
    "Digital pre-qualification subject to credit bureau assessment and RBI-regulated NBFC verification."
  );

  // 4. Replace "paisa double / 100% guarantee"
  cleaned = cleaned.replace(
    /(100%\s*pakka\s+)?(paisa|paise|pesa)\s+(double|dugna|3x|triple)[!.]?/gi,
    "Mutual fund and market investments are subject to market risks. Read all scheme related documents carefully."
  );

  // 5. Replace false urgency dark patterns
  cleaned = cleaned.replace(
    /(jaldi\s*karo\s*)?(sirf|bas)\s*\d+\s*(minute|ghante|ghanta)\s*bache\s*hain[^.!?]*?(offer\s*khatam|hamesha)?[!.]?/gi,
    "Promotional campaign valid through scheduled campaign dates."
  );

  // 6. Replace magic remedy health claims
  cleaned = cleaned.replace(
    /(shartiya|100%\s*guaranteed|pakka)\s*(ilaaj|ilaj|upchar)[^.!?]*?(diabetes|cancer|jad\s*se\s*khatam)[!.]?/gi,
    "Consult your physician for personalized medical advice. Dietary supplements support general wellness."
  );

  // 7. Clean up any lingering colloquial slang
  cleaned = cleaned.replace(/chutki\s+me\s+paisa\s+double/gi, "transparent financial planning");

  return cleaned.trim();
}

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
      remediatedText: "",
      findings: [],
    };
  }

  const transliterated = transliterateDevanagariToLatin(rawText);
  const normalized = normalizeIndicPhonetics(transliterated);
  const findings: VernacularFinding[] = [];
  const detectedCategoriesSet = new Set<VernacularCategory>();
  let totalExposure = 0;
  let counter = 0;

  // --------------------------------------------------------------------------
  // 1. BIPARTITE SURROGATE COUPLING CHECK
  // Evaluates co-occurrence of Restricted Brand + Innocuous Extension Token
  // --------------------------------------------------------------------------
  SURROGATE_KNOWLEDGE_BASE.forEach((group) => {
    const rawLower = rawText.toLowerCase();
    const translitLower = transliterated.toLowerCase();

    for (const brand of group.restrictedBrands) {
      const brandFound =
        rawLower.includes(brand) ||
        translitLower.includes(brand) ||
        normalized.includes(brand);

      if (brandFound) {
        // Master brand found! Now check for innocuous extension co-occurrence
        for (const ext of group.innocuousExtensions) {
          const extFound =
            rawLower.includes(ext) ||
            translitLower.includes(ext) ||
            normalized.includes(ext);

          if (extFound) {
            // Find span in raw text for visual highlighting
            const brandSpan =
              findFuzzyOrPhoneticSpan(rawText, brand) ||
              findFuzzyOrPhoneticSpan(transliterated, brand);
            const extSpan =
              findFuzzyOrPhoneticSpan(rawText, ext) ||
              findFuzzyOrPhoneticSpan(transliterated, ext);

            let start = 0;
            let end = rawText.length;

            if (brandSpan && extSpan) {
              start = Math.min(brandSpan.start, extSpan.start);
              end = Math.max(brandSpan.end, extSpan.end);
            } else if (brandSpan) {
              start = brandSpan.start;
              end = brandSpan.end;
            } else if (extSpan) {
              start = extSpan.start;
              end = extSpan.end;
            }

            const spanText = rawText.substring(start, end) || `${brand} ${ext}`;
            const trace = getPhoneticTransformationTrace(spanText);

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
              detectedViolationExplanation: `${group.explanation} Linked restricted brand '${brand}' with innocuous extension '${ext}'.`,
              suggestedCompliantRewrite: group.suggestedAction,
              statutoryPenaltyExposureInr: group.penaltyInr,
              phoneticTrace: trace,
              bipartiteEntityMatch: {
                masterBrand: brand.toUpperCase(),
                innocuousExtension: ext.toUpperCase(),
                surrogateCategory: group.category,
              },
            });

            detectedCategoriesSet.add(group.category);
            totalExposure += group.penaltyInr;
            break;
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
      let match = pattern.exec(rawText);

      if (!match) {
        match = pattern.exec(transliterated);
      }

      if (!match) {
        match = pattern.exec(normalized);
      }

      if (match) {
        const start = match.index;
        const end = match.index + match[0].length;
        const spanText = rawText.substring(start, Math.min(end, rawText.length)) || match[0];
        const trace = getPhoneticTransformationTrace(spanText);

        const alreadyFlagged = findings.some(
          (f) => f.ruleCode === rule.ruleCode && Math.abs(f.startIndex - start) < 15
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
            phoneticTrace: trace,
          });

          detectedCategoriesSet.add(rule.category);
          totalExposure += rule.penaltyInr;
        }
      }
    }
  });

  // Cap total exposure at ₹50 Lakhs statutory ceiling under CCPA 2019
  const cappedExposure = Math.min(totalExposure, 5000000);
  const remediatedText = generateCompliantIndianRewrite(rawText);

  return {
    originalText: rawText,
    normalizedText: normalized,
    findingsCount: findings.length,
    criticalCount: findings.filter((f) => f.severity === "CRITICAL").length,
    totalStatutoryExposureInr: cappedExposure,
    detectedCategories: Array.from(detectedCategoriesSet),
    remediatedText,
    findings,
  };
}
