/**
 * Vernacular Matcher Orchestrator & UI Adapter
 * Coordinates Layer 0 (Normalization), Layer 1 (Deterministic AST Concept Rules),
 * Layer 2 (Sliding Window Character N-gram TF-IDF Similarity), and Layer 3 (Online AI).
 * Provides full backward compatibility with the existing Vernacular Audit Studio UI.
 */

import {
  NormalizedText,
  VernacularFindingV2,
  SimilarityFinding,
  VernacularMatchResult,
} from "./types";
import { normalizeDraft } from "./normalize";
import { evaluateConceptRules } from "./conceptRules";
import { runSimilarityLayer, SIMILARITY_HIGH } from "./similarity";
import { runAICheckLayer } from "./aiCheck";
import { loadVernacularData, getStatute } from "./dataLoader";
import {
  VernacularAuditReport,
  VernacularFinding,
  VernacularCategory,
} from "@/features/submissions/vernacular/vernacularTypes";
import { generateCompliantIndianRewrite } from "@/features/submissions/vernacular/vernacularAuditEngine";

/**
 * Fast-path check: If copy is pure standard ASCII English with no Indic scripts,
 * no restricted brands, and no vernacular concept keywords, bypass heavy layers.
 */
export function fastPathEnglishCheck(rawText: string): boolean {
  if (!rawText || !rawText.trim()) return true;

  // 1. Check for Indic Unicode scripts (Devanagari, Bengali, Tamil, etc.)
  if (/[\u0900-\u0D7F]/.test(rawText)) return false;

  const lower = rawText.toLowerCase();
  const data = loadVernacularData();

  // 2. Check for restricted brand names
  for (const brandList of Object.values(data.restrictedBrands)) {
    for (const b of brandList) {
      if (lower.includes(b.toLowerCase())) return false;
    }
  }

  // 3. Check for core vernacular trigger keywords
  const triggerKeywords = [
    "paise", "rupaye", "crore", "lakh", "dhamaka", "asli", "swad", "takat",
    "shahi", "churna", "yantra", "chilled", "soda", "elaichi", "bhai",
    "bazi", "jeet", "kamaye", "munafa", "double", "guarantee", "cure",
    "countdown", "hurry", "expire", "only left", "timer",
    "ilaj", "ilaaj", "shartiya", "khatam", "motapa", "bina", "jad",
    "hai", "aur", "karo", "karein", "yeh",
  ];

  for (const kw of triggerKeywords) {
    if (lower.includes(kw)) return false;
  }

  return true;
}

export interface MatcherOptions {
  enableAI?: boolean;
}

// Groups where safe-blocker suppression is disabled (cannot_override_groups from data)
const UNSUPPRESSABLE_GROUPS = new Set([
  "GUARANTEE", "CURE_CLAIM", "MONEY_GAIN",
]);

/**
 * Synchronous execution of Layers 0, 1, and 2.
 */
export function matchVernacularDraftSync(rawText: string): VernacularMatchResult {
  const startTime = Date.now();
  const emptyResult = (): VernacularMatchResult => ({
    originalText: rawText ?? "",
    normalizedText: "",
    findings: [],
    similarityFindings: [],
    summary: { total: 0, violations: 0, reviews: 0, uncertain: 0, safe: 0, safeSuppressed: 0 },
    timingMs: 0,
    layerBreakdown: { layer1Count: 0, layer2Count: 0, layer3Count: 0 },
  });

  if (!rawText || !rawText.trim()) return emptyResult();

  // Fast path
  if (fastPathEnglishCheck(rawText)) {
    const norm = normalizeDraft(rawText);
    return {
      ...emptyResult(),
      normalizedText: norm.normalizedText,
      timingMs: Math.max(1, Date.now() - startTime),
    };
  }

  // Layer 0: Normalization
  const normalized: NormalizedText = normalizeDraft(rawText);

  // Layer 1: Deterministic Concept Rules (returns VernacularFindingV2[])
  const layer1Findings: VernacularFindingV2[] = evaluateConceptRules(normalized);

  // Layer 2: Sliding Window TF-IDF Similarity (returns SimilarityFinding[])
  const layer2Findings: SimilarityFinding[] = runSimilarityLayer(rawText, normalized);

  // Collect safe-suppressor spans from both layers
  const safeSpans = [
    ...layer1Findings
      .filter(f => f.status === "safe")
      .map(f => ({ start: f.receipt_a.start, end: f.receipt_a.end, category: "" })),
    ...layer2Findings
      .filter(f => f.status === "safe" && (f.score ?? 0) >= SIMILARITY_HIGH)
      .map(f => ({ start: f.receipt_a.start, end: f.receipt_a.end, category: "" })),
  ];

  // Helper: spans overlap?
  const overlaps = (
    aStart: number, aEnd: number,
    bStart: number, bEnd: number
  ) => Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

  // Helper: is this span suppressed by a safe blocker?
  const isSuppressed = (
    start: number, end: number, category: string
  ): boolean => {
    if (UNSUPPRESSABLE_GROUPS.has(category)) return false;
    return safeSpans.some(s => overlaps(start, end, s.start, s.end));
  };

  let safeSuppressedCount = 0;
  const finalLayer1: VernacularFindingV2[] = [];

  // Filter Layer 1 findings
  for (const f of layer1Findings) {
    if (f.status === "safe") continue;
    if (isSuppressed(f.receipt_a.start, f.receipt_a.end, f.category)) {
      safeSuppressedCount++;
      continue;
    }
    // Enrich with Layer 2 score if an overlapping similarity match exists
    const overlappingL2 = layer2Findings.find(
      l2 => overlaps(f.receipt_a.start, f.receipt_a.end, l2.receipt_a.start, l2.receipt_a.end)
    );
    if (overlappingL2 && overlappingL2.score !== undefined) {
      finalLayer1.push({ ...f, score: overlappingL2.score });
    } else {
      finalLayer1.push(f);
    }
  }

  // Filter Layer 2 findings: exclude if already covered by Layer 1 on same span
  const finalLayer2: SimilarityFinding[] = [];
  for (const f of layer2Findings) {
    if (f.status === "safe") continue;
    const coveredByL1 = finalLayer1.some(
      l1 => overlaps(f.receipt_a.start, f.receipt_a.end, l1.receipt_a.start, l1.receipt_a.end)
    );
    if (coveredByL1) continue;
    if (isSuppressed(f.receipt_a.start, f.receipt_a.end, f.category)) {
      safeSuppressedCount++;
      continue;
    }
    finalLayer2.push(f);
  }

  const allConceptFindings = [...finalLayer1];
  const allSimilarityFindings = [...finalLayer2];

  const totalFindings = allConceptFindings.length + allSimilarityFindings.length;
  const violationsCount = allConceptFindings.filter(f => f.status === "violation").length
    + allSimilarityFindings.filter(f => f.status === "violation").length;
  const reviewsCount = allConceptFindings.filter(f => f.status === "review").length
    + allSimilarityFindings.filter(f => f.status === "review").length;
  const uncertainCount = allSimilarityFindings.filter(f => f.status === "uncertain").length;

  return {
    originalText: rawText,
    normalizedText: normalized.normalizedText,
    findings: allConceptFindings,
    similarityFindings: allSimilarityFindings,
    summary: {
      total: totalFindings,
      violations: violationsCount,
      reviews: reviewsCount,
      uncertain: uncertainCount,
      safe: safeSpans.length,
      safeSuppressed: safeSuppressedCount,
    },
    timingMs: Math.max(1, Date.now() - startTime),
    layerBreakdown: {
      layer1Count: layer1Findings.filter(f => f.status !== "safe").length,
      layer2Count: layer2Findings.filter(f => f.status !== "safe").length,
      layer3Count: 0,
    },
  };
}

/**
 * Asynchronous orchestrator with optional Layer 3 Online AI for uncertain spans.
 */
export async function matchVernacularDraft(
  rawText: string,
  options?: MatcherOptions
): Promise<VernacularMatchResult> {
  const baseResult = matchVernacularDraftSync(rawText);

  if (!options?.enableAI) return baseResult;

  const hasUncertain = baseResult.similarityFindings.some(f => f.status === "uncertain");
  const isEligibleForAI =
    hasUncertain ||
    (baseResult.summary.total === 0 && !fastPathEnglishCheck(rawText));

  if (!isEligibleForAI) return baseResult;

  const aiFindings = await runAICheckLayer(rawText);
  if (aiFindings.length === 0) return baseResult;

  // Replace uncertain similarity findings with AI review findings
  const updatedSimilarity = [
    ...baseResult.similarityFindings.filter(f => f.status !== "uncertain"),
    ...aiFindings,
  ];

  return {
    ...baseResult,
    similarityFindings: updatedSimilarity,
    summary: {
      ...baseResult.summary,
      total: baseResult.findings.length + updatedSimilarity.length,
      reviews: baseResult.findings.filter(f => f.status === "review").length
        + updatedSimilarity.filter(f => f.status === "review").length,
      uncertain: updatedSimilarity.filter(f => f.status === "uncertain").length,
    },
    layerBreakdown: {
      ...baseResult.layerBreakdown,
      layer3Count: aiFindings.length,
    },
  };
}

/**
 * UI Adapter: maps VernacularMatchResult to the exact VernacularAuditReport
 * format expected by VernacularAuditStudio.tsx (v1 field names).
 */
export function auditVernacularCopyV2(rawText: string): VernacularAuditReport {
  const matchResult = matchVernacularDraftSync(rawText);
  const detectedCategoriesSet = new Set<VernacularCategory>();
  let totalExposure = 0;
  const uiFindings: VernacularFinding[] = [];
  const data = loadVernacularData();

  // Map Layer 1 concept rule findings
  for (let i = 0; i < matchResult.findings.length; i++) {
    const f = matchResult.findings[i];
    if (f.status === "safe") continue;

    const cat = f.category as VernacularCategory;
    detectedCategoriesSet.add(cat);
    const penalty = f.penalty_inr;
    totalExposure += penalty;

    const isBrandOnly = Boolean(
      (f.matched_groups?.length === 1 && f.matched_groups[0] === "RESTRICTED_BRAND") ||
      (f.legal_caveat && f.status === "review")
    );

    const isQuoteVerified = f.receipt_b.verified;

    // Receipt B quote per specifications:
    // 1. Brand-only matches: show CCPA 2022 cl. 6 proviso text
    // 2. Unverified quotes: "Excerpt pending verification (Statute, Provision)"
    // 3. Verified quotes: verbatim excerpt
    let receiptBQuote = f.receipt_b.quote;
    if (isBrandOnly) {
      receiptBQuote = f.legal_caveat || "CCPA 2022 cl.6 proviso: brand name alone is not surrogate advertising unless the ad is otherwise objectionable";
    } else if (!isQuoteVerified) {
      receiptBQuote = `Excerpt pending verification (${f.statute_name || "Applicable Statute"}${f.provision ? `, ${f.provision}` : ""})`;
    }

    const matchedExemplar = f.nearest_exemplar_id
      ? data.exemplars.find(e => e.id === f.nearest_exemplar_id)
      : undefined;

    uiFindings.push({
      id: f.id,
      sourceTextSpan: f.receipt_a.text,
      startIndex: f.receipt_a.start,
      endIndex: f.receipt_a.end,
      category: cat,
      severity: f.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
      statutoryCitation: f.statute_name + (f.provision ? `, ${f.provision}` : ""),
      ruleTitle: f.rule_code,
      ruleCode: f.rule_code,
      detectedViolationExplanation: f.explanation,
      suggestedCompliantRewrite: f.suggested_fix ?? "Review and rewrite this phrasing.",
      statutoryPenaltyExposureInr: penalty,
      status: f.status,
      sourceTag: "rule",
      statuteName: f.statute_name,
      provision: f.provision,
      quoteVerified: isQuoteVerified,
      isBrandOnly,
      legalCaveat: f.legal_caveat,
      score: f.score ?? 1.0,
      receiptA: {
        text: f.receipt_a.text,
        start: f.receipt_a.start,
        end: f.receipt_a.end,
      },
      receiptB: {
        quote: receiptBQuote,
        verified: isQuoteVerified,
        source: f.receipt_b.source,
        matchedExemplarText: matchedExemplar?.text,
      },
      matchedExemplarText: matchedExemplar?.text,
      phoneticTrace: f.legal_caveat
        ? { original: f.receipt_a.text, canonical: f.legal_caveat, steps: [] }
        : undefined,
      bipartiteEntityMatch: f.matched_groups?.includes("RESTRICTED_BRAND")
        ? {
            masterBrand: "LINKED_ENTITY",
            innocuousExtension: f.receipt_a.text,
            surrogateCategory: cat,
          }
        : undefined,
    });
  }

  // Map Layer 2 similarity findings
  for (let i = 0; i < matchResult.similarityFindings.length; i++) {
    const f = matchResult.similarityFindings[i];
    if (f.status === "safe") continue;

    const cat = f.category as VernacularCategory;
    detectedCategoriesSet.add(cat);
    const penalty = f.statutoryPenaltyExposureInr;
    totalExposure += penalty;

    const statute = f.statute_id ? getStatute(f.statute_id) : undefined;
    const isQuoteVerified = f.receipt_b.verified;
    const isAI = f.source === "ai";

    let receiptBQuote = f.receipt_b.quote;
    if (isAI) {
      receiptBQuote = "AI-assisted, human review required";
    } else if (!isQuoteVerified) {
      receiptBQuote = `Excerpt pending verification (${statute?.name || f.statutoryCitation}${statute?.provision ? `, ${statute.provision}` : ""})`;
    }

    const matchedExemplar = f.matched_exemplar_id
      ? data.exemplars.find(e => e.id === f.matched_exemplar_id)
      : undefined;

    uiFindings.push({
      id: f.id,
      sourceTextSpan: f.receipt_a.text,
      startIndex: f.receipt_a.start,
      endIndex: f.receipt_a.end,
      category: cat,
      severity: f.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
      statutoryCitation: f.statutoryCitation,
      ruleTitle: f.ruleTitle,
      ruleCode: f.rule_code,
      detectedViolationExplanation: f.explanation,
      suggestedCompliantRewrite: f.suggestedCompliantRewrite,
      statutoryPenaltyExposureInr: penalty,
      status: f.status,
      sourceTag: isAI ? "AI-assisted" : "embedding",
      statuteName: statute?.name ?? f.statutoryCitation,
      provision: statute?.provision ?? "",
      quoteVerified: isQuoteVerified,
      score: f.score,
      receiptA: {
        text: f.receipt_a.text,
        start: f.receipt_a.start,
        end: f.receipt_a.end,
      },
      receiptB: {
        quote: receiptBQuote,
        verified: isQuoteVerified,
        source: f.receipt_b.source,
        matchedExemplarText: matchedExemplar?.text,
      },
      matchedExemplarText: matchedExemplar?.text,
      phoneticTrace: f.phoneticTrace
        ? { original: f.receipt_a.text, canonical: f.phoneticTrace, steps: [] }
        : undefined,
    });
  }

  // Determine overall status chip: violation > review > clear
  let overallStatus: "violation" | "review" | "clear" = "clear";
  if (uiFindings.some(f => f.status === "violation")) {
    overallStatus = "violation";
  } else if (uiFindings.some(f => f.status === "review")) {
    overallStatus = "review";
  }

  return {
    originalText: rawText,
    normalizedText: matchResult.normalizedText,
    findingsCount: uiFindings.length,
    criticalCount: uiFindings.filter(f => f.severity === "CRITICAL").length,
    totalStatutoryExposureInr: Math.min(totalExposure, 5_000_000),
    detectedCategories: Array.from(detectedCategoriesSet),
    remediatedText: generateCompliantIndianRewrite(rawText),
    findings: uiFindings,
    status: overallStatus,
    offlineMode: false,
  };
}

export interface V2AuditProgress {
  stage: 1 | 2 | 3;
  stageName: string;
  offlineMode: boolean;
}

/**
 * Full Vernacular Matcher v2 Online Pipeline:
 * Stage 1: Layer 0/1 locally (deterministic normalization & concept rules)
 * Stage 2: Layer 2 embed-check (/api/v1/vernacular/embed-check)
 * Stage 3: Layer 3 ai-check for uncertain entries (/api/v1/vernacular/ai-check)
 * If any network stage fails or times out, falls back silently to local layers.
 */
export async function auditVernacularCopyV2Async(
  rawText: string,
  onProgress?: (progress: V2AuditProgress) => void
): Promise<VernacularAuditReport> {
  // 1. Run local layers first (instantaneous baseline)
  const localReport = auditVernacularCopyV2(rawText);

  if (!rawText || !rawText.trim()) {
    return localReport;
  }

  // Fast-path bypass for pure English text with no triggers
  if (fastPathEnglishCheck(rawText)) {
    return localReport;
  }

  onProgress?.({
    stage: 1,
    stageName: "Layer 0/1: Local Deterministic AST Rules",
    offlineMode: false,
  });

  let offlineMode = false;
  const embedFindings: VernacularFinding[] = [];
  let hasUncertain = false;

  // 2. Stage 2: Embeddings check
  try {
    onProgress?.({
      stage: 2,
      stageName: "Layer 2: Multilingual Semantic Embeddings (embed-check)",
      offlineMode: false,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/v1/vernacular/embed-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: rawText }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      throw new Error(`embed-check returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || data.status === "unavailable") {
      throw new Error(data.error || "embed-check unavailable");
    }

    const dataLoader = loadVernacularData();
    const rawEmbFindings = Array.isArray(data.findings) ? data.findings : [];

    for (const ef of rawEmbFindings) {
      if (ef.status === "uncertain") {
        hasUncertain = true;
      }

      const statute = ef.statute_id ? getStatute(ef.statute_id) : undefined;
      const isQuoteVerified = Boolean(ef.receipt_b?.verified);
      const quoteText = isQuoteVerified
        ? ef.receipt_b.quote
        : `Excerpt pending verification (${statute?.name || ef.statutoryCitation || "Statute"}${statute?.provision ? `, ${statute.provision}` : ""})`;

      const matchedExemplar = ef.matched_exemplar_id
        ? dataLoader.exemplars.find(e => e.id === ef.matched_exemplar_id)
        : undefined;

      embedFindings.push({
        id: ef.id,
        sourceTextSpan: ef.receipt_a?.text || rawText,
        startIndex: ef.receipt_a?.start || 0,
        endIndex: ef.receipt_a?.end || rawText.length,
        category: ef.category,
        severity: ef.severity || "WARNING",
        statutoryCitation: ef.statutoryCitation || (statute?.name ?? "Indian Advertising Code"),
        ruleTitle: ef.ruleTitle || `${ef.category} Semantic Match`,
        ruleCode: ef.rule_code || "VERN-EMB-01",
        detectedViolationExplanation: ef.explanation || "Multilingual semantic vector proximity match.",
        suggestedCompliantRewrite: ef.suggestedCompliantRewrite || "Remove vernacular surrogate phrasing.",
        statutoryPenaltyExposureInr: ef.statutoryPenaltyExposureInr || 500000,
        status: ef.status as "violation" | "review" | "uncertain",
        sourceTag: "embedding",
        statuteName: statute?.name ?? ef.statutoryCitation,
        provision: statute?.provision ?? "",
        quoteVerified: isQuoteVerified,
        score: ef.score,
        margin: ef.margin,
        matchedExemplarText: matchedExemplar?.text,
        receiptA: ef.receipt_a,
        receiptB: {
          quote: quoteText,
          verified: isQuoteVerified,
          source: ef.receipt_b?.source,
          matchedExemplarText: matchedExemplar?.text,
        },
      });
    }
  } catch {
    // Network failure or timeout: silently fall back to local layers
    offlineMode = true;
    onProgress?.({
      stage: 2,
      stageName: "Embedding check offline, falling back to local layers",
      offlineMode: true,
    });
    return {
      ...localReport,
      offlineMode: true,
    };
  }

  // 3. Stage 3: AI-check for uncertain entries
  const aiFindings: VernacularFinding[] = [];
  if (hasUncertain || (embedFindings.length === 0 && localReport.findings.length === 0)) {
    try {
      onProgress?.({
        stage: 3,
        stageName: "Layer 3: Online AI Classification (ai-check)",
        offlineMode: false,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("/api/v1/vernacular/ai-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: rawText }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        const data = await res.json();
        const rawAiList = Array.isArray(data.findings) ? data.findings : [];

        for (let i = 0; i < rawAiList.length; i++) {
          const item = rawAiList[i];
          // AI findings: status is ALWAYS "review", NEVER show statute excerpt
          aiFindings.push({
            id: `vern-ai-${i + 1}-${Date.now().toString(36)}`,
            sourceTextSpan: item.span_text,
            startIndex: item.startIndex,
            endIndex: item.endIndex,
            category: item.category,
            severity: "WARNING",
            statutoryCitation: "Applicable Indian Advertising Code",
            ruleTitle: `${item.category.replace(/_/g, " ")} (AI-Assisted Flag)`,
            ruleCode: `${item.category.substring(0, 4)}-AI-REV`,
            detectedViolationExplanation: `${item.reason || "Semantic policy violation flagged."} — AI-assisted, human review required.`,
            suggestedCompliantRewrite: "Conduct editorial review or rewrite ambiguous colloquial phrasing.",
            statutoryPenaltyExposureInr: 250000,
            status: "review",
            sourceTag: "AI-assisted",
            statuteName: "AI-Assisted Classification",
            provision: "",
            quoteVerified: false,
            score: item.confidence,
            receiptA: {
              text: item.span_text,
              start: item.startIndex,
              end: item.endIndex,
            },
            receiptB: {
              quote: "AI-assisted, human review required",
              verified: false,
              source: "AI Online Layer",
            },
          });
        }
      }
    } catch {
      offlineMode = true;
    }
  }

  // Combine findings:
  // - Local deterministic Layer 1 findings are always kept.
  // - Embedding findings: keep violations; if uncertain, replace with AI findings if any exist.
  // - AI findings: always appended with status: "review".
  const mergedFindings: VernacularFinding[] = [...localReport.findings];

  for (const ef of embedFindings) {
    if (ef.status === "violation") {
      // If not already covered by local finding
      const alreadyCovered = mergedFindings.some(
        lf => Math.max(lf.startIndex, ef.startIndex) < Math.min(lf.endIndex, ef.endIndex)
      );
      if (!alreadyCovered) {
        mergedFindings.push(ef);
      }
    } else if (ef.status === "uncertain") {
      // Uncertain entries: if AI flagged any spans, AI findings are used instead
      if (aiFindings.length === 0) {
        // If AI didn't run or found nothing, uncertain entry is deemed clean / or kept as review
      }
    }
  }

  for (const af of aiFindings) {
    const alreadyCovered = mergedFindings.some(
      mf => Math.max(mf.startIndex, af.startIndex) < Math.min(mf.endIndex, af.endIndex)
    );
    if (!alreadyCovered) {
      mergedFindings.push(af);
    }
  }

  // Calculate totals
  const detectedCategories = Array.from(new Set(mergedFindings.map(f => f.category)));
  const totalExposure = mergedFindings.reduce((sum, f) => sum + (f.statutoryPenaltyExposureInr || 0), 0);

  let overallStatus: "violation" | "review" | "clear" = "clear";
  if (mergedFindings.some(f => f.status === "violation")) {
    overallStatus = "violation";
  } else if (mergedFindings.some(f => f.status === "review")) {
    overallStatus = "review";
  }

  return {
    originalText: rawText,
    normalizedText: localReport.normalizedText,
    findingsCount: mergedFindings.length,
    criticalCount: mergedFindings.filter(f => f.severity === "CRITICAL").length,
    totalStatutoryExposureInr: Math.min(totalExposure, 5_000_000),
    detectedCategories,
    remediatedText: generateCompliantIndianRewrite(rawText),
    findings: mergedFindings,
    status: overallStatus,
    offlineMode,
  };
}
