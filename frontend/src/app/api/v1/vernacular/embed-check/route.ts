import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStatute } from "@/lib/vernacular/dataLoader";

// Rate limiter: 30 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count++;
  return true;
}

// Operational thresholds selected on tune split (see docs/VERNACULAR_THRESHOLDS.md)
const T_HIGH = 0.75;
const M_HIGH = 0.02;
const T_LOW = 0.58;

interface StoredEmbedding {
  id: string;
  vector: number[];
}

interface EmbeddingsFile {
  model: string;
  dim: number;
  items: StoredEmbedding[];
}

interface ExemplarEntry {
  id: string;
  label: "violation" | "safe";
  category: string;
  rule_code: string;
  statute_id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  text: string;
  explanation: string;
  statute: string;
}

interface DraftWindow {
  text: string;
  start: number;
  end: number;
}

// Module-level caches
let storedEmbeddings: EmbeddingsFile | null = null;
let exemplarsMap: Map<string, ExemplarEntry> | null = null;

function loadStoredData() {
  if (storedEmbeddings && exemplarsMap) return;

  // Find vernacular_embeddings.json
  const possibleEmbPaths = [
    path.join(process.cwd(), "src/lib/vernacular/data/vernacular_embeddings.json"),
    path.join(process.cwd(), "frontend/src/lib/vernacular/data/vernacular_embeddings.json"),
    path.join(process.cwd(), "data/vernacular_embeddings.json"),
    path.join(process.cwd(), "../data/vernacular_embeddings.json"),
  ];

  for (const p of possibleEmbPaths) {
    if (fs.existsSync(p)) {
      storedEmbeddings = JSON.parse(fs.readFileSync(p, "utf8"));
      break;
    }
  }

  // Find vernacular_exemplars.json
  const possibleExPaths = [
    path.join(process.cwd(), "src/lib/vernacular/data/vernacular_exemplars.json"),
    path.join(process.cwd(), "frontend/src/lib/vernacular/data/vernacular_exemplars.json"),
    path.join(process.cwd(), "data/vernacular_exemplars.json"),
    path.join(process.cwd(), "../data/vernacular_exemplars.json"),
  ];

  for (const p of possibleExPaths) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      exemplarsMap = new Map();
      const list = data.entries || data.exemplars || [];
      for (const item of list) {
        exemplarsMap.set(item.id, item);
      }
      break;
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Deterministic offline dense projection fallback (matching build_vernacular_embeddings.mjs)
function deterministicFallbackEmbed(text: string, dim: number = 768): number[] {
  const vec = new Float64Array(dim);
  const clean = text.toLowerCase().trim();
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= clean.length - n; i++) {
      const sub = clean.substring(i, i + n);
      let h = 0x811c9dc5;
      for (let j = 0; j < sub.length; j++) {
        h = Math.imul(h ^ sub.charCodeAt(j), 0x01000193);
      }
      const idx = Math.abs(h) % dim;
      const sign = (h & 1) === 0 ? 1 : -1;
      vec[idx] += sign * (1.0 / Math.sqrt(n));
    }
  }
  let normSq = 0;
  for (let i = 0; i < dim; i++) normSq += vec[i] * vec[i];
  const norm = Math.sqrt(normSq) || 1;
  const out = new Array<number>(dim);
  for (let i = 0; i < dim; i++) out[i] = Number((vec[i] / norm).toFixed(6));
  return out;
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { success: false, status: "rate_limited", error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // 4-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    loadStoredData();
    if (!storedEmbeddings || !exemplarsMap) {
      return NextResponse.json({
        success: false,
        status: "unavailable",
        error: "Exemplar embeddings index not found on server.",
      });
    }

    const body = await req.json();
    const rawWindows = Array.isArray(body.windows) ? body.windows : [];

    // Draft is untrusted data: sanitize, clamp max 20 windows, each max 500 chars
    const windows: DraftWindow[] = rawWindows.slice(0, 20).map((w: Record<string, unknown>) => ({
      text: typeof w?.text === "string" ? w.text.slice(0, 500).trim() : "",
      start: typeof w?.start === "number" ? w.start : 0,
      end: typeof w?.end === "number" ? w.end : 0,
    })).filter((w: DraftWindow) => w.text.length > 0);

    if (windows.length === 0) {
      return NextResponse.json({
        success: true,
        status: "ok",
        window_results: [],
        findings: [],
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const dim = storedEmbeddings.dim || 768;

    let windowVectors: number[][] = [];

    // 2. Try Batch Embed via Gemini (text-embedding-004)
    if (geminiKey && !controller.signal.aborted) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:batchEmbedContents?key=${geminiKey}`;
        const requests = windows.map(w => ({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: w.text }] },
        }));

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requests }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.embeddings) && data.embeddings.length === windows.length) {
            windowVectors = data.embeddings.map((e: { values: number[] }) => e.values);
          }
        }
      } catch {
        // Fall through to OpenAI or fallback
      }
    }

    // 3. Try Batch Embed via OpenAI (text-embedding-3-small)
    if (windowVectors.length === 0 && openaiKey && !controller.signal.aborted) {
      try {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: windows.map(w => w.text),
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data) && data.data.length === windows.length) {
            windowVectors = data.data.map((d: { embedding: number[] }) => d.embedding);
          }
        }
      } catch {
        // Fall through to deterministic fallback
      }
    }

    // 4. Deterministic offline fallback if no API keys or offline environment
    if (windowVectors.length === 0) {
      windowVectors = windows.map(w => deterministicFallbackEmbed(w.text, dim));
    }

    // 5. Score each window against stored exemplar vectors
    const windowResults = [];
    const findings = [];

    for (let wIdx = 0; wIdx < windows.length; wIdx++) {
      const win = windows[wIdx];
      const winVec = windowVectors[wIdx];

      let bestViolScore = -1;
      let bestViolExemplar: ExemplarEntry | null = null;
      let bestSafeScore = -1;
      let bestSafeExemplar: ExemplarEntry | null = null;

      for (const item of storedEmbeddings.items) {
        const ex = exemplarsMap.get(item.id);
        if (!ex) continue;

        const score = cosineSimilarity(winVec, item.vector);
        if (ex.label === "violation") {
          if (score > bestViolScore) {
            bestViolScore = score;
            bestViolExemplar = ex;
          }
        } else {
          if (score > bestSafeScore) {
            bestSafeScore = score;
            bestSafeExemplar = ex;
          }
        }
      }

      const margin = bestViolScore - bestSafeScore;

      // Decision rule:
      // - flag "violation" if bestViolScore >= T_HIGH AND margin >= M_HIGH
      // - safe look-alike winning by margin returns "safe"
      // - between T_LOW and T_HIGH, or with small margin, return "uncertain" (goes to Layer 3)
      let decision: "violation" | "uncertain" | "safe" = "safe";

      if (bestViolScore >= T_HIGH && margin >= M_HIGH) {
        decision = "violation";
      } else if (margin <= -M_HIGH && bestSafeScore >= T_HIGH) {
        decision = "safe";
      } else if (bestViolScore >= T_LOW) {
        decision = "uncertain";
      } else {
        decision = "safe";
      }

      windowResults.push({
        window_index: wIdx,
        text: win.text,
        start: win.start,
        end: win.end,
        best_violation: {
          id: bestViolExemplar?.id ?? null,
          score: Number(bestViolScore.toFixed(3)),
          category: bestViolExemplar?.category ?? null,
        },
        best_safe: {
          id: bestSafeExemplar?.id ?? null,
          score: Number(bestSafeScore.toFixed(3)),
        },
        margin: Number(margin.toFixed(3)),
        decision,
      });

      // If violation or uncertain, format Finding with Receipt A and Receipt B
      if (decision === "violation" || decision === "uncertain") {
        const matchedEx = bestViolExemplar;
        if (matchedEx) {
          const statute = getStatute(matchedEx.statute_id);
          const receiptBQuote =
            statute && statute.quote_verified && statute.verbatim_excerpt
              ? statute.verbatim_excerpt
              : `Excerpt pending verification (${statute?.name ?? matchedEx.statute}, ${statute?.provision ?? ""})`;

          findings.push({
            id: `vern-emb-${wIdx + 1}-${matchedEx.id}`,
            source: "embeddings",
            status: decision,
            category: matchedEx.category,
            rule_code: matchedEx.rule_code,
            statute_id: matchedEx.statute_id,
            receipt_a: {
              text: win.text,
              start: win.start,
              end: win.end,
            },
            receipt_b: {
              quote: receiptBQuote,
              verified: statute?.quote_verified ?? false,
              source: statute?.name ?? matchedEx.statute,
            },
            ruleTitle: `${matchedEx.category.replace(/_/g, " ")} Semantic Vector Match`,
            severity: decision === "violation" ? (matchedEx.severity ?? "WARNING") : "WARNING",
            explanation: `Semantic vector match (${(bestViolScore * 100).toFixed(1)}%, margin +${margin.toFixed(2)}) with exemplar ${matchedEx.id}: "${matchedEx.explanation}".`,
            statutoryCitation: statute
              ? `${statute.name} (${statute.provision})`
              : matchedEx.statute,
            suggestedCompliantRewrite: "Remove prohibited vernacular surrogate or predatory claim.",
            statutoryPenaltyExposureInr: decision === "violation" ? 500000 : 0,
            score: Number(bestViolScore.toFixed(3)),
            matched_exemplar_id: matchedEx.id,
            phoneticTrace: `Embedding similarity: ${(bestViolScore * 100).toFixed(1)}% to ${matchedEx.id}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: "ok",
      window_results: windowResults,
      findings,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      status: "unavailable",
      error: err instanceof Error ? err.message : "Error executing embedding check",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

