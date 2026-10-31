"use client";

import React from "react";
import { Shield, X, Check, Minus, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface RbacPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionRow {
  capability: string;
  category: "Authoring" | "Review & Signoff" | "Governance & Policy" | "Platform Security";
  description: string;
  creator: boolean;
  reviewer: boolean;
  brandManager: boolean;
  legalCounsel: boolean;
  agency: boolean;
}

const PERMISSIONS_DATA: PermissionRow[] = [
  {
    capability: "Real-Time Pre-Flight AST Scan",
    category: "Authoring",
    description: "Scan marketing draft copy against active rules under 12ms",
    creator: true,
    reviewer: true,
    brandManager: true,
    legalCounsel: true,
    agency: true,
  },
  {
    capability: "Multi-Modal Visual Creative Parser",
    category: "Authoring",
    description: "Run 8pt disclaimer, WCAG contrast, and IAB banner analysis",
    creator: true,
    reviewer: true,
    brandManager: true,
    legalCounsel: true,
    agency: true,
  },
  {
    capability: "Vernacular & Hinglish NLP Radar",
    category: "Authoring",
    description: "Scan code-mixed Indic claims for bipartite surrogates & false urgency",
    creator: true,
    reviewer: true,
    brandManager: true,
    legalCounsel: true,
    agency: true,
  },
  {
    capability: "Override Policy Finding with Reason Code",
    category: "Review & Signoff",
    description: "Adjudicate flagged findings and attach formal justification codes",
    creator: false,
    reviewer: true,
    brandManager: true,
    legalCounsel: true,
    agency: false,
  },
  {
    capability: "Dual-Key Final Release Sign-Off",
    category: "Review & Signoff",
    description: "Issue signed release certificate admissible under Evidence Act Sec 65B",
    creator: false,
    reviewer: false,
    brandManager: true,
    legalCounsel: true,
    agency: false,
  },
  {
    capability: "Trip Programmatic Ad-Spend Firewall",
    category: "Governance & Policy",
    description: "Trigger live webhook circuit breaker to halt ad spend across Meta/Google",
    creator: false,
    reviewer: false,
    brandManager: true,
    legalCounsel: false,
    agency: false,
  },
  {
    capability: "Simulate Empirical Policy Backtest",
    category: "Governance & Policy",
    description: "Backtest proposed rule amendments against 2,500 historical corpus submissions",
    creator: false,
    reviewer: false,
    brandManager: true,
    legalCounsel: true,
    agency: false,
  },
  {
    capability: "Adopt Policy Version (v1.0 -> v1.1)",
    category: "Governance & Policy",
    description: "Promote draft proposals to live production brand guidelines",
    creator: false,
    reviewer: false,
    brandManager: true,
    legalCounsel: false,
    agency: false,
  },
  {
    capability: "Inspect Cryptographic SHA-256 Audit Ledger",
    category: "Platform Security",
    description: "Browse immutable Merkle root certificates and tamper-evident hashes",
    creator: true,
    reviewer: true,
    brandManager: true,
    legalCounsel: true,
    agency: false,
  },
  {
    capability: "Generate Scoped Developer API Keys",
    category: "Platform Security",
    description: "Mint live API tokens for CI/CD pipelines and external DSP integrations",
    creator: false,
    reviewer: false,
    brandManager: true,
    legalCounsel: false,
    agency: false,
  },
];

export function RbacPermissionsModal({ isOpen, onClose }: RbacPermissionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--color-surface)] border-2 border-[var(--color-border-subtle)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0 bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Enterprise Role-Based Access Control (RBAC) Matrix
                </h3>
                <Badge variant="outline" size="sm">
                  SOC 2 Type II
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Segregation of duties (SoD) enforcement across copywriters, compliance reviewers, and policy authorities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1.5 rounded-lg transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Dual-Key Sign-Off Invariant:</strong> Creators cannot approve their own copy. Overrides require certified Reviewer adjudication, and release certificates mandate Brand Manager dual-key signoff.
            </span>
          </div>

          <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border-subtle)] font-mono text-[11px] text-[var(--color-text-muted)]">
                  <th className="py-3 px-4 font-semibold">Capability / Operation</th>
                  <th className="py-3 px-2 text-center font-semibold">Creator</th>
                  <th className="py-3 px-2 text-center font-semibold">Reviewer</th>
                  <th className="py-3 px-2 text-center font-semibold">Brand Mgr</th>
                  <th className="py-3 px-2 text-center font-semibold">Legal Counsel</th>
                  <th className="py-3 px-2 text-center font-semibold">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {PERMISSIONS_DATA.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[var(--color-text-primary)]">
                        {row.capability}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {row.description}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.creator ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.reviewer ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.brandManager ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.legalCounsel ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.agency ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between text-xs text-[var(--color-text-muted)] shrink-0">
          <span>Enterprise Access Protocol v3.2 • Adheres to ISO/IEC 27001 Access Standards</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
