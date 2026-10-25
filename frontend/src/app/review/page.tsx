"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Scale,
  UserCheck,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

interface ReasonCode {
  id: string;
  code: string;
  title: string;
  description?: string;
}

interface FindingItem {
  id: string;
  rule_code: string;
  category: string;
  severity: string;
  title: string;
  matched_text: string;
  receipt_a_draft_span: string;
  receipt_b_rule_quote: string;
  source_document_title: string;
  source_section: string;
  status: "PENDING_REVIEW" | "OVERRIDDEN" | "FIXED";
  override_reason?: string;
  justification?: string;
}

export default function ReviewQueuePage() {
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(null);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>("SCOPE_MISMATCH");
  const [justification, setJustification] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);
  const [overrideErrorMsg, setOverrideErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize demo review items or fetch from API
  const loadReviewData = async () => {
    try {
      // 1. Fetch reason codes taxonomy
      const rcRes = await fetch("/api/v1/governance/reason-codes");
      if (rcRes.ok) {
        const rcData = await rcRes.json();
        setReasonCodes(rcData);
        if (rcData.length > 0) {
          setSelectedReasonCode(rcData[0].code);
        }
      }

      // 2. Fetch submissions to extract findings
      const subRes = await fetch("/api/v1/submissions");
      let allFindings: FindingItem[] = [];

      if (subRes.ok) {
        const subData = await subRes.json();
        for (const sub of subData) {
          const checkRes = await fetch(`/api/v1/submissions/${sub.id}/checks`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.length > 0 && checkData[0].findings) {
              allFindings = [...allFindings, ...checkData[0].findings];
            }
          }
        }
      }

      // Fallback demo queue if empty
      if (allFindings.length === 0) {
        allFindings = [
          {
            id: "f-01",
            rule_code: "TERM-001",
            category: "TERMINOLOGY",
            severity: "CRITICAL",
            title: "Prohibited Financial Verb: 'Bank on us'",
            matched_text: "Bank on us",
            receipt_a_draft_span: "Bank on us",
            receipt_b_rule_quote:
              "The verb 'bank' must not be used unqualified to describe services unless direct banking charter applies.",
            source_document_title: "Statutory Financial Guidelines 2026",
            source_section: "SECTION 1.2: BANKING VERB RESTRICTIONS",
            status: "PENDING_REVIEW",
          },
          {
            id: "f-02",
            rule_code: "TONE-002",
            category: "TONE",
            severity: "WARNING",
            title: "Informal Slang & Hype Terminology",
            matched_text: "super dope yields",
            receipt_a_draft_span: "super dope yields",
            receipt_b_rule_quote:
              "Informal slang, hyperbole, and buzzwords are banned in editorial copy.",
            source_document_title: "Editorial Voice Guidelines",
            source_section: "SECTION 3.4: TONE & EDITORIAL DICTION",
            status: "PENDING_REVIEW",
          },
          {
            id: "f-03",
            rule_code: "CLAIM-001",
            category: "CLAIM",
            severity: "CRITICAL",
            title: "Expired Factual Claim: CLAIM-001",
            matched_text: "rated #1 banking app with 99.99% uptime",
            receipt_a_draft_span: "rated #1 banking app with 99.99% uptime",
            receipt_b_rule_quote:
              "Claim: 'rated #1 banking app with 99.99% uptime' Substantiation: Q4 2024 Benchmark Report (Expired 2025-01-01)",
            source_document_title: "Approved Claims Ledger",
            source_section: "CLAIMS & SUBSTANTIATION LEDGER",
            status: "PENDING_REVIEW",
          },
        ];
      }

      setFindings(allFindings);
    } catch {
      // Keep fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, []);

  const handleOpenOverrideModal = (finding: FindingItem) => {
    setSelectedFinding(finding);
    setJustification("");
    setOverrideSuccessMsg(null);
    setOverrideErrorMsg(null);
  };

  const handleCloseModal = () => {
    setSelectedFinding(null);
    setJustification("");
  };

  const handleSubmitOverride = async () => {
    if (!selectedFinding || justification.trim().length < 5) return;
    setIsSubmittingOverride(true);
    setOverrideErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/findings/${selectedFinding.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_code: selectedReasonCode,
          justification,
          decision_type: "OVERRIDE",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Override submission failed.");
      }

      // Update state locally
      setFindings((prev) =>
        prev.map((f) =>
          f.id === selectedFinding.id
            ? {
                ...f,
                status: "OVERRIDDEN",
                override_reason: selectedReasonCode,
                justification,
              }
            : f
        )
      );

      setOverrideSuccessMsg(
        `Finding ${selectedFinding.rule_code} successfully overridden with reason ${selectedReasonCode}. Written to compliance audit trail.`
      );
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record override.";
      setOverrideErrorMsg(msg);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider mb-1">
            <span>SCR-05 & SCR-06</span>
            <span>•</span>
            <span>Human Reviewer Workflow</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Compliance Review Queue & Override Decisions
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Review flagged double receipts. Human reviewers can grant justified exceptions with mandatory taxonomy reason codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadReviewData}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] text-xs text-[#FAFAFA] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Queue Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-[#A1A1AA]">Pending Review</span>
          <span className="text-2xl font-bold font-mono text-amber-400">
            {findings.filter((f) => f.status === "PENDING_REVIEW").length}
          </span>
        </div>
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-[#A1A1AA]">Human Overrides Recorded</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {findings.filter((f) => f.status === "OVERRIDDEN").length}
          </span>
        </div>
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-[#A1A1AA]">Reason Taxonomy Codes</span>
          <span className="text-2xl font-bold font-mono text-blue-400">
            {reasonCodes.length || 13}
          </span>
        </div>
      </div>

      {/* Findings List */}
      <div className="flex flex-col gap-4">
        {findings.map((f) => (
          <div
            key={f.id}
            className={`border rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6 transition ${
              f.status === "OVERRIDDEN"
                ? "bg-[#18181B]/60 border-emerald-500/20"
                : "bg-[#18181B] border-[#27272A]"
            }`}
          >
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                    f.severity === "CRITICAL"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {f.severity}
                </span>
                <span className="font-mono text-xs font-semibold text-white">{f.rule_code}</span>
                <span className="text-xs text-[#71717A] uppercase font-mono">{f.category}</span>

                {f.status === "OVERRIDDEN" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ml-auto">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>OVERRIDDEN ({f.override_reason || "EXCEPTION"})</span>
                  </span>
                )}
              </div>

              <h2 className="text-base font-medium text-white">{f.title}</h2>

              {/* Double Receipt Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Receipt A */}
                <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-[#A1A1AA]">RECEIPT A: DRAFT SPAN</span>
                  <p className="text-xs font-mono text-red-300 font-medium">
                    &ldquo;{f.receipt_a_draft_span}&rdquo;
                  </p>
                </div>

                {/* Receipt B */}
                <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-[#A1A1AA]">
                    RECEIPT B: ACTIVE POLICY EXCERPT ({f.source_document_title})
                  </span>
                  <p className="text-xs font-mono text-blue-300/90 leading-relaxed">
                    &ldquo;{f.receipt_b_rule_quote}&rdquo;
                  </p>
                </div>
              </div>

              {f.justification && (
                <div className="p-2.5 rounded bg-[#09090B] border border-[#27272A] text-xs text-[#A1A1AA]">
                  <strong className="text-white">Reviewer Justification:</strong> {f.justification}
                </div>
              )}
            </div>

            {/* Action Column */}
            <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
              {f.status === "PENDING_REVIEW" ? (
                <button
                  type="button"
                  onClick={() => handleOpenOverrideModal(f)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Override Finding</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                  <UserCheck className="w-4 h-4" />
                  <span>Logged in Audit Log</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Override Finding Modal (SCR-06) */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Record Reviewer Override ({selectedFinding.rule_code})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#71717A] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Recording an override resolves this finding and registers your identity in the immutable compliance audit log. A mandatory reason code and human justification are required.
            </p>

            {overrideSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {overrideSuccessMsg}
              </div>
            )}

            {overrideErrorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {overrideErrorMsg}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reason-code-select" className="text-xs font-medium text-[#A1A1AA]">
                  Reason Code Taxonomy
                </label>
                <select
                  id="reason-code-select"
                  value={selectedReasonCode}
                  onChange={(e) => setSelectedReasonCode(e.target.value)}
                  className="bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {reasonCodes.map((rc) => (
                    <option key={rc.code} value={rc.code}>
                      {rc.code} — {rc.title}
                    </option>
                  ))}
                  {reasonCodes.length === 0 && (
                    <>
                      <option value="SCOPE_MISMATCH">SCOPE_MISMATCH — Scope Mismatch</option>
                      <option value="APPROVED_CAMPAIGN_EXCEPTION">
                        APPROVED_CAMPAIGN_EXCEPTION — Approved Campaign Exception
                      </option>
                      <option value="JUSTIFIED_EDUCATIONAL_CONTEXT">
                        JUSTIFIED_EDUCATIONAL_CONTEXT — Justified Educational Context
                      </option>
                      <option value="PARTNER_PORTAL_EXEMPTION">
                        PARTNER_PORTAL_EXEMPTION — Partner Portal Exemption
                      </option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <label htmlFor="justification-textarea" className="font-medium">
                    Human Reviewer Justification
                  </label>
                  <span className="font-mono text-[10px] text-[#71717A]">min 5 chars</span>
                </div>
                <textarea
                  id="justification-textarea"
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="bg-[#09090B] border border-[#27272A] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                  placeholder="Explain why this copy is permitted under exception..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272A]">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmittingOverride}
                className="px-4 py-2 rounded-lg border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitOverride}
                disabled={isSubmittingOverride || justification.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                {isSubmittingOverride ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording Decision...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Commit Override Decision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
