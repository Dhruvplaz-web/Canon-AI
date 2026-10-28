"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Play,
  UserCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { ExecutiveGovernanceScorecard } from "@/components/ExecutiveGovernanceScorecard";

interface RuleHealth {
  id: string;
  rule_code: string;
  snapshot_date: string;
  total_evaluations: number;
  total_flags: number;
  total_overrides: number;
  override_rate: number;
  diagnostic_status: string;
  primary_override_reason: string;
}

interface Proposal {
  id: string;
  proposal_code: string;
  policy_version_id: string;
  target_rule_code: string;
  title: string;
  rationale: string;
  proposed_diff: {
    action?: string;
    rule_code?: string;
    previous_text?: string;
    proposed_text?: string;
    channel_scope_added?: string;
  };
  status: string;
  adopted_at?: string;
}

interface BacktestRun {
  id: string;
  proposal_id: string;
  status: string;
  historical_submissions_analyzed: number;
  prior_pass_rate: number;
  simulated_pass_rate: number;
  false_positives_eliminated: number;
  regressions_detected: number;
  safety_score: number;
  recommendation: string;
  completed_at?: string;
}

function GovernanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [healthData, setHealthData] = useState<RuleHealth[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [backtestRun, setBacktestRun] = useState<BacktestRun | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptedResult, setAdoptedResult] = useState<{
    version_number: string;
    approved_by: string;
    approved_at: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state with URL search parameters (Rule 3 URL-First State)
  const syncUrlParams = useCallback(
    (proposalCode: string) => {
      const current = new URLSearchParams(searchParams.toString());
      current.set("proposal", proposalCode);
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/v1/governance/health").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/governance/proposals").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([hData, pData]: [RuleHealth[], Proposal[]]) => {
        if (!active) return;
        setHealthData(hData || []);
        const list: Proposal[] = Array.isArray(pData) ? pData : [];
        setProposals(list);

        const propCode = searchParams.get("proposal");
        const found = propCode ? list.find((p) => p.proposal_code === propCode) : null;
        const initial = found || (list.length > 0 ? list[0] : null);

        if (initial) {
          setActiveProposal(initial);
          if (initial.status === "ADOPTED") {
            setAdoptedResult({
              version_number: "1.1",
              approved_by: "Alice Brand (Brand Manager)",
              approved_at: initial.adopted_at || new Date().toISOString(),
              message: `Proposal ${initial.proposal_code} successfully approved by Brand Manager and activated as Policy v1.1.`,
            });
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleRunBacktest = async () => {
    if (!activeProposal) return;
    setIsBacktesting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/governance/proposals/${activeProposal.id}/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Backtest execution failed.");
      }

      const data: BacktestRun = await res.json();
      setBacktestRun(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run simulation.";
      setErrorMessage(msg);
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleAdoptProposal = async () => {
    if (!activeProposal) return;
    setIsAdopting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/governance/proposals/${activeProposal.id}/adopt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required. Please sign in as a Brand Manager to approve policy versions.");
        }
        if (res.status === 403) {
          throw new Error("Action requires Brand Manager role. Your current account is not authorized to approve policy versions.");
        }
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail?.error?.message || err?.detail || err?.error?.message || "Proposal adoption failed.");
      }

      const data = await res.json();
      setAdoptedResult({
        version_number: data.version_number,
        approved_by: "Alice Brand (Brand Manager)",
        approved_at: data.approved_at,
        message: data.message,
      });

      // Update proposal state
      setActiveProposal((prev) => (prev ? { ...prev, status: "ADOPTED" } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to adopt proposal.";
      setErrorMessage(msg);
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge bg-[#00C2CB] text-black text-xs font-black">
              Governance Engine
            </span>
            <span className="text-black font-black text-xs">•</span>
            <span className="text-xs font-black uppercase font-mono tracking-wider text-black">
              Telemetry &amp; Rule Evolution
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">
            Rule Health Telemetry, Exception Proposals &amp; Policy v1.1
          </h1>
          <p className="text-sm font-medium text-black/80 mt-1 max-w-3xl">
            Detect friction patterns from reviewer override signals, backtest candidate rule modifications, and require explicit human Brand Manager authorization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-black/70 uppercase font-mono">Active Policy:</span>
          <span
            className={`neo-badge text-xs font-black ${
              adoptedResult
                ? "bg-[#00C2CB] text-black"
                : "bg-[#FFD700] text-black"
            }`}
          >
            {adoptedResult ? "Policy v1.1 (ACTIVE)" : "Policy v1.0 (BASELINE)"}
          </span>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="neo-box h-32 w-full bg-white animate-pulse" />
            <div className="neo-box h-32 w-full bg-white animate-pulse" />
            <div className="neo-box h-32 w-full bg-white animate-pulse" />
          </div>
          <div className="neo-box h-64 w-full bg-white animate-pulse" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE GOVERNANCE ROI SCORECARD & CALCULATOR (Task 3.3) */}
      {/* ========================================================================= */}
      <ExecutiveGovernanceScorecard />

      {/* Section 2: Rule Health Telemetry Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#FFD700] border-[2px] border-black flex items-center justify-center shadow-[1px_1px_0px_#000000]">
              <Activity className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-black text-black">Rule Friction &amp; Health Diagnostic Telemetry</h2>
          </div>
          <span className="text-xs font-mono font-bold text-black/70">
            Diagnostic threshold: &gt;20% override triggers SCOPE_MISMATCH
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthData.map((h) => (
            <div
              key={h.id || h.rule_code}
              className={`p-5 neo-box flex flex-col gap-3 ${
                h.diagnostic_status === "SCOPE_MISMATCH"
                  ? "bg-[#FFF9E6]"
                  : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-black">{h.rule_code}</span>
                <span
                  className={`neo-badge text-[10px] font-black ${
                    h.diagnostic_status === "SCOPE_MISMATCH"
                      ? "bg-[#FF00FF] text-white"
                      : "bg-[#00C2CB] text-black"
                  }`}
                >
                  {h.diagnostic_status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-black">
                  {(h.override_rate * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-black/70">Override Rate ({h.total_overrides}/{h.total_evaluations})</span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-black/80 font-medium pt-3 border-t-[2px] border-black/15">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Primary Reason:</span>
                  <span className="font-mono font-bold text-black bg-white px-1.5 py-0.5 rounded border border-black/40 text-[11px] truncate max-w-[160px]">{h.primary_override_reason}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Flags:</span>
                  <span className="font-mono font-black text-black">{h.total_flags}</span>
                </div>
              </div>
            </div>
          ))}

          {healthData.length === 0 && (
            <div className="p-5 neo-box bg-[#FFF9E6] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-black">TERM-007</span>
                <span className="neo-badge bg-[#FF00FF] text-white text-[10px] font-black">
                  SCOPE_MISMATCH
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-black">37.5%</span>
                <span className="text-xs font-bold text-black/70">Override Rate (9/24)</span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-black/80 font-medium pt-3 border-t-[2px] border-black/15">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Primary Reason:</span>
                  <span className="font-mono font-bold text-black bg-white px-1.5 py-0.5 rounded border border-black/40 text-[11px]">JUSTIFIED_EDUCATIONAL_CONTEXT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Candidate Proposal Selector (If multiple proposals exist) */}
      {proposals.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase font-mono text-black">Active Proposal:</span>
          <div className="flex flex-wrap gap-2">
            {proposals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveProposal(p);
                  syncUrlParams(p.proposal_code);
                }}
                className={`neo-btn text-xs font-mono font-black ${
                  activeProposal?.id === p.id
                    ? "neo-btn-teal"
                    : "neo-btn-white"
                }`}
              >
                {p.proposal_code} — {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Candidate Proposal & Diff Viewer */}
      {activeProposal && (
        <section className="neo-box-prominent bg-white p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#FFD700] border-[2px] border-black flex items-center justify-center shadow-[1px_1px_0px_#000000]">
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-black text-black">
                Deterministic Proposal {activeProposal.proposal_code}: {activeProposal.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black/70 font-mono">Target:</span>
              <span className="neo-badge bg-[#FFD700] text-black text-xs font-black">
                {activeProposal.target_rule_code}
              </span>
              <span
                className={`neo-badge text-xs font-black ${
                  activeProposal.status === "ADOPTED"
                    ? "bg-[#00C2CB] text-black"
                    : "bg-white text-black"
                }`}
              >
                {activeProposal.status}
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-black/90 leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border-[2px] border-black">
            {activeProposal.rationale}
          </p>

          {/* Diff Box */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-black text-black uppercase tracking-wider">
              Rule Scope Specification Diff
            </span>
            <div className="neo-box bg-[#F9F9F8] p-4 font-mono text-xs flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-[#FFE6E6] border-[2px] border-black text-red-950 flex items-start gap-2 shadow-[2px_2px_0px_#000000]">
                <span className="font-black select-none text-base leading-none text-red-600">-</span>
                <span className="font-semibold leading-relaxed">
                  &ldquo;
                  {activeProposal.proposed_diff.previous_text ||
                    "All educational case studies and technical thought leadership articles must display full state statutory disclosures prominently."}
                  &rdquo;
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#E6FAFA] border-[2px] border-black text-teal-950 flex items-start gap-2 shadow-[2px_2px_0px_#000000]">
                <span className="font-black select-none text-base leading-none text-teal-700">+</span>
                <span className="font-bold leading-relaxed">
                  &ldquo;
                  {activeProposal.proposed_diff.proposed_text ||
                    "All educational case studies and technical thought leadership articles must display full state statutory disclosures prominently, except when published exclusively within verified enterprise partner portals."}
                  &rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Backtest Simulation Controls */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8F9FA] border-[2px] border-black">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-black text-black">Empirical Backtest Simulation</h3>
                <p className="text-xs font-medium text-black/75">
                  Replay 24 historical marketing submissions against the proposed scope exception.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="neo-btn neo-btn-teal text-xs font-black inline-flex items-center gap-2 px-5 py-2.5"
              >
                {isBacktesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Simulation (24 items)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Run Pre-Deployment Backtest</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#FF00FF] text-white border border-[#E5E7EB] font-bold text-xs shadow-[2px_2px_0px_#000000]">
                {errorMessage}
              </div>
            )}

            {/* Backtest Simulation Results */}
            {backtestRun && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 neo-box bg-[#F8F9FA] animate-in fade-in duration-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono font-bold text-black/70 uppercase">Historical Analyzed</span>
                  <span className="text-xl font-mono font-black text-black">
                    {backtestRun.historical_submissions_analyzed} drafts
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono font-bold text-black/70 uppercase">Simulated Pass Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-black bg-[#00C2CB] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000]">
                      {(backtestRun.simulated_pass_rate * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-black/60 line-through font-mono font-bold">
                      {(backtestRun.prior_pass_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono font-bold text-black/70 uppercase">False Positives</span>
                  <span className="text-xl font-mono font-black text-black bg-[#FFD700] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000] inline-block w-fit">
                    -{backtestRun.false_positives_eliminated}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono font-bold text-black/70 uppercase">Regressions</span>
                  <span className="text-xl font-mono font-black text-black bg-[#00C2CB] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000] inline-block w-fit">
                    {backtestRun.regressions_detected} (Safe)
                  </span>
                </div>
              </div>
            )}

            {/* Human Adoption Gate (Section 3: Human Authority Required) */}
            {adoptedResult ? (
              <div className="p-5 neo-box bg-[#00C2CB] text-black flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-[2px] border-black flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#000000]">
                  <CheckCircle2 className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-black text-sm uppercase tracking-wide">
                    Policy v1.1 Officially Activated &amp; Sealed
                  </span>
                  <p className="font-medium text-black/90 leading-relaxed text-xs">
                    {adoptedResult.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold text-black mt-2 pt-2 border-t-[2px] border-black/20">
                    <span>Approved by: {adoptedResult.approved_by}</span>
                    <span>Timestamp: {new Date(adoptedResult.approved_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAdoptProposal}
                  disabled={isAdopting}
                  className="neo-btn neo-btn-magenta text-xs font-black inline-flex items-center gap-2 px-6 py-3 shadow-[4px_4px_0px_#000000]"
                >
                  {isAdopting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Policy v1.1 (Human Approval)...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Adopt as Policy v1.1 (Human Approval)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function GovernancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 text-black font-mono font-bold text-xs">
          Loading Governance Intelligence Workspace...
        </div>
      }
    >
      <GovernanceContent />
    </Suspense>
  );
}

