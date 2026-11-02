/**
 * Layer 2: Vernacular Similarity Engine
 * Lightweight character n-gram (3 to 5) TF-IDF inverted index with sparse L2-norm
 * cosine similarity. Operates over sliding windows and full draft.
 * Includes script-bias lexical overlap guard for non-Latin Indic scripts.
 * Deterministic, reproducible, zero heavy ML runtime dependencies.
 */

import {
  NormalizedText,
  SimilarityFinding,
  ExemplarEntry,
} from "./types";
import { loadVernacularData, getStatute } from "./dataLoader";
import { mapNormalizedSpanToOriginal } from "./normalize";

// Thresholds selected on tune split (see docs/VERNACULAR_THRESHOLDS.md)
export const SIMILARITY_HIGH = 0.40;
export const SIMILARITY_LOW = 0.22;

interface SparseVector {
  [gram: string]: number;
}

interface IndexedExemplar {
  entry: ExemplarEntry;
  vector: SparseVector;
  norm: number;
}

interface Posting {
  docIdx: number;
  weight: number;
}

interface SimilarityCache {
  indexed: IndexedExemplar[];
  idf: { [gram: string]: number };
  invertedIndex: Map<string, Posting[]>;
}

// Module-level cached inverted index
let cachedIndex: SimilarityCache | null = null;

// Generic transactional/application tokens across scripts that must not drive violation matches alone
const GENERIC_TRANSACTIONAL_TOKENS = new Set([
  // Latin / English
  "app", "download", "today", "now", "offer", "special", "and", "with", "for", "the", "get", "our", "new", "free", "link",
  // Bengali
  "আজই", "আমাদের", "অ্যাপ", "ডাউনলোড", "করুন", "এবং", "আর", "এর", "থেকে", "এই", "পান", "নতুন", "সীমিত", "সময়ের",
  // Devanagari
  "आज", "ही", "ऐप", "डाउनलोड", "करें", "और", "का", "की", "के", "से", "में", "पर", "पायें", "नया", "नए", "सीमित", "समय",
  // Tamil
  "இன்றே", "பதிவிறக்கவும்", "மற்றும்", "செயலி", "புதிய", "பெறுங்கள்"
]);

function getDistinctiveTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/);
  return new Set(words.filter(w => w.length >= 2 && !GENERIC_TRANSACTIONAL_TOKENS.has(w)));
}

/**
 * Script-bias guard:
 * For non-Latin Indic scripts (Bengali, Devanagari, Tamil, etc.), character n-grams from
 * shared script morphology, inflectional affixes, and common UI terms ("app", "download")
 * can cause false matches if substantive domain words are disjoint.
 * Requires at least one distinctive content token overlap beyond generic script boilerplate.
 */
function hasSubstantiveLexicalOverlap(queryText: string, exemplarText: string): boolean {
  const isNonLatin = /[\u0900-\u0DFF]/.test(queryText) || /[\u0900-\u0DFF]/.test(exemplarText);
  if (!isNonLatin) {
    // Latin / Hinglish text already has balanced corpus frequency
    return true;
  }

  const qWords = getDistinctiveTokens(queryText);
  const exWords = getDistinctiveTokens(exemplarText);

  for (const w of qWords) {
    if (exWords.has(w)) {
      return true;
    }
  }
  return false;
}

function extractCharNgrams(text: string): { [gram: string]: number } {
  const counts: { [gram: string]: number } = {};
  const len = text.length;

  for (let n = 3; n <= 5; n++) {
    for (let i = 0; i <= len - n; i++) {
      const gram = text.substring(i, i + n);
      counts[gram] = (counts[gram] || 0) + 1;
    }
  }

  return counts;
}

function getOrBuildIndex(): SimilarityCache {
  if (cachedIndex) return cachedIndex;

  const data = loadVernacularData();
  const entries = data.exemplars;
  const N = entries.length;

  // 1. Compute document frequency for each n-gram across all exemplars
  const df: { [gram: string]: number } = {};
  const docNgrams: { entry: ExemplarEntry; counts: { [gram: string]: number } }[] = [];

  for (const entry of entries) {
    const counts = extractCharNgrams(entry.text.toLowerCase());
    docNgrams.push({ entry, counts });

    for (const gram of Object.keys(counts)) {
      df[gram] = (df[gram] || 0) + 1;
    }
  }

  // 2. Compute smoothed IDF: ln((1 + N) / (1 + df)) + 1
  const idf: { [gram: string]: number } = {};
  for (const [gram, count] of Object.entries(df)) {
    idf[gram] = Math.log((1 + N) / (1 + count)) + 1;
  }

  // 3. Compute TF-IDF sparse vector and L2 norm for each exemplar
  const indexed: IndexedExemplar[] = docNgrams.map(({ entry, counts }) => {
    const vector: SparseVector = {};
    let normSq = 0;

    for (const [gram, count] of Object.entries(counts)) {
      const weight = count * (idf[gram] || 1);
      vector[gram] = weight;
      normSq += weight * weight;
    }

    return {
      entry,
      vector,
      norm: Math.sqrt(normSq) || 1,
    };
  });

  // 4. Build inverted index mapping gram -> Posting[]
  const invertedIndex = new Map<string, Posting[]>();
  for (let docIdx = 0; docIdx < indexed.length; docIdx++) {
    const item = indexed[docIdx];
    for (const [gram, weight] of Object.entries(item.vector)) {
      let postings = invertedIndex.get(gram);
      if (!postings) {
        postings = [];
        invertedIndex.set(gram, postings);
      }
      postings.push({ docIdx, weight });
    }
  }

  cachedIndex = { indexed, idf, invertedIndex };
  return cachedIndex;
}

interface WindowCandidate {
  normStart: number;
  normEnd: number;
  score: number;
  matchedExemplar: ExemplarEntry;
  isSafe: boolean;
}

/**
 * Runs Layer 2 Similarity over sliding windows and full draft.
 * Returns SimilarityFinding[] — compatible with the orchestrator and UI adapter.
 */
export function runSimilarityLayer(
  rawText: string,
  normalized: NormalizedText
): SimilarityFinding[] {
  if (!rawText || !normalized.normalizedText.trim()) return [];

  const { indexed, idf, invertedIndex } = getOrBuildIndex();
  const tokens = normalized.tokens;
  const numTokens = tokens.length;

  const windowSpans: { normStart: number; normEnd: number }[] = [];

  // Sliding windows of 3 to 8 words
  for (let w = 3; w <= 8; w++) {
    for (let i = 0; i <= numTokens - w; i++) {
      windowSpans.push({
        normStart: tokens[i].start,
        normEnd: tokens[i + w - 1].end,
      });
    }
  }

  // Also include full normalized text if there are tokens
  if (numTokens >= 1) {
    windowSpans.push({
      normStart: tokens[0].start,
      normEnd: tokens[numTokens - 1].end,
    });
  }

  // Score each window against exemplars using inverted index
  const candidates: WindowCandidate[] = [];
  const docDots = new Float64Array(indexed.length);

  for (const span of windowSpans) {
    const spanText = normalized.normalizedText.substring(span.normStart, span.normEnd);
    if (spanText.trim().length < 8) continue;

    const queryCounts = extractCharNgrams(spanText);

    // Reset accumulator
    docDots.fill(0);
    let queryNormSq = 0;

    for (const [gram, count] of Object.entries(queryCounts)) {
      const qWeight = count * (idf[gram] || 1);
      queryNormSq += qWeight * qWeight;

      const postings = invertedIndex.get(gram);
      if (postings) {
        for (let p = 0; p < postings.length; p++) {
          docDots[postings[p].docIdx] += qWeight * postings[p].weight;
        }
      }
    }

    if (queryNormSq === 0) continue;
    const queryNorm = Math.sqrt(queryNormSq);

    let bestScore = -1;
    let bestExemplar: ExemplarEntry | null = null;

    for (let d = 0; d < indexed.length; d++) {
      const dot = docDots[d];
      if (dot <= 0) continue;

      let sim = dot / (queryNorm * indexed[d].norm);

      // Script-bias guard: if exemplar is a violation and non-Latin script,
      // require substantive lexical overlap beyond generic boilerplate
      if (indexed[d].entry.label === "violation") {
        if (!hasSubstantiveLexicalOverlap(spanText, indexed[d].entry.text)) {
          sim = 0; // Reject script-only collision
        }
      }

      if (sim > bestScore) {
        bestScore = sim;
        bestExemplar = indexed[d].entry;
      }
    }

    if (bestScore >= SIMILARITY_LOW && bestExemplar) {
      candidates.push({
        normStart: span.normStart,
        normEnd: span.normEnd,
        score: Math.min(1.0, Math.max(0, bestScore)),
        matchedExemplar: bestExemplar,
        isSafe: bestExemplar.label === "safe",
      });
    }
  }

  if (candidates.length === 0) return [];

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  // Non-maximum suppression: skip windows with > 40% overlap with an already selected one
  const selectedCandidates: WindowCandidate[] = [];

  for (const cand of candidates) {
    let overlaps = false;
    for (const sel of selectedCandidates) {
      const startMax = Math.max(cand.normStart, sel.normStart);
      const endMin = Math.min(cand.normEnd, sel.normEnd);
      if (startMax < endMin) {
        const overlapLen = endMin - startMax;
        const candLen = cand.normEnd - cand.normStart;
        if (overlapLen > candLen * 0.4) {
          overlaps = true;
          break;
        }
      }
    }
    if (!overlaps) {
      selectedCandidates.push(cand);
    }
  }

  // Collect high-confidence safe spans to suppress overlapping violations
  const safeSpans = selectedCandidates.filter(c => c.isSafe && c.score >= SIMILARITY_HIGH);

  const filteredCandidates = selectedCandidates.filter(c => {
    if (c.isSafe) return true;
    for (const s of safeSpans) {
      const startMax = Math.max(c.normStart, s.normStart);
      const endMin = Math.min(c.normEnd, s.normEnd);
      if (startMax < endMin) return false; // suppressed by safe exemplar
    }
    return true;
  });

  const findings: SimilarityFinding[] = [];

  for (let idx = 0; idx < filteredCandidates.length; idx++) {
    const c = filteredCandidates[idx];
    const { start: origStart, end: origEnd } = mapNormalizedSpanToOriginal(
      normalized.offsetMap,
      c.normStart,
      c.normEnd,
      rawText.length
    );

    const spanText = rawText.substring(origStart, origEnd);
    const statute = getStatute(c.matchedExemplar.statute_id);

    // Hard Rule: Only show verbatim excerpt if quote_verified === true
    const receiptBQuote =
      statute && statute.quote_verified && statute.verbatim_excerpt
        ? statute.verbatim_excerpt
        : `Excerpt pending verification (${statute?.name ?? c.matchedExemplar.statute}, ${statute?.provision ?? ""})`;

    const isHigh = c.score >= SIMILARITY_HIGH;

    let status: "violation" | "review" | "uncertain" | "safe";
    if (c.isSafe) {
      status = isHigh ? "safe" : "uncertain";
    } else {
      status = isHigh ? "violation" : "uncertain";
    }

    const severity: "CRITICAL" | "WARNING" | "INFO" = c.isSafe
      ? "INFO"
      : isHigh
      ? (c.matchedExemplar.severity as "CRITICAL" | "WARNING" | "INFO") ?? "WARNING"
      : "WARNING";

    findings.push({
      id: `vern-sim-${idx + 1}-${c.matchedExemplar.id}`,
      source: "similarity",
      status,
      category: c.matchedExemplar.category,
      rule_code: c.matchedExemplar.rule_code,
      statute_id: c.matchedExemplar.statute_id,
      receipt_a: {
        text: spanText,
        start: origStart,
        end: origEnd,
      },
      receipt_b: {
        quote: receiptBQuote,
        verified: statute?.quote_verified ?? false,
        source: statute?.name ?? c.matchedExemplar.statute,
      },
      ruleTitle: `${c.matchedExemplar.category.replace(/_/g, " ")} Pattern Match`,
      severity,
      explanation: isHigh
        ? `High-confidence exemplar match (${(c.score * 100).toFixed(1)}%) with curated exemplar ${c.matchedExemplar.id}: "${c.matchedExemplar.explanation}".`
        : `Moderate exemplar similarity (${(c.score * 100).toFixed(1)}%) with ${c.matchedExemplar.id}. Human review recommended.`,
      statutoryCitation: statute
        ? `${statute.name} (${statute.provision})`
        : c.matchedExemplar.statute,
      suggestedCompliantRewrite: c.isSafe
        ? "Compliant brand expression."
        : "Remove prohibited surrogate or misleading vernacular phrasing.",
      statutoryPenaltyExposureInr: c.isSafe ? 0 : 500000,
      score: Number(c.score.toFixed(3)),
      matched_exemplar_id: c.matchedExemplar.id,
      phoneticTrace: `Similarity: ${(c.score * 100).toFixed(1)}% to ${c.matchedExemplar.id} [${c.matchedExemplar.style}]`,
    });
  }

  return findings;
}
