"use client";

import React, { useState } from "react";
import { AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export interface ReasonCode {
  code: string;
  title: string;
  description?: string;
}

export interface ReviewItem {
  id: string;
  rule_code: string;
  title: string;
  severity: string;
  matched_text: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  submission_title: string;
  submission_id?: string;
  status: string;
}

interface SingleOverrideModalProps {
  item: ReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  reasonCodes: ReasonCode[];
  onConfirm: (findingId: string, reasonCode: string, notes: string) => Promise<void>;
}

export function SingleOverrideModal({
  item,
  isOpen,
  onClose,
  reasonCodes,
  onConfirm,
}: SingleOverrideModalProps) {
  const [selectedCode, setSelectedCode] = useState<string>("RC-01");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm(item.id, selectedCode, notes);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Compliance Override</DialogTitle>
          <DialogDescription>
            Record human regulatory adjudication for rule{" "}
            <strong className="text-[var(--color-text-primary)] font-mono">{item.rule_code}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Finding Excerpt Summary */}
          <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--color-text-muted)] block">
              FLAGGED DRAFT TEXT
            </span>
            <p className="font-mono text-rose-600 dark:text-rose-400 font-semibold truncate">
              &ldquo;{item.matched_text || item.receipt_a_draft_span}&rdquo;
            </p>
          </div>

          {/* Reason Code Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="reason-code-select" className="font-semibold text-[var(--color-text-secondary)] block">
              Justification Reason Code (Mandatory)
            </label>
            <select
              id="reason-code-select"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {reasonCodes.map((rc) => (
                <option key={rc.code} value={rc.code}>
                  {rc.code}: {rc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reviewer Notes */}
          <div className="space-y-1.5">
            <label htmlFor="override-notes" className="font-semibold text-[var(--color-text-secondary)] block">
              Reviewer Adjudication Rationale
            </label>
            <textarea
              id="override-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context on why this exception is compliant under regulatory policy..."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Confirm & Sign Override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BulkOverrideModalProps {
  selectedItems?: ReviewItem[];
  items?: ReviewItem[];
  isOpen: boolean;
  onClose: () => void;
  reasonCodes: ReasonCode[];
  onConfirmBatch?: (items: ReviewItem[], reasonCode: string, notes: string) => Promise<void>;
  onConfirm?: (items: ReviewItem[], reasonCode: string, notes: string) => Promise<void>;
}

export function BulkOverrideModal({
  selectedItems,
  items,
  isOpen,
  onClose,
  reasonCodes,
  onConfirmBatch,
  onConfirm,
}: BulkOverrideModalProps) {
  const [selectedCode, setSelectedCode] = useState<string>("RC-01");
  const [notes, setNotes] = useState<string>(
    "Batch exception approved per marketing campaign exception guidelines."
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const finalItems = selectedItems || items || [];
  const handleBatchConfirm = onConfirmBatch || onConfirm || (() => Promise.resolve());

  // F36: Filter out critical violations from batch overrides
  const criticalItems = finalItems.filter((i) => i.severity === "CRITICAL");
  const eligibleItems = finalItems.filter((i) => i.severity !== "CRITICAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleItems.length === 0) return;
    setIsSubmitting(true);
    await handleBatchConfirm(eligibleItems, selectedCode, notes);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Compliance Override</DialogTitle>
          <DialogDescription>
            Record batch adjudication for {eligibleItems.length} non-critical findings.
          </DialogDescription>
        </DialogHeader>

        {/* F36 Enforced Banner if Criticals were selected */}
        {criticalItems.length > 0 && (
          <div
            role="alert"
            className="p-3 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 font-medium"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <span className="font-bold block">
                {criticalItems.length} Critical Violation(s) Excluded (Standard F36)
              </span>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                Critical findings cannot be batch-overridden. Each critical violation must be evaluated individually with statutory justification or remediated in the draft.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="batch-reason-select" className="font-semibold text-[var(--color-text-secondary)] block">
              Justification Reason Code
            </label>
            <select
              id="batch-reason-select"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {reasonCodes.map((rc) => (
                <option key={rc.code} value={rc.code}>
                  {rc.code}: {rc.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="batch-override-notes" className="font-semibold text-[var(--color-text-secondary)] block">
              Batch Adjudication Notes
            </label>
            <textarea
              id="batch-override-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || eligibleItems.length === 0}
            >
              {isSubmitting ? "Processing..." : `Override ${eligibleItems.length} Items`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
