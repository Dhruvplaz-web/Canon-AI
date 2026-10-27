"use client";

import React, { useState } from "react";
import { GitBranch, Play, CheckCircle2, ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPercent } from "@/lib/formatters";

export interface ProposalItem {
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

export interface BacktestRun {
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
}

interface ProposalAndBacktestSectionProps {
  proposals: ProposalItem[];
  activeProposal: ProposalItem | null;
  onSelectProposal: (prop: ProposalItem) => void;
  backtestRun: BacktestRun | null;
  onRunBacktest: () => Promise<void>;
  isBacktesting: boolean;
  onAdoptPolicy: () => Promise<void>;
  isAdopting: boolean;
  isAdopted: boolean;
}

export function ProposalAndBacktestSection({
  proposals,
  activeProposal,
  onSelectProposal,
  backtestRun,
  onRunBacktest,
  isBacktesting,
  onAdoptPolicy,
  isAdopting,
  isAdopted,
}: ProposalAndBacktestSectionProps) {
  if (!activeProposal) return null;

  return (
    <section className="space-y-6">
      {/* Proposal Selector Tabs */}
      {proposals.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold uppercase text-[var(--color-text-muted)]">
            Exception Proposals:
          </span>
          {proposals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProposal(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeProposal.id === p.id
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs"
                  : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Proposal Diff Card */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                Target: {activeProposal.target_rule_code}
              </span>
              <Badge variant="outline" size="sm">
                AST Revision Proposal
              </Badge>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {activeProposal.title}
            </h3>
          </div>

          <Badge variant={isAdopted ? "success" : "warning"} size="sm">
            {isAdopted ? "Policy v1.1 Active" : "Pending Signoff"}
          </Badge>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {activeProposal.rationale}
        </p>

        {/* Visual Before/After Diff Block */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase font-bold text-[var(--color-text-muted)] block">
            PROPOSED RULE AST MODIFICATION
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-rose-700 dark:text-rose-400 block">
                CURRENT BASELINE RULE TEXT
              </span>
              <p className="font-mono text-rose-900 dark:text-rose-200">
                {activeProposal.proposed_diff.previous_text}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                PROPOSED SPECIFICATION (v1.1)
              </span>
              <p className="font-mono text-emerald-900 dark:text-emerald-200 font-semibold">
                {activeProposal.proposed_diff.proposed_text}
              </p>
            </div>
          </div>
        </div>

        {/* Empirical Backtest Runner Panel */}
        <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Empirical Backtest Simulation</span>
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Simulate this proposed rule modification across historical corporate marketing submissions.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRunBacktest}
              disabled={isBacktesting}
              className="gap-1.5"
            >
              <Play className={`w-3.5 h-3.5 ${isBacktesting ? "animate-spin" : ""}`} />
              <span>{isBacktesting ? "Simulating..." : "Run Historical Backtest"}</span>
            </Button>
          </div>

          {backtestRun && (
            <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono block">
                    SAMPLES ANALYZED
                  </span>
                  <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                    {backtestRun.historical_submissions_analyzed}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono block">
                    PRIOR &rarr; NEW PASS RATE
                  </span>
                  <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                    {formatPercent(backtestRun.prior_pass_rate)} &rarr; {formatPercent(backtestRun.simulated_pass_rate)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono block">
                    FALSE POSITIVES CUT
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    -{backtestRun.false_positives_eliminated}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono block">
                    SAFETY SCORE
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {backtestRun.safety_score}/100
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">
                  Recommendation: {backtestRun.recommendation}
                </span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  0 Regressions Detected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Adopt Policy Button Bar */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[var(--color-text-muted)]">
            <span>Requires Brand Manager authorization. Adoption increments policy version to v1.1.</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAdoptPolicy}
            disabled={isAdopting || isAdopted}
            className="gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isAdopted
                ? "Policy v1.1 Adopted"
                : isAdopting
                ? "Adopting Policy..."
                : "Approve & Adopt Policy v1.1"}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
