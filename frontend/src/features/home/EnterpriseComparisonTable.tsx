"use client";

import React from "react";
import { Check, X, Minus, Shield, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ComparisonItem {
  feature: string;
  category: string;
  canon: {
    status: "full";
    note: string;
  };
  manual: {
    status: "none" | "partial";
    note: string;
  };
  genericLlm: {
    status: "none" | "partial";
    note: string;
  };
}

const COMPARISON_DATA: ComparisonItem[] = [
  {
    feature: "Inference Latency & Velocity",
    category: "Performance",
    canon: {
      status: "full",
      note: "< 12ms deterministic AST parsing; sub-second visual OCR",
    },
    manual: {
      status: "none",
      note: "48 – 72 hours turnaround per creative iteration",
    },
    genericLlm: {
      status: "partial",
      note: "3 – 8 seconds with unpredictable network jitter",
    },
  },
  {
    feature: "Double-Receipt Grounding Invariant",
    category: "Evidence",
    canon: {
      status: "full",
      note: "100% verified: exact draft span paired with exact statutory excerpt",
    },
    manual: {
      status: "partial",
      note: "Subjective human memory; inconsistent clause citations",
    },
    genericLlm: {
      status: "none",
      note: "High hallucination risk; creates non-existent regulations",
    },
  },
  {
    feature: "Multi-Modal Visual Creative Parsing",
    category: "Vision",
    canon: {
      status: "full",
      note: "Dual-OCR (Tesseract + Cloud Vision), 8pt font rule, WCAG contrast",
    },
    manual: {
      status: "partial",
      note: "Manual pixel ruler checks; error-prone font measuring",
    },
    genericLlm: {
      status: "none",
      note: "Text-only or coarse multimodal without exact coordinate bounding",
    },
  },
  {
    feature: "Vernacular & Hinglish Code-Mixed Radar",
    category: "Detection",
    canon: {
      status: "full",
      note: "Detects bipartite surrogate taglines ('asli swad', 'shaan') in Indic scripts",
    },
    manual: {
      status: "partial",
      note: "Requires specialized bilingual legal staff across 12 states",
    },
    genericLlm: {
      status: "none",
      note: "Translates away nuance; misses disguised surrogate brand cues",
    },
  },
  {
    feature: "Automated Ad-Server Circuit Breaker",
    category: "Enforcement",
    canon: {
      status: "full",
      note: "Direct Meta Ads & Google Ads API kill-switch within 15 seconds",
    },
    manual: {
      status: "none",
      note: "Requires frantic phone calls after campaigns already launched",
    },
    genericLlm: {
      status: "none",
      note: "Read-only text generator with zero programmatic integrations",
    },
  },
  {
    feature: "Indian Evidence Act Sec 65B Audit Trail",
    category: "Compliance",
    canon: {
      status: "full",
      note: "SHA-256 hash chains, immutable timestamps, legal cert generator",
    },
    manual: {
      status: "partial",
      note: "Scattered Slack threads, lost email chains, non-standard PDFs",
    },
    genericLlm: {
      status: "none",
      note: "No persistent tamper-evident audit ledger or digital sign-offs",
    },
  },
  {
    feature: "Historical Exception Backtesting",
    category: "Governance",
    canon: {
      status: "full",
      note: "Replay proposed policy edits across 5,000+ historical creatives",
    },
    manual: {
      status: "none",
      note: "Impossible to re-read thousands of legacy creative files",
    },
    genericLlm: {
      status: "none",
      note: "No concept of historical corpus indexing or blast radius",
    },
  },
  {
    feature: "Enterprise Multi-Tenant RBAC",
    category: "Security",
    canon: {
      status: "full",
      note: "Okta SAML 2.0, TOTP MFA, 5 isolated roles (Creator, Legal, Agency)",
    },
    manual: {
      status: "partial",
      note: "Google Drive links with leaky file permission management",
    },
    genericLlm: {
      status: "none",
      note: "Shared API key or single consumer login without role isolation",
    },
  },
];

export function EnterpriseComparisonTable() {
  return (
    <div className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-md overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>COMPETITIVE ARCHITECTURE</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Why Generic LLMs and Manual Review Fail at Scale
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
            Brand safety requires deterministic AST verification, sub-12ms response times, and legal Section 65B admissibility.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs self-start md:self-auto py-1">
          Zero Hallucination Moat
        </Badge>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/50 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <th className="py-4 px-6 w-1/3">Capability &amp; Architectural Moat</th>
              <th className="py-4 px-6 w-1/4 bg-[var(--color-primary)]/5 text-[var(--color-primary)] border-x border-[var(--color-primary)]/20">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Canon AI Platform</span>
                </div>
              </th>
              <th className="py-4 px-6 w-1/5">Manual Legal Review</th>
              <th className="py-4 px-6 w-1/5">Generic LLM Wrappers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)] text-xs">
            {COMPARISON_DATA.map((row, idx) => (
              <tr
                key={row.feature}
                className={idx % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-muted)]/20"}
              >
                {/* Feature Name & Category */}
                <td className="py-4 px-6">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--color-text-primary)] block">
                      {row.feature}
                    </span>
                    <Badge variant="secondary" size="sm" className="text-[10px] font-mono py-0">
                      {row.category}
                    </Badge>
                  </div>
                </td>

                {/* Canon AI Column */}
                <td className="py-4 px-6 bg-[var(--color-primary)]/5 border-x border-[var(--color-primary)]/20">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-medium text-[var(--color-text-primary)] leading-relaxed">
                      {row.canon.note}
                    </span>
                  </div>
                </td>

                {/* Manual Review Column */}
                <td className="py-4 px-6 text-[var(--color-text-secondary)]">
                  <div className="flex items-start gap-2">
                    {row.manual.status === "none" ? (
                      <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Minus className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      {row.manual.note}
                    </span>
                  </div>
                </td>

                {/* Generic LLM Column */}
                <td className="py-4 px-6 text-[var(--color-text-secondary)]">
                  <div className="flex items-start gap-2">
                    {row.genericLlm.status === "none" ? (
                      <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Minus className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      {row.genericLlm.note}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

