"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Send,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";

// =========================================================================
// STAGE 1: Policy Inspection
// =========================================================================
export function Stage1Policy({ onNext }: { onNext: () => void }) {
  const [rules, setRules] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/governance/policy/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setRules(data.rules || []);
          setClaims(data.approved_claims || []);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Stage 1: Active Brand Policy &amp; Substantiated Claims
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Canon evaluates copy against active compiled AST rules and time-bounded approved claims.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onNext} className="gap-1.5 shrink-0">
          <span>Next: Run Draft Check</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Rules Summary */}
        <div className="space-y-3">
          <span className="font-mono uppercase font-bold text-[var(--color-text-muted)] block">
            ACTIVE COMPILED RULES ({rules.length})
          </span>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rules.slice(0, 5).map((r) => (
              <div
                key={r.rule_code}
                className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[var(--color-text-primary)]">
                    {r.rule_code}
                  </span>
                  <StatusBadge
                    status={r.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                  />
                </div>
                <p className="font-semibold text-[var(--color-text-primary)]">{r.title}</p>
                <p className="font-mono text-[11px] text-rose-600 dark:text-rose-400 truncate">
                  Pattern: {r.pattern_or_term}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Claims Summary */}
        <div className="space-y-3">
          <span className="font-mono uppercase font-bold text-[var(--color-text-muted)] block">
            APPROVED CLAIMS LEDGER ({claims.length})
          </span>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {claims.map((c) => (
              <div
                key={c.claim_code}
                className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[var(--color-text-primary)]">
                    {c.claim_code}
                  </span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  &ldquo;{c.claim_text}&rdquo;
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
                  Validity: {formatDate(c.valid_from)} &ndash; {formatDate(c.valid_until)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STAGE 2: Draft Authoring & Pre-Flight Check
// =========================================================================
export function Stage2Authoring({ onNext }: { onNext: () => void }) {
  const [content, setContent] = useState(
    "Bank on us for all your financial operations! We offer super dope yields with instant loan approval in seconds. Acme has been rated #1 banking app with 99.99% uptime across all major benchmarks."
  );
  const [isChecking, setIsChecking] = useState(false);
  const [findings, setFindings] = useState<any[]>([]);

  const handleRunCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/v1/submissions/sub_demo_01/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setFindings(data.findings || []);
      }
    } catch {
      // Failed check
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Stage 2: Live Pre-Flight Compliance Verification
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Submit marketing copy containing ungrounded claims and prohibited banking terms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCheck}
            disabled={isChecking}
            className="gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isChecking ? "Checking..." : "Execute Check"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNext}
            disabled={findings.length === 0}
            className="gap-1.5"
          >
            <span>Next: Review Findings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Editor Box */}
        <div className="space-y-2">
          <span className="font-mono uppercase font-bold text-[var(--color-text-muted)] block">
            MARKETING DRAFT TEXT
          </span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] font-mono text-xs text-[var(--color-text-primary)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        {/* Findings Box */}
        <div className="space-y-2">
          <span className="font-mono uppercase font-bold text-[var(--color-text-muted)] block">
            IDENTIFIED VIOLATIONS ({findings.length})
          </span>
          {findings.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[var(--color-text-primary)]">
                      {f.rule_code}
                    </span>
                    <StatusBadge
                      status={f.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                    />
                  </div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{f.title}</p>
                  <p className="font-mono text-rose-600 dark:text-rose-400">
                    &ldquo;{f.matched_text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-default)] rounded-xl">
              Click &ldquo;Execute Check&rdquo; to test copy against compliance pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STAGE 3: Dual Grounding Review & Override
// =========================================================================
export function Stage3Review({ onNext }: { onNext: () => void }) {
  const [overridden, setOverridden] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordOverride = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/findings/fnd_rev_01/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_code: "RC-01",
          notes: "Approved under legal counsel partner exemption for Q4 press release.",
        }),
      });
      if (res.ok) {
        setOverridden(true);
      }
    } catch {
      // Error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Stage 3: Dual-Grounding Triage &amp; Human Adjudication
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Every candidate violation requires both a verbatim draft citation and a statutory policy quote.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onNext} className="gap-1.5 shrink-0">
          <span>Next: Governance &amp; Backtest</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-4 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">
              TERM-001
            </span>
            <StatusBadge status="CRITICAL" />
            <span className="font-bold text-[var(--color-text-primary)]">
              Prohibition of Unqualified Banking Verbs
            </span>
          </div>
          <Badge variant={overridden ? "success" : "warning"} size="sm">
            {overridden ? "Overridden & Recorded" : "Pending Review"}
          </Badge>
        </div>

        {/* Dual Grounding Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--color-text-muted)] block">
              DRAFT CITATION SPAN
            </span>
            <p className="font-mono text-rose-600 dark:text-rose-400 font-bold">
              &ldquo;bank on us&rdquo;
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              Offsets: [14, 24] in Draft Copy
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--color-text-muted)] block">
              STATUTORY POLICY RULE EXCERPT
            </span>
            <p className="text-[var(--color-text-secondary)] italic leading-relaxed">
              &ldquo;Marketing collateral must never instruct consumers to &lsquo;bank on us&rsquo; or imply Acme holds banking charters.&rdquo;
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              Source: Section 1.1 Brand Identity Guidelines
            </span>
          </div>
        </div>

        {/* Human Override Action */}
        <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4 flex-wrap">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Reason code &lsquo;RC-01&rsquo; (Legal Safe Harbor) will be logged to append-only ledger.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecordOverride}
            disabled={overridden || isSubmitting}
            className="gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{overridden ? "Override Signed" : isSubmitting ? "Signing..." : "Sign Override (RC-01)"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STAGE 4: Governance, Backtest & Policy v1.1
// =========================================================================
export function Stage4Governance() {
  const [backtestRun, setBacktestRun] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [adopted, setAdopted] = useState(false);

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await fetch("/api/v1/governance/proposals/prop-01/backtest", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setBacktestRun(data);
      }
    } catch {
      // Failed backtest
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleAdopt = async () => {
    try {
      const res = await fetch("/api/v1/governance/proposals/prop-01/adopt", {
        method: "POST",
      });
      if (res.ok) {
        setAdopted(true);
      }
    } catch {
      // Failed adopt
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Stage 4: Rule Friction Telemetry &amp; Policy v1.1 Evolution
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Turn reviewer override friction into empirical, backtested policy improvements.
          </p>
        </div>
        <Badge variant={adopted ? "success" : "default"} size="sm">
          {adopted ? "Policy v1.1 Adopted" : "Policy v1.0 Baseline"}
        </Badge>
      </div>

      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-2">
          <span className="font-bold text-sm text-[var(--color-text-primary)] block">
            Friction Signal: CLAIM-001 High Override Rate (41.0%)
          </span>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            Reviewers routinely override rule CLAIM-001 when sales copy quotes certified 2026 SOC-2 SLA reports. Candidate proposal &lsquo;Permit Substantiated 2026 SOC-2 SLA Claims&rsquo; is staged for historical simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBacktest}
            disabled={isBacktesting}
            className="gap-1.5"
          >
            <Play className={`w-3.5 h-3.5 ${isBacktesting ? "animate-spin" : ""}`} />
            <span>{isBacktesting ? "Simulating..." : "Run Empirical Backtest"}</span>
          </Button>

          {backtestRun && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdopt}
              disabled={adopted}
              className="gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{adopted ? "Policy v1.1 Active in Production" : "Approve & Adopt Policy v1.1"}</span>
            </Button>
          )}
        </div>

        {backtestRun && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 animate-in fade-in">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
              Simulation Results ({backtestRun.historical_submissions_analyzed} Historical Submissions)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>Prior: {(backtestRun.prior_pass_rate * 100).toFixed(0)}%</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                New: {(backtestRun.simulated_pass_rate * 100).toFixed(0)}%
              </div>
              <div className="text-emerald-600 dark:text-emerald-400">
                -{backtestRun.false_positives_eliminated} False Positives
              </div>
              <div className="font-bold">0 Regressions</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
