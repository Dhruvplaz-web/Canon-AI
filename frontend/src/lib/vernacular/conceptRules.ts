/**
 * Layer 1: Concept Rules & Word Groups Engine
 * Implements deterministic semantic combination rules, whole-word and regex
 * pattern matching, brand extension checks with CCPA proviso, and safe blockers.
 */

import {
  NormalizedText,
  VernacularFindingV2,
  ConceptGroup,
  SafeBlocker,
} from "./types";
import {
  loadVernacularData,
  getStatute,
} from "./dataLoader";
import { mapNormalizedSpanToOriginal, normalizeDraft } from "./normalize";
import {
  CONCEPT_GROUPS_OVERLAY,
  SURROGATE_COMMODITY_EXTENSIONS,
} from "./conceptGroupsOverlay";

interface GroupMatchHit {
  groupId: string;
  word: string;
  start: number;
  end: number;
  origStart: number;
  origEnd: number;
  tokenIndex: number;
}

/**
 * Escapes string for RegExp construction.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds all matches for a given concept group in normalized draft.
 */
function matchGroup(group: ConceptGroup, normalized: NormalizedText): GroupMatchHit[] {
  const hits: GroupMatchHit[] = [];
  const text = normalized.normalizedText;

  if (group.match === "regex") {
    // Regex matching for timer patterns
    for (const patternStr of group.words) {
      try {
        const regex = new RegExp(patternStr, "gi");
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          const start = m.index;
          const end = m.index + m[0].length;
          const orig = mapNormalizedSpanToOriginal(
            normalized.offsetMap,
            start,
            end,
            normalized.originalText.length
          );

          // Find approximate token index
          let tokenIndex = 0;
          for (let i = 0; i < normalized.tokens.length; i++) {
            if (normalized.tokens[i].start >= start) {
              tokenIndex = i;
              break;
            }
          }

          hits.push({
            groupId: group.id,
            word: m[0],
            start,
            end,
            origStart: orig.start,
            origEnd: orig.end,
            tokenIndex,
          });
        }
      } catch {
        // Skip invalid regex gracefully
      }
    }
  } else {
    // Whole-word matching
    for (const rawWord of group.words) {
      if (!rawWord || !rawWord.trim()) continue;
      const normWordObj = normalizeDraft(rawWord);
      const normWord = normWordObj.normalizedText.trim();
      if (!normWord) continue;

      // Construct boundary pattern to ensure whole-word matching
      // Avoid matching inside other words (e.g., 'rum' inside 'drum', 'sure' inside 'assure')
      const pattern = new RegExp(`(?:^|[^a-zA-Z0-9\u0900-\u097F])${escapeRegExp(normWord)}(?:$|[^a-zA-Z0-9\u0900-\u097F])`, "gi");

      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        let matchStart = m.index;
        let matchEnd = m.index + m[0].length;

        // Strip leading non-alphanumeric
        if (/[^a-zA-Z0-9\u0900-\u097F]/.test(text[matchStart])) {
          matchStart++;
        }
        // Strip trailing non-alphanumeric
        if (matchEnd > matchStart && /[^a-zA-Z0-9\u0900-\u097F]/.test(text[matchEnd - 1])) {
          matchEnd--;
        }

        const orig = mapNormalizedSpanToOriginal(
          normalized.offsetMap,
          matchStart,
          matchEnd,
          normalized.originalText.length
        );

        let tokenIndex = 0;
        for (let i = 0; i < normalized.tokens.length; i++) {
          if (normalized.tokens[i].start >= matchStart) {
            tokenIndex = i;
            break;
          }
        }

        hits.push({
          groupId: group.id,
          word: rawWord,
          start: matchStart,
          end: matchEnd,
          origStart: orig.start,
          origEnd: orig.end,
          tokenIndex,
        });
      }
    }
  }

  return hits;
}

/**
 * Checks for restricted brands in copy (used by CG-003, CG-004, CG-005).
 */
function findBrandMatches(
  brands: string[],
  normalized: NormalizedText
): GroupMatchHit[] {
  const hits: GroupMatchHit[] = [];
  const text = normalized.normalizedText;

  for (const rawBrand of brands) {
    const normBrand = normalizeDraft(rawBrand).normalizedText.trim();
    if (!normBrand) continue;

    const pattern = new RegExp(`(?:^|[^a-zA-Z0-9\u0900-\u097F])${escapeRegExp(normBrand)}(?:$|[^a-zA-Z0-9\u0900-\u097F])`, "gi");
    let m: RegExpExecArray | null;

    while ((m = pattern.exec(text)) !== null) {
      let matchStart = m.index;
      let matchEnd = m.index + m[0].length;
      if (/[^a-zA-Z0-9\u0900-\u097F]/.test(text[matchStart])) matchStart++;
      if (matchEnd > matchStart && /[^a-zA-Z0-9\u0900-\u097F]/.test(text[matchEnd - 1])) matchEnd--;

      const orig = mapNormalizedSpanToOriginal(
        normalized.offsetMap,
        matchStart,
        matchEnd,
        normalized.originalText.length
      );

      let tokenIndex = 0;
      for (let i = 0; i < normalized.tokens.length; i++) {
        if (normalized.tokens[i].start >= matchStart) {
          tokenIndex = i;
          break;
        }
      }

      hits.push({
        groupId: "RESTRICTED_BRAND",
        word: rawBrand,
        start: matchStart,
        end: matchEnd,
        origStart: orig.start,
        origEnd: orig.end,
        tokenIndex,
      });
    }
  }

  return hits;
}

/**
 * Evaluates active safe blockers in the draft text.
 */
function findSafeBlockers(
  safeBlockers: SafeBlocker[],
  normalized: NormalizedText
): { blocker: SafeBlocker; start: number; end: number }[] {
  const activeBlockers: { blocker: SafeBlocker; start: number; end: number }[] = [];
  const rawTextLower = normalized.originalText.toLowerCase();
  const normText = normalized.normalizedText;

  for (const sb of safeBlockers) {
    const phraseLower = sb.phrase.toLowerCase();
    const phraseNorm = normalizeDraft(sb.phrase).normalizedText.trim();

    const rawIdx = rawTextLower.indexOf(phraseLower);
    if (rawIdx !== -1) {
      activeBlockers.push({
        blocker: sb,
        start: rawIdx,
        end: rawIdx + phraseLower.length,
      });
      continue;
    }

    const normIdx = normText.indexOf(phraseNorm);
    if (normIdx !== -1) {
      const orig = mapNormalizedSpanToOriginal(
        normalized.offsetMap,
        normIdx,
        normIdx + phraseNorm.length,
        normalized.originalText.length
      );
      activeBlockers.push({
        blocker: sb,
        start: orig.start,
        end: orig.end,
      });
    }
  }

  return activeBlockers;
}

/**
 * Executes Layer 1 Concept Rules evaluation.
 */
export function evaluateConceptRules(normalized: NormalizedText): VernacularFindingV2[] {
  const data = loadVernacularData();
  const findings: VernacularFindingV2[] = [];

  // 1. Precompute all group matches (with code-level overlay words merged)
  const overlayMap = new Map<string, string[]>();
  for (const ov of CONCEPT_GROUPS_OVERLAY) {
    overlayMap.set(ov.groupId, ov.additionalWords);
  }

  const groupHitsMap = new Map<string, GroupMatchHit[]>();
  for (const group of data.conceptGroups) {
    const extraWords = overlayMap.get(group.id) || [];
    const mergedGroup: ConceptGroup = extraWords.length > 0
      ? { ...group, words: [...group.words, ...extraWords] }
      : group;

    const hits = matchGroup(mergedGroup, normalized);
    if (hits.length > 0) {
      groupHitsMap.set(group.id, hits);
    }
  }

  // Precompute safe blockers in copy
  const activeBlockers = findSafeBlockers(data.safeBlockers, normalized);

  let findingCounter = 0;

  // 2. Evaluate each combination rule
  for (const rule of data.combinationRules) {
    // Special handling for CG-016 (URGENCY standalone or TIMER_PATTERNS)
    if (rule.id === "CG-016") {
      const urgencyHits = groupHitsMap.get("URGENCY") || [];
      const timerHits = groupHitsMap.get("TIMER_PATTERNS") || [];

      const triggered = urgencyHits.length >= 2 || timerHits.length >= 1;
      if (triggered) {
        const allHits = [...urgencyHits, ...timerHits];
        const minStart = Math.min(...allHits.map((h) => h.origStart));
        const maxEnd = Math.max(...allHits.map((h) => h.origEnd));
        const statute = getStatute(rule.statute_id);

        let status: "violation" | "review" = "violation";
        if (rule.severity === "WARNING" || rule.confidence === "medium") {
          status = "review";
        }

        // Check safe blockers
        if (activeBlockers.length > 0) {
          status = "review";
        }

        const spanText = normalized.originalText.substring(minStart, maxEnd);
        findings.push({
          id: `fnd_cg_${++findingCounter}`,
          ruleId: rule.id,
          category: rule.category,
          rule_code: rule.rule_code,
          statute_id: rule.statute_id,
          statute_name: statute ? statute.name : rule.statute_id,
          provision: statute ? statute.provision : "",
          receipt_a: {
            text: spanText || normalized.originalText,
            start: minStart,
            end: maxEnd,
          },
          receipt_b: {
            quote: statute && statute.quote_verified
              ? statute.verbatim_excerpt
              : `Excerpt pending verification (${statute?.name || rule.statute_id}, ${statute?.provision || ""})`,
            verified: statute?.quote_verified ?? false,
            source: statute?.name || rule.statute_id,
          },
          status,
          source: "concept_rule",
          severity: (rule.severity as "CRITICAL" | "WARNING" | "INFO") || "WARNING",
          confidence: rule.confidence,
          explanation: rule.note || "Multiple high-pressure urgency triggers or countdown timer detected.",
          suggested_fix: "Remove artificial countdown clock and replace with verifiable campaign dates.",
          penalty_inr: 1000000,
          matched_groups: ["URGENCY"],
        });
      }
      continue;
    }

    // Brand rules (CG-003, CG-004, CG-005)
    if (rule.restricted_brand_required) {
      const brands = rule.restricted_brands || [];
      const brandHits = findBrandMatches(brands, normalized);

      if (brandHits.length > 0) {
        // Check required companion groups (e.g. ALCOHOL_HINT or TOBACCO_HINT)
        let companionMatched = false;
        const matchedCompanionHits: GroupMatchHit[] = [];

        for (const reqGroup of rule.requires_all_of) {
          const hits = groupHitsMap.get(reqGroup) || [];
          if (hits.length > 0) {
            companionMatched = true;
            matchedCompanionHits.push(...hits);
          }
        }

        // Check if brand is accompanied by an innocuous commodity extension (direct surrogate)
        const innocentHits = groupHitsMap.get("INNOCENT_PRODUCT") || [];
        if (innocentHits.length > 0) {
          companionMatched = true;
          matchedCompanionHits.push(...innocentHits);
        }

        for (const bHit of brandHits) {
          const statute = getStatute(rule.statute_id);

          if (companionMatched) {
            // Brand + Hint group = VIOLATION
            const allHits = [bHit, ...matchedCompanionHits];
            const minStart = Math.min(...allHits.map((h) => h.origStart));
            const maxEnd = Math.max(...allHits.map((h) => h.origEnd));
            const spanText = normalized.originalText.substring(minStart, maxEnd);

            findings.push({
              id: `fnd_cg_${++findingCounter}`,
              ruleId: rule.id,
              category: rule.category,
              rule_code: rule.rule_code,
              statute_id: rule.statute_id,
              statute_name: statute ? statute.name : rule.statute_id,
              provision: statute ? statute.provision : "",
              receipt_a: {
                text: spanText,
                start: minStart,
                end: maxEnd,
              },
              receipt_b: {
                quote: statute && statute.quote_verified
                  ? statute.verbatim_excerpt
                  : `Excerpt pending verification (${statute?.name || rule.statute_id}, ${statute?.provision || ""})`,
                verified: statute?.quote_verified ?? false,
                source: statute?.name || rule.statute_id,
              },
              status: "violation",
              source: "concept_rule",
              severity: "CRITICAL",
              confidence: "high",
              explanation: `Restricted brand '${bHit.word}' coupled with surrogate consumption cues.`,
              suggested_fix: "Remove restricted brand trademark from commodity extension.",
              legal_caveat: rule.legal_caveat,
              penalty_inr: 1000000,
              matched_groups: ["RESTRICTED_BRAND", ...rule.requires_all_of],
            });
          } else {
            // Brand alone without hint group = REVIEW with legal caveat
            findings.push({
              id: `fnd_cg_${++findingCounter}`,
              ruleId: rule.id,
              category: rule.category,
              rule_code: rule.rule_code,
              statute_id: rule.statute_id,
              statute_name: statute ? statute.name : rule.statute_id,
              provision: statute ? statute.provision : "",
              receipt_a: {
                text: normalized.originalText.substring(bHit.origStart, bHit.origEnd),
                start: bHit.origStart,
                end: bHit.origEnd,
              },
              receipt_b: {
                quote: statute && statute.quote_verified
                  ? statute.verbatim_excerpt
                  : `Excerpt pending verification (${statute?.name || rule.statute_id}, ${statute?.provision || ""})`,
                verified: statute?.quote_verified ?? false,
                source: statute?.name || rule.statute_id,
              },
              status: "review",
              source: "concept_rule",
              severity: "WARNING",
              confidence: "medium",
              explanation: `Brand name '${bHit.word}' detected without direct restricted consumption cues.`,
              legal_caveat: rule.legal_caveat || "CCPA 2022 cl.6 proviso: brand name alone is not surrogate advertising unless the ad is otherwise objectionable",
              penalty_inr: 500000,
              matched_groups: ["RESTRICTED_BRAND"],
            });
          }
        }
      }
      continue;
    }

    // Standard multi-group combination rules
    const reqGroups = rule.requires_all_of;
    let allMatched = true;
    const requiredHits: Record<string, GroupMatchHit[]> = {};

    for (const gid of reqGroups) {
      const hits = groupHitsMap.get(gid) || [];
      if (hits.length === 0) {
        allMatched = false;
        break;
      }
      requiredHits[gid] = hits;
    }

    if (!allMatched) continue;

    // Check exclude groups: if rule excludes MONEY_GAIN_WEAK, ensure strong MONEY_GAIN hit exists
    if (rule.exclude_groups && rule.exclude_groups.includes("MONEY_GAIN_WEAK")) {
      const strongHits = (requiredHits["MONEY_GAIN"] || []).filter(
        (h) => !["double", "cash", "returns", "profit", "yield"].includes(h.word.toLowerCase())
      );
      if (strongHits.length === 0) {
        // Only weak words present, skip firing
        continue;
      }
    }

    // Anchor group & proximity matching
    const anchorGroup = (rule.anchor_group && requiredHits[rule.anchor_group]?.length)
      ? rule.anchor_group
      : reqGroups[0];
    const anchorHits = requiredHits[anchorGroup] || [];

    for (const aHit of anchorHits) {
      let proximitySatisfied = true;
      const matchedSpanHits: GroupMatchHit[] = [aHit];

      for (const gid of reqGroups) {
        if (gid === anchorGroup) continue;
        const otherHits = requiredHits[gid] || [];
        // Check if any hit is within token distance (relaxed to max(within_words, 12))
        const maxDist = Math.max(rule.within_words, 12);
        const closeHit = otherHits.find(
          (oh) => Math.abs(oh.tokenIndex - aHit.tokenIndex) <= maxDist
        );

        if (!closeHit) {
          proximitySatisfied = false;
          break;
        }
        matchedSpanHits.push(closeHit);
      }

      if (proximitySatisfied) {
        const minStart = Math.min(...matchedSpanHits.map((h) => h.origStart));
        const maxEnd = Math.max(...allSpanOrigEnds(matchedSpanHits));
        const spanText = normalized.originalText.substring(minStart, maxEnd);
        const statute = getStatute(rule.statute_id);

        let status: "violation" | "review" = rule.severity === "CRITICAL" ? "violation" : "review";
        let severity: "CRITICAL" | "WARNING" | "INFO" = (rule.severity as "CRITICAL" | "WARNING" | "INFO") || "WARNING";

        // Check Safe Blockers interaction:
        // "Safe blockers may downgrade severity to 'review' but must NEVER suppress a match
        // involving a group listed in cannot_override_groups."
        if (activeBlockers.length > 0) {
          const involvedGroups = new Set(matchedSpanHits.map((h) => h.groupId));
          const hasUnoverridable = [...involvedGroups].some((g) => data.cannotOverrideGroups.has(g));

          if (!hasUnoverridable) {
            // Downgrade to review
            status = "review";
            severity = "WARNING";
          }
        }

        findings.push({
          id: `fnd_cg_${++findingCounter}`,
          ruleId: rule.id,
          category: rule.category,
          rule_code: rule.rule_code,
          statute_id: rule.statute_id,
          statute_name: statute ? statute.name : rule.statute_id,
          provision: statute ? statute.provision : "",
          receipt_a: {
            text: spanText,
            start: minStart,
            end: maxEnd,
          },
          receipt_b: {
            quote: statute && statute.quote_verified
              ? statute.verbatim_excerpt
              : `Excerpt pending verification (${statute?.name || rule.statute_id}, ${statute?.provision || ""})`,
            verified: statute?.quote_verified ?? false,
            source: statute?.name || rule.statute_id,
          },
          status,
          source: "concept_rule",
          severity,
          confidence: rule.confidence,
          explanation: rule.note || `Co-occurrence of ${reqGroups.join(" + ")} violates statutory rules.`,
          penalty_inr: rule.severity === "CRITICAL" ? 1000000 : 500000,
          matched_groups: matchedSpanHits.map((h) => h.groupId),
        });

        // Break on this rule once fired for this anchor span to avoid redundant duplicate spans
        break;
      }
    }
  }

  return findings;
}

function allSpanOrigEnds(hits: GroupMatchHit[]): number[] {
  return hits.map((h) => h.origEnd);
}
