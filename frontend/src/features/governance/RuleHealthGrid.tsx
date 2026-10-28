"use client";

import React, { useState, useMemo } from "react";
import { Activity, AlertTriangle, ShieldCheck, TrendingUp, DollarSign, Clock, CheckCircle2, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPercent, formatNumber } from "@/lib/formatters";

export interface RuleHealthItem {
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

interface RuleHealthGridProps {
  items: RuleHealthItem[];
}

export function RuleHealthGrid({ items }: RuleHealthGridProps) {
  // Executive ROI Calculator Scale Presets (Function 3.3)
  const [scalePreset, setScalePreset] = useState<"mid" | "enterprise" | "global">("enterprise");

  const roiMetrics = useMemo(() => {
    switch (scalePreset) {
      case "mid":
        return {
          assetsPerMonth: 60,
          violationsIntercepted: 74,
          legalHoursSaved: 162,
          riskAvoidedUsd: 185000,
          convergenceRate: 0.961,
        };
      case "global":
        return {
          assetsPerMonth: 850,
          violationsIntercepted: 1120,
          legalHoursSaved: 2295,
          riskAvoidedUsd: 2800000,
          convergenceRate: 0.948,
        };
      case "enterprise":
      default:
        return {
          assetsPerMonth: 220,
          violationsIntercepted: 284,
          legalHoursSaved: 594,
          riskAvoidedUsd: 710000,
          convergenceRate: 0.954,
        };
    }
  }, [scalePreset]);

  return (
    <section className="space-y-6">
      {/* Function 3.3: Executive Governance ROI Scorecard & Cost Calculator */}
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>Executive Governance ROI &amp; Risk Avoidance Scorecard</span>
                <Badge variant="success" size="sm">
                  CFO Metrics
                </Badge>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Quantified brand protection value: pre-publication violation interception vs. statutory fines and outside legal counsel.
              </p>
            </div>
          </div>

          {/* Scale Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] mr-1">Organization Scale:</span>
            <button
              type="button"
              onClick={() => setScalePreset("mid")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                scalePreset === "mid"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Mid-Market
            </button>
            <button
              type="button"
              onClick={() => setScalePreset("enterprise")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                scalePreset === "enterprise"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Enterprise
            </button>
            <button
              type="button"
              onClick={() => setScalePreset("global")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                scalePreset === "global"
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Global 2000
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Violations Intercepted</span>
            </span>
            <div className="text-2xl font-black font-mono text-[var(--color-text-primary)]">
              {roiMetrics.violationsIntercepted}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
              Pre-Publication Gate
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>Legal Hours Saved</span>
            </span>
            <div className="text-2xl font-black font-mono text-[var(--color-text-primary)]">
              {roiMetrics.legalHoursSaved} hrs
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
              ~2.7 hrs per manual asset review
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fine Risk Avoided</span>
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ${formatNumber(roiMetrics.riskAvoidedUsd)}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
              FTC/SEC statutory penalty model
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>Convergence Rate</span>
            </span>
            <div className="text-2xl font-black font-mono text-[var(--color-text-primary)]">
              {formatPercent(roiMetrics.convergenceRate)}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
              Post-Backtest Rule Alignment
            </span>
          </div>
        </div>
      </div>

      {/* Rule Friction & Health Telemetry Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Rule Friction &amp; Health Telemetry
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            Diagnostic alert threshold: &gt;20% human override rate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isFriction =
              item.diagnostic_status === "SCOPE_MISMATCH" ||
              item.diagnostic_status === "HIGH_OVERRIDE_DRIFT";

            return (
              <div
                key={item.id || item.rule_code}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isFriction
                    ? "border-amber-500/30 bg-amber-500/5 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                    {item.rule_code}
                  </span>
                  <Badge
                    variant={isFriction ? "warning" : "success"}
                    size="sm"
                  >
                    {item.diagnostic_status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-[var(--color-text-primary)]">
                    {formatPercent(item.override_rate)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Override Rate ({formatNumber(item.total_overrides)}/{formatNumber(item.total_evaluations)})
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-xs pt-3 border-t border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[var(--color-text-muted)]">Total Flags:</span>
                    <span className="font-mono font-semibold text-[var(--color-text-primary)]">
                      {formatNumber(item.total_flags)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[var(--color-text-muted)] shrink-0">Primary Override:</span>
                    <span className="font-mono text-[11px] truncate max-w-[180px] text-[var(--color-text-primary)]">
                      {item.primary_override_reason}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
