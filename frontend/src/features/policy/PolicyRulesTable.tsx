"use client";

import React from "react";
import { ArrowRight, Copy, Check, SearchX } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { RuleDetail } from "./RuleDetailSheet";

interface PolicyRulesTableProps {
  rules: RuleDetail[];
  selectedRuleCode: string | null;
  onSelectRule: (rule: RuleDetail) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

const getJurisdictionBadge = (code: string) => {
  switch (code) {
    case "TERM-001":
      return { label: "RBI Banking Reg. Sec 7", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" };
    case "TERM-004":
      return { label: "RBI Digital Lending '22", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" };
    case "TERM-003":
      return { label: "SEBI Ad Code", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" };
    case "CLAIM-001":
      return { label: "ASCI 1.4 • CCPA '22", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" };
    case "TERM-006":
      return { label: "CCPA Dark Patterns '23", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" };
    default:
      return null;
  }
};

export function PolicyRulesTable({
  rules,
  selectedRuleCode,
  onSelectRule,
  onResetFilters,
  isFiltered,
}: PolicyRulesTableProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (rules.length === 0) {
    return (
      <EmptyState
        title="No Rules Match Your Filter"
        description="Try adjusting your search query, selecting another category, or clearing your active filters."
        action={
          isFiltered && onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Clear All Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const isSelected = selectedRuleCode === rule.rule_code;
        return (
          <div
            key={rule.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRule(rule)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectRule(rule);
              }
            }}
            className={`p-4 rounded-xl border transition-all text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              isSelected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:shadow-xs"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, rule.rule_code)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition"
                  title="Click to copy rule code"
                >
                  {copiedCode === rule.rule_code ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{rule.rule_code}</span>
                </button>
                {getJurisdictionBadge(rule.rule_code) && (
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 ${getJurisdictionBadge(rule.rule_code)!.color}`}>
                    <span>🇮🇳</span>
                    <span>{getJurisdictionBadge(rule.rule_code)!.label}</span>
                  </span>
                )}
                <StatusBadge
                  status={
                    rule.severity === "CRITICAL"
                      ? "CRITICAL"
                      : rule.severity === "MAJOR"
                      ? "WARNING"
                      : "INFO"
                  }
                />
                <Badge variant="outline" size="sm">
                  {rule.category}
                </Badge>
              </div>

              <span className="text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-1 transition flex items-center gap-1">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
              {rule.title}
            </h3>

            {rule.pattern_or_term && (
              <p className="text-xs font-mono text-[var(--color-text-muted)] truncate max-w-2xl">
                Pattern: <span className="text-rose-600 dark:text-rose-400">{rule.pattern_or_term}</span>
              </p>
            )}

            {rule.source_citation?.exact_quote && (
              <p className="text-xs text-[var(--color-text-secondary)] italic mt-2 line-clamp-1 border-l-2 border-[var(--color-border-default)] pl-2">
                &ldquo;{rule.source_citation.exact_quote}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
