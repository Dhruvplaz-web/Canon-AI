"use client";

import React, { useState } from "react";
import { Copy, Check, Quote, Shield, FileText, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

export interface RuleDetail {
  id: string;
  rule_code: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  pattern_or_term: string | null;
  suggested_replacement: string | null;
  source_citation: {
    document_title?: string;
    section?: string;
    page?: number | string;
    exact_quote?: string;
    [key: string]: unknown;
  };
  is_active: boolean;
}

interface RuleDetailSheetProps {
  rule: RuleDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RuleDetailSheet({ rule, isOpen, onClose }: RuleDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!rule) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rule.rule_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-2 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-xs font-mono font-bold text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition"
              title="Click to copy rule code"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{rule.rule_code}</span>
            </button>
            <StatusBadge
              status={
                rule.severity === "CRITICAL"
                  ? "CRITICAL"
                  : rule.severity === "MAJOR"
                  ? "WARNING"
                  : "INFO"
              }
            />
          </div>
          <SheetTitle className="text-lg font-bold text-[var(--color-text-primary)]">
            {rule.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-[var(--color-text-secondary)]">
            Category: <strong className="text-[var(--color-text-primary)]">{rule.category}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 text-xs">
          {/* Target Pattern / Term */}
          {rule.pattern_or_term && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
                Target Pattern / Prohibited Term
              </span>
              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] font-mono text-xs text-rose-600 dark:text-rose-400">
                {rule.pattern_or_term}
              </div>
            </div>
          )}

          {/* Suggested Fix */}
          {rule.suggested_replacement && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
                Approved Regulatory Remediation
              </span>
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 font-medium text-xs leading-relaxed">
                {rule.suggested_replacement}
              </div>
            </div>
          )}

          {/* Verbatim Source Citation (Dual Grounding Policy Excerpt) */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
              <Quote className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Verbatim Statutory Policy Excerpt</span>
            </div>

            {rule.source_citation?.exact_quote ? (
              <blockquote className="p-3.5 rounded-lg border-l-4 border-l-[var(--color-primary)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-xs italic text-[var(--color-text-primary)] leading-relaxed">
                &ldquo;{rule.source_citation.exact_quote}&rdquo;
              </blockquote>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                General brand guideline policy document.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-[var(--color-text-secondary)] font-mono">
              <div className="p-2 rounded bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)] block text-[10px]">DOCUMENT</span>
                <span className="truncate block font-semibold text-[var(--color-text-primary)]">
                  {rule.source_citation?.document_title || "Official Guidelines"}
                </span>
              </div>
              <div className="p-2 rounded bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)] block text-[10px]">SECTION</span>
                <span className="truncate block font-semibold text-[var(--color-text-primary)]">
                  {rule.source_citation?.section || "Section 1"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
