"use client";

import React from "react";
import { CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, ArrowRight, Layers } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ReviewItem } from "./OverrideModals";

export interface ReviewTableProps {
  items: ReviewItem[];
  selectedItemIds?: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onSelectionChange?: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenOverride?: (item: ReviewItem) => void;
  onOverride?: (item: ReviewItem) => void;
  onOpenBatchOverride?: () => void;
  onBatchOverride?: () => void;
  isLoading?: boolean;
}

export function ReviewTable({
  items,
  selectedItemIds,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectionChange,
  onOpenOverride,
  onOverride,
  onOpenBatchOverride,
  onBatchOverride,
  isLoading,
}: ReviewTableProps) {
  const activeIds = selectedItemIds || selectedIds || [];
  const handleOverride = onOpenOverride || onOverride || (() => {});
  const handleBatch = onOpenBatchOverride || onBatchOverride || (() => {});

  const handleToggle = (id: string) => {
    if (onToggleSelect) {
      onToggleSelect(id);
    } else if (onSelectionChange) {
      onSelectionChange((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Review Queue is Clear"
        description="There are currently no flagged compliance findings matching your active filter criteria."
      />
    );
  }

  const allSelected = items.length > 0 && activeIds.length === items.length;

  return (
    <div className="space-y-4">
      {/* Batch Actions Bar (when 1 or more items selected) */}
      {activeIds.length > 0 && (
        <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex items-center justify-between gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {activeIds.length} item(s) selected
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleBatch}
            className="text-xs"
          >
            Batch Override Selected
          </Button>
        </div>
      )}

      {/* Responsive Items List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = activeIds.includes(item.id);
          const isPending = item.status === "PENDING_REVIEW";
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {isPending && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(item.id)}
                      className="rounded border-[var(--color-border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4"
                      aria-label={`Select finding ${item.rule_code}`}
                    />
                  )}
                  <span className="px-1.5 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                    {item.rule_code}
                  </span>
                  <StatusBadge
                    status={
                      item.severity === "CRITICAL"
                        ? "CRITICAL"
                        : item.severity === "WARNING"
                        ? "WARNING"
                        : "INFO"
                    }
                  />
                  <Badge variant={isPending ? "warning" : "success"} size="sm">
                    {isPending ? "Pending Review" : "Overridden & Approved"}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {item.submission_title}
                  </span>
                </div>

                {isPending && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOverride(item)}
                    className="text-xs h-7 px-2.5"
                  >
                    <span>Record Override</span>
                  </Button>
                )}
              </div>

              <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                {item.title}
              </h4>

              {/* Dual Grounding Excerpts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                    FLAGGED DRAFT SPAN
                  </span>
                  <p className="font-mono text-rose-600 dark:text-rose-400 font-semibold truncate">
                    &ldquo;{item.matched_text || item.receipt_a_draft_span}&rdquo;
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                    STATUTORY POLICY RULE
                  </span>
                  <p className="text-[var(--color-text-secondary)] italic line-clamp-2">
                    &ldquo;{item.receipt_b_rule_quote}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
