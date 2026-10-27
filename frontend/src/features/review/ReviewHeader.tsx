"use client";

import React from "react";
import { ShieldCheck, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ReviewHeaderProps {
  viewMode: "queue" | "signoff";
  onViewModeChange: (mode: "queue" | "signoff") => void;
  pendingCount?: number;
  pendingFindingsCount?: number;
  submissionsCount?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ReviewHeader({
  viewMode,
  onViewModeChange,
  pendingCount = 0,
  pendingFindingsCount,
  onRefresh,
  isRefreshing = false,
}: ReviewHeaderProps) {
  const displayPending = pendingFindingsCount !== undefined ? pendingFindingsCount : pendingCount;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Human Review &amp; Adjudication
          </h1>
          <Badge variant="warning" size="sm">
            {displayPending} Pending Triage
          </Badge>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Adjudicate flagged draft findings, record human override reason codes, and execute final release signoff.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Mode Switcher */}
        <div className="flex items-center bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => onViewModeChange("queue")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === "queue"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Findings Queue</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("signoff")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === "signoff"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Approver Signoff</span>
          </button>
        </div>

        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
