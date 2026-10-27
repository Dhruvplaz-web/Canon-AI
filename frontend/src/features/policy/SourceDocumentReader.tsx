"use client";

import React, { useMemo } from "react";
import { FileText, Shield } from "lucide-react";
import type { RuleDetail } from "./RuleDetailSheet";

interface SourceDocumentReaderProps {
  extractedText: string;
  rules: RuleDetail[];
  selectedRuleCode: string | null;
  onSelectRule: (rule: RuleDetail) => void;
}

export function SourceDocumentReader({
  extractedText,
  rules,
  selectedRuleCode,
  onSelectRule,
}: SourceDocumentReaderProps) {
  const lines = useMemo(() => extractedText.split("\n"), [extractedText]);

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-6 shadow-xs flex flex-col h-[700px] overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
          <FileText className="w-4 h-4 text-[var(--color-primary)]" />
          <span>Statutory Source Guidelines</span>
        </span>
        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
          Verbatim Dual-Grounding Excerpts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs leading-relaxed select-text">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={`empty-${idx}`} className="h-2" />;
          }

          const matchedRule = rules.find((r) => {
            const quote = r.source_citation?.exact_quote;
            return quote && (line.includes(quote) || quote.includes(trimmed));
          });

          const isSelected = matchedRule && selectedRuleCode === matchedRule.rule_code;

          if (matchedRule) {
            return (
              <div
                key={`line-${idx}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRule(matchedRule)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRule(matchedRule);
                  }
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] font-semibold shadow-xs"
                    : "border-blue-500/20 bg-blue-500/5 hover:border-[var(--color-border-strong)] text-[var(--color-text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-white text-[10px] font-mono font-bold">
                    {matchedRule.rule_code}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    {matchedRule.title}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] font-mono text-[var(--color-primary)] font-bold">
                      Active Citation &bull;
                    </span>
                  )}
                </div>
                <p className="font-sans font-medium text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {line}
                </p>
              </div>
            );
          }

          if (trimmed.startsWith("SECTION")) {
            return (
              <div
                key={`section-${idx}`}
                className="pt-3 pb-1 font-bold text-xs font-mono text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]"
              >
                {line}
              </div>
            );
          }

          return (
            <p key={`p-${idx}`} className="font-mono text-[var(--color-text-muted)] text-[11px] px-1">
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
