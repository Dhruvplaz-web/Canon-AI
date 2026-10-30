"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  Undo2,
  FileCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";

export interface Finding {
  id: string;
  rule_code: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  matched_text: string;
  start_offset: number;
  end_offset: number;
  suggested_fix?: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document_title: string;
  source_section: string;
  status: string;
}

interface FindingsListProps {
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  onApplyFix: (finding: Finding) => void;
  onApplyAllMinor: (minorFindings: Finding[]) => void;
  onOpenCertificateModal?: () => void;
  hasRunCheck: boolean;
  isChecking: boolean;
}

const getJurisdictionBadge = (code: string) => {
  switch (code) {
    case "ASCI-SURR-ALCO":
      return { label: "🇮🇳 ASCI Ch. III (Surrogate Alcobev)", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" };
    case "COTPA-SURR-TOB":
      return { label: "🇮🇳 COTPA Sec 5 (Surrogate Tobacco)", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" };
    case "MEITY-BETTING-01":
      return { label: "🇮🇳 MeitY '23 (Illegal Betting Surrogate)", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" };
    case "RBI-VERN-01":
      return { label: "🇮🇳 RBI '22 (Bina Document Credit)", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" };
    case "SEBI-VERN-02":
      return { label: "🇮🇳 SEBI '23 (Paisa Double Guarantee)", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
    case "CCPA-DARK-URGENCY":
      return { label: "🇮🇳 CCPA '23 (False Urgency Dark Pattern)", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" };
    case "DMRA-MAGIC-01":
      return { label: "🇮🇳 DMRA '54 (Shartiya Ilaaj Ban)", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" };
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

export function FindingsList({
  findings,
  selectedFindingId,
  onSelectFinding,
  onApplyFix,
  onApplyAllMinor,
  onOpenCertificateModal,
  hasRunCheck,
  isChecking,
}: FindingsListProps) {
  const [confirmBatchModal, setConfirmBatchModal] = useState(false);

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const warningCount = findings.filter((f) => f.severity === "WARNING").length;
  const minorCount = findings.filter((f) => f.severity === "INFO").length;

  const fixableMinorFindings = findings.filter(
    (f) => f.severity !== "CRITICAL" && f.suggested_fix
  );

  // Initial pristine state before any check is run
  if (!hasRunCheck && !isChecking) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Ready for Compliance Verification
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
            Click &ldquo;Run Compliance Check&rdquo; to analyze your copy against active brand policies, statutory claims, and injection safeguards.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="p-8 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-center space-y-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 mx-auto" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[var(--color-surface-muted)] rounded mx-auto" />
          <div className="h-3 w-64 bg-[var(--color-surface-muted)] rounded mx-auto" />
        </div>
      </div>
    );
  }

  // Passed State: 0 findings
  if (findings.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <span>All Pre-Flight Checks Passed</span>
              <Badge variant="success" size="sm">
                0 Violations
              </Badge>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Copy conforms with all active brand guidelines, verified statutory claims, and security rules.
            </p>
          </div>
        </div>

        {onOpenCertificateModal && (
          <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              Deterministic AST &bull; SHA-256 HMAC
            </span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenCertificateModal}
              className="gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Generate Compliance Release Certificate</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Findings Breakdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-[var(--color-text-primary)]">
            Findings ({findings.length}):
          </span>
          {criticalCount > 0 && (
            <Badge variant="destructive" size="sm">
              {criticalCount} Critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning" size="sm">
              {warningCount} Major
            </Badge>
          )}
          {minorCount > 0 && (
            <Badge variant="secondary" size="sm">
              {minorCount} Minor
            </Badge>
          )}
        </div>

        {fixableMinorFindings.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmBatchModal(true)}
            className="text-xs gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Apply All Minor Fixes ({fixableMinorFindings.length})</span>
          </Button>
        )}
      </div>

      {/* Real-Time Ad Spend & Statutory Risk Exposure Widget */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Ad Spend &amp; Statutory Regulatory Risk Exposure</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              HIGH REGULATORY RISK
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Publishing this ungrounded draft violates <strong>RBI Banking Regulation Act 1949 (Sec 7)</strong> and risks up to <strong>₹50 Lakhs (₹5,000,000)</strong> in statutory penalties under <strong>CCPA Section 21</strong>, along with mandatory ad pull-down orders under <strong>ASCI Code Section 1.4</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-rose-500/20 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Est. Media Flight</span>
              <span className="font-bold text-[var(--color-text-primary)]">₹25,00,000</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Max Statutory Fine</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">₹50,00,000</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Executive Action</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">1-Yr Director Ban</span>
            </div>
          </div>
        </div>
      )}

      {/* Findings Cards List */}
      <div className="space-y-3">
        {findings.map((f) => {
          const isSelected = selectedFindingId === f.id;
          return (
            <div
              key={f.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectFinding(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectFinding(f.id);
                }
              }}
              className={`p-4 rounded-xl border transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                    {f.rule_code}
                  </span>
                  {getJurisdictionBadge(f.rule_code) && (
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 ${getJurisdictionBadge(f.rule_code)!.color}`}>
                      <span>🇮🇳</span>
                      <span>{getJurisdictionBadge(f.rule_code)!.label}</span>
                    </span>
                  )}
                  <StatusBadge
                    status={
                      f.severity === "CRITICAL"
                        ? "CRITICAL"
                        : f.severity === "WARNING"
                        ? "WARNING"
                        : "INFO"
                    }
                  />
                  <Badge variant="outline" size="sm">
                    {f.category}
                  </Badge>
                </div>

                {f.suggested_fix && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyFix(f);
                    }}
                    className="text-xs h-7 px-2.5 gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Apply Fix</span>
                  </Button>
                )}
              </div>

              <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                {f.title}
              </h4>

              {/* Dual Grounding Citations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
                {/* Draft Citation Span */}
                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                    DRAFT CITATION SPAN
                  </span>
                  <p className="font-mono text-rose-600 dark:text-rose-400 font-semibold truncate">
                    &ldquo;{f.receipt_a_draft_span || f.matched_text}&rdquo;
                  </p>
                </div>

                {/* Policy Rule Excerpt */}
                <div className="p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                    STATUTORY POLICY EXCERPT
                  </span>
                  <p className="text-[var(--color-text-secondary)] italic line-clamp-2">
                    &ldquo;{f.receipt_b_rule_quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Indic Vernacular Diagnostic Trace */}
              {f.category === "VERNACULAR_STATUTORY" && (
                <div className="mt-2.5 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                      Indic NLP Trace
                    </span>
                    <span className="text-[var(--color-text-secondary)] font-mono text-[11px]">
                      Soundex-Indic Matched: &ldquo;{f.matched_text}&rdquo;
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                    Statutory Fine: ₹10,00,000 (CPA Sec 21)
                  </span>
                </div>
              )}

              {/* Remediation Preview */}
              {f.suggested_fix && (
                <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                  <span className="text-[10px] font-mono font-bold uppercase block text-emerald-700 dark:text-emerald-400">
                    APPROVED REMEDIATION
                  </span>
                  <span>{f.suggested_fix}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog for Batch Applying Minor Fixes */}
      <Dialog open={confirmBatchModal} onOpenChange={setConfirmBatchModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply All Minor Fixes?</DialogTitle>
            <DialogDescription>
              This will automatically substitute {fixableMinorFindings.length} non-critical phrases with approved guideline replacements. Critical findings must be reviewed individually.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmBatchModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onApplyAllMinor(fixableMinorFindings);
                setConfirmBatchModal(false);
              }}
            >
              Confirm &amp; Apply All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
