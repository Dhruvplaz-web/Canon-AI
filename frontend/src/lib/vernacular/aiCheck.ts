/**
 * Layer 3: Online AI Client Helper
 * Calls /api/v1/vernacular/ai-check when deterministic and similarity
 * layers produce uncertain findings or require semantic human review.
 */

import { SimilarityFinding } from "./types";
import { getStatute } from "./dataLoader";

const CATEGORY_DEFAULT_STATUTE: Record<string, string> = {
  SURROGATE_ALCOBEV: "STAT-001",
  SURROGATE_TOBACCO: "STAT-002",
  SURROGATE_BETTING: "STAT-003",
  PREDATORY_FINTECH_PROMISE: "STAT-004",
  FALSE_URGENCY_DARK_PATTERN: "STAT-006",
  PROHIBITED_MAGIC_REMEDY: "STAT-007",
};

interface AIFetchFinding {
  span_text: string;
  category: string;
  reason: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Invokes server-side AI evaluation for borderline vernacular copy.
 * Returns SimilarityFinding[] with status "review" and source "ai".
 */
export async function runAICheckLayer(
  rawText: string
): Promise<SimilarityFinding[]> {
  if (!rawText || rawText.trim().length < 5) return [];

  try {
    const res = await fetch("/api/v1/vernacular/ai-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: rawText }),
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.findings)) {
      return [];
    }

    const findings: SimilarityFinding[] = [];

    data.findings.forEach((f: AIFetchFinding, idx: number) => {
      const statuteId = CATEGORY_DEFAULT_STATUTE[f.category] || "STAT-001";
      const statute = getStatute(statuteId);

      // Double-Receipt Verification: span_text must be an exact substring
      const startIndex = rawText.indexOf(f.span_text);
      if (startIndex === -1) return; // Drop hallucinated spans
      const endIndex = startIndex + f.span_text.length;

      // Hard Rule: AI findings ALWAYS get status "review", NEVER "violation"
      // Hard Rule: Receipt B verbatim_excerpt only if quote_verified === true
      const receiptBQuote = statute && statute.quote_verified && statute.verbatim_excerpt
        ? statute.verbatim_excerpt
        : `Excerpt pending verification (${statute?.name ?? "Applicable Statute"}, ${statute?.provision ?? ""})`;

      findings.push({
        id: `vern-ai-${idx + 1}-${Date.now().toString(36)}`,
        source: "ai",
        status: "review", // HARD RULE: AI findings are always "review"
        category: f.category,
        rule_code: `${f.category.substring(0, 4)}-AI-REV`,
        statute_id: statuteId,
        receipt_a: {
          text: f.span_text,
          start: startIndex,
          end: endIndex,
        },
        receipt_b: {
          quote: receiptBQuote,
          verified: statute?.quote_verified ?? false,
          source: statute?.name ?? "AI-assisted review",
        },
        ruleTitle: `${f.category.replace(/_/g, " ")} (AI Review Flag)`,
        severity: "WARNING",
        explanation: `${f.reason} — AI-assisted analysis: human review required.`,
        statutoryCitation: statute
          ? `${statute.name} (${statute.provision})`
          : "Applicable Indian Advertising Code",
        suggestedCompliantRewrite: "Conduct editorial brand review or rewrite ambiguous colloquial phrasing.",
        statutoryPenaltyExposureInr: 250000,
        score: Number(Math.max(0, Math.min(1, f.confidence)).toFixed(3)),
        phoneticTrace: "Layer 3 Online Semantic Classifier",
      });
    });

    return findings;
  } catch {
    // Graceful silent fallback on network errors or timeouts
    return [];
  }
}
