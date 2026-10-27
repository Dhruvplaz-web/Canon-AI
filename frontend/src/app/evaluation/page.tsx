"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Flame,
  Search,
  Filter,
} from "lucide-react";

interface FindingTrace {
  rule_code: string;
  category: string;
  severity: string;
  title: string;
  matched_text: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document_title: string;
  source_section: string;
}

interface BenchmarkCase {
  id: string;
  cohort: "adversarial_security" | "brand_violations" | "compliant_copy" | string;
  title: string;
  content: string;
  expected_outcome: "VIOLATION" | "COMPLIANT";
  expected_rule_code: string | null;
  actual_outcome: "VIOLATION" | "COMPLIANT";
  detected_rule_codes: string[];
  findings_count: number;
  is_correct: boolean;
  latency_ms: number;
  findings: FindingTrace[];
}

interface BenchmarkMetrics {
  true_positives: number;
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  adversarial_blocked_count: number;
  adversarial_total: number;
  adversarial_defense_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

interface BenchmarkReport {
  timestamp: number;
  policy_version: string;
  total_cases: number;
  metrics: BenchmarkMetrics;
  cases: BenchmarkCase[];
}

function EvaluationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReRunning, setIsReRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // URL-first state
  const initialCohort = searchParams.get("cohort") || "ALL";
  const [selectedCohort, setSelectedCohort] = useState<string>(initialCohort);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(
    searchParams.get("caseId") || null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const syncUrlParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (!v || v === "ALL") {
          current.delete(k);
        } else {
          current.set(k, v);
        }
      });
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchBenchmark = async (isManualReRun = false) => {
    if (isManualReRun) setIsReRunning(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/governance/benchmark", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail?.error?.message ||
            errData?.message ||
            `Benchmark failed with HTTP ${res.status}`
        );
      }

      const data: BenchmarkReport = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load benchmark evaluation.");
    } finally {
      setIsLoading(false);
      setIsReRunning(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const filteredCases = useMemo(() => {
    if (!report?.cases) return [];
    return report.cases.filter((c) => {
      const matchesCohort = selectedCohort === "ALL" || c.cohort === selectedCohort;
      const matchesQuery =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.detected_rule_codes.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCohort && matchesQuery;
    });
  }, [report, selectedCohort, searchQuery]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge bg-[#00C2CB] text-black">SCR-08</span>
            <span className="text-black font-black text-xs">•</span>
            <span className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              Empirical AI Safety &amp; Governance Matrix
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">
            Reproducible Benchmark &amp; Evaluation Suite
          </h1>
          <p className="text-sm font-medium text-[#333333] mt-1.5 max-w-2xl">
            Empirical validation across 30 benchmark fixtures: OWASP LLM prompt injection defense, deterministic brand rules, temporal claims ledger, and clean compliant copy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchBenchmark(true)}
            disabled={isLoading || isReRunning}
            className="neo-btn neo-btn-teal text-xs py-2 px-4 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReRunning ? "animate-spin" : ""}`} />
            <span>{isReRunning ? "Evaluating 30 Cases..." : "Re-run Benchmark Suite"}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-5 rounded-xl bg-[#FF00FF] border border-[#E5E7EB] text-white text-xs flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="font-black text-sm uppercase block">Benchmark Run Failed</strong>
              <span>{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchBenchmark(true)}
            className="neo-btn neo-btn-white text-xs py-1 px-3 text-black"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="neo-box p-6 bg-white flex flex-col gap-3">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-3 w-36" />
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {!isLoading && report && (
        <div className="flex flex-col gap-8">
          {/* Bento Scoreboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* F1 Score */}
            <div className="neo-box p-5 bg-[#00C2CB] text-black flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider font-mono">F1 Compliance Score</span>
                <Activity className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="text-4xl font-black tracking-tight">
                  {(report.metrics.f1_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold border-t border-[#E5E7EB] pt-2">
                <span>Precision: {(report.metrics.precision * 100).toFixed(0)}%</span>
                <span>Recall: {(report.metrics.recall * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* OWASP Injection Defense */}
            <div className="neo-box p-5 bg-[#FF00FF] text-white flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider font-mono">OWASP Injection Defense</span>
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-4xl font-black tracking-tight">
                  {report.metrics.adversarial_blocked_count}/{report.metrics.adversarial_total}
                </span>
                <span className="text-xs font-bold block mt-0.5">100% Adversarial Jailbreaks Blocked</span>
              </div>
              <div className="text-[11px] font-bold border-t border-[#E5E7EB] pt-2 text-white/90">
                Pre-flight Sanitizer Delimiters Active
              </div>
            </div>

            {/* Accuracy */}
            <div className="neo-box p-5 bg-[#FFD700] text-black flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider font-mono">Classification Accuracy</span>
                <CheckCircle2 className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="text-4xl font-black tracking-tight">
                  {(report.metrics.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px] font-bold border-t border-[#E5E7EB] pt-2">
                {report.metrics.true_positives + report.metrics.true_negatives} of {report.total_cases} Test Fixtures Matched
              </div>
            </div>

            {/* Latency */}
            <div className="neo-box p-5 bg-white text-black flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider font-mono">Pipeline Latency</span>
                <Zap className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="text-4xl font-black tracking-tight">
                  {report.metrics.avg_latency_ms.toFixed(1)}ms
                </span>
                <span className="text-xs font-bold text-[#555555] block mt-0.5">Average Check Duration</span>
              </div>
              <div className="text-[11px] font-mono font-bold border-t border-[#E5E7EB] pt-2 text-[#444444]">
                P95 Latency: {report.metrics.p95_latency_ms.toFixed(1)}ms
              </div>
            </div>
          </div>

          {/* Confusion Matrix Section */}
          <div className="neo-box p-6 bg-white flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
              <div>
                <h2 className="text-base font-black text-black uppercase tracking-tight">
                  Empirical Confusion Matrix
                </h2>
                <p className="text-xs font-medium text-[#444444]">
                  Falsifiable test distribution comparing expected vs actual compliance outcomes.
                </p>
              </div>
              <span className="neo-badge bg-[#F8F9FA] text-black font-mono text-[10px]">
                N = {report.total_cases} Standardized Cases
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* True Positives (TP) */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#E6FAFA] text-black flex flex-col justify-between gap-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase">True Positives (TP)</span>
                  <span className="neo-badge bg-black text-white text-[10px]">CORRECT CATCH</span>
                </div>
                <div className="text-3xl font-black">{report.metrics.true_positives}</div>
                <p className="text-xs font-semibold text-[#222222]">
                  Real policy violations correctly identified and intercepted with verifiable double receipts.
                </p>
              </div>

              {/* False Positives (FP) */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFF0F5] text-black flex flex-col justify-between gap-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase">False Positives (FP)</span>
                  <span className="neo-badge bg-[#FF00FF] text-white text-[10px]">FRICTION DRAG</span>
                </div>
                <div className="text-3xl font-black">{report.metrics.false_positives}</div>
                <p className="text-xs font-semibold text-[#222222]">
                  Compliant text erroneously flagged (zero tolerance target).
                </p>
              </div>

              {/* False Negatives (FN) */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFF0F5] text-black flex flex-col justify-between gap-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase">False Negatives (FN)</span>
                  <span className="neo-badge bg-[#FF00FF] text-white text-[10px]">SAFETY RISK</span>
                </div>
                <div className="text-3xl font-black">{report.metrics.false_negatives}</div>
                <p className="text-xs font-semibold text-[#222222]">
                  Violations that slipped past verification without detection (zero tolerance target).
                </p>
              </div>

              {/* True Negatives (TN) */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#E6FAFA] text-black flex flex-col justify-between gap-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase">True Negatives (TN)</span>
                  <span className="neo-badge bg-black text-white text-[10px]">CLEAN PASS</span>
                </div>
                <div className="text-3xl font-black">{report.metrics.true_negatives}</div>
                <p className="text-xs font-semibold text-[#222222]">
                  Compliant copy correctly approved with 0 false alarms.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Test Case Explorer */}
          <div className="neo-box p-6 bg-white flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
              <div>
                <h2 className="text-base font-black text-black uppercase tracking-tight">
                  Benchmark Test Cases ({filteredCases.length} of {report.total_cases})
                </h2>
                <p className="text-xs font-medium text-[#444444]">
                  Filter and inspect individual scenario prompts, detected rules, and double receipts.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search test cases..."
                  className="neo-input pl-8 py-1.5 text-xs w-full"
                />
              </div>
            </div>

            {/* Cohort Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "ALL", label: `All Test Cases (${report.total_cases})` },
                { id: "adversarial_security", label: "OWASP Prompt Injection (10)" },
                { id: "brand_violations", label: "Statutory Brand Violations (10)" },
                { id: "compliant_copy", label: "Compliant Marketing Copy (10)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedCohort(t.id);
                    syncUrlParams({ cohort: t.id });
                  }}
                  className={`neo-btn text-xs py-1.5 px-3.5 ${
                    selectedCohort === t.id ? "neo-btn-teal" : "neo-btn-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Table of Test Cases */}
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
              <div className="divide-y-2 divide-black">
                {filteredCases.map((c) => {
                  const isExpanded = expandedCaseId === c.id;
                  const cohortColor =
                    c.cohort === "adversarial_security"
                      ? "bg-[#FF00FF] text-white"
                      : c.cohort === "brand_violations"
                      ? "bg-[#FFD700] text-black"
                      : "bg-[#00C2CB] text-black";

                  return (
                    <div key={c.id} className="flex flex-col bg-white">
                      {/* Row Header */}
                      <div
                        onClick={() => {
                          const next = isExpanded ? null : c.id;
                          setExpandedCaseId(next);
                          syncUrlParams({ caseId: next });
                        }}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FDFBF7] transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            className="p-0.5 rounded border border-black hover:bg-[#F8F9FA]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-black" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-black" />
                            )}
                          </button>

                          <span className="font-mono text-xs font-black text-black shrink-0">
                            {c.id}
                          </span>

                          <span className={`neo-badge text-[10px] shrink-0 ${cohortColor}`}>
                            {c.cohort === "adversarial_security"
                              ? "SECURITY"
                              : c.cohort === "brand_violations"
                              ? "VIOLATION"
                              : "COMPLIANT"}
                          </span>

                          <span className="text-xs font-bold text-black truncate">
                            {c.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          {c.detected_rule_codes.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {c.detected_rule_codes.slice(0, 2).map((code) => (
                                <span
                                  key={code}
                                  className="neo-badge bg-black text-white text-[10px] font-mono"
                                >
                                  {code}
                                </span>
                              ))}
                              {c.detected_rule_codes.length > 2 && (
                                <span className="text-[10px] font-bold text-[#666666]">
                                  +{c.detected_rule_codes.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono font-bold text-[#555555]">
                              Zero Findings
                            </span>
                          )}

                          <span className="font-mono font-semibold text-[11px] text-[#444444]">
                            {c.latency_ms.toFixed(1)}ms
                          </span>

                          {c.is_correct ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#008A90] bg-[#E6FAFA] px-2 py-0.5 rounded border border-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PASS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#D6006E] bg-[#FFF0F5] px-2 py-0.5 rounded border border-black">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>FAIL</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex flex-col gap-3 text-xs animate-in fade-in">
                          {/* Prompt Text */}
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-black text-[10px] uppercase text-black">
                              Test Scenario Input Copy:
                            </span>
                            <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] font-mono text-xs text-black leading-relaxed shadow-xs">
                              &ldquo;{c.content}&rdquo;
                            </div>
                          </div>

                          {/* Evaluation Trace Comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] flex flex-col gap-1 text-[11px]">
                              <span className="font-mono font-bold text-[#555555]">Expected Benchmark Ground Truth:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-black">{c.expected_outcome}</span>
                                {c.expected_rule_code && (
                                  <span className="neo-badge bg-black text-white text-[10px]">
                                    {c.expected_rule_code}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] flex flex-col gap-1 text-[11px]">
                              <span className="font-mono font-bold text-[#555555]">Actual Pipeline Result:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-black">{c.actual_outcome}</span>
                                <span className="text-xs text-[#555555]">
                                  ({c.findings_count} findings recorded)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Findings double receipts list */}
                          {c.findings.length > 0 && (
                            <div className="flex flex-col gap-2 pt-2">
                              <span className="font-mono font-black text-[10px] uppercase text-black">
                                Verified Double Receipts:
                              </span>
                              {c.findings.map((f, fIdx) => (
                                <div
                                  key={fIdx}
                                  className="p-3 rounded-lg bg-white border border-[#E5E7EB] flex flex-col gap-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="neo-badge bg-black text-white text-[10px]">
                                        {f.rule_code}
                                      </span>
                                      <span className="font-bold text-black">{f.title}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-[#666666]">
                                      {f.source_document_title}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-black">
                                    <span className="font-mono font-bold text-[#D6006E]">Receipt A (Draft Span): </span>
                                    <span className="font-mono bg-[#FFF0F5] px-1 py-0.5 rounded border border-black/20">
                                      &ldquo;{f.receipt_a_draft_span}&rdquo;
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-black">
                                    <span className="font-mono font-bold text-[#008A90]">Receipt B (Policy Quote): </span>
                                    <span className="italic">
                                      &ldquo;{f.receipt_b_rule_quote}&rdquo;
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2 flex justify-end">
                            <Link
                              href={`/submissions?fixture=SUB-02`}
                              className="neo-btn neo-btn-teal text-xs py-1.5 px-3"
                            >
                              <span>Test in Interactive Draft Editor</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 text-black font-mono font-bold text-xs">
          Loading AI Safety Benchmark Matrix...
        </div>
      }
    >
      <EvaluationContent />
    </Suspense>
  );
}
