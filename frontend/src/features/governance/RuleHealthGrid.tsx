"use client";

import React from "react";
import { Activity, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";
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
  return (
    <section className="space-y-4">
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

              {/* Formatted Percentage Override Rate (Fixes NEW-01 math bug) */}
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
    </section>
  );
}
