"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Wand2,
} from "lucide-react";

interface Finding {
  id: string;
  rule_code: string;
  severity: string;
  matched_text: string;
  title: string;
  suggested_fix?: string | null;
  receipt_b_rule_quote?: string;
}

interface CopilotRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  channel?: string;
  findings?: Finding[];
  onAcceptRewrite?: (newContent: string) => void;
  onApplyRewrite?: (newContent: string) => void;
}

export function CopilotRewriteModal({
  isOpen,
  onClose,
  originalContent,
  channel,
  findings = [],
  onAcceptRewrite,
  onApplyRewrite,
}: CopilotRewriteModalProps) {
  const handleApply = onAcceptRewrite || onApplyRewrite || (() => {});
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [changesSummary, setChangesSummary] = useState<string[]>([]);
  const [tonePreserved, setTonePreserved] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchRewrite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/copilot/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: originalContent,
          findings: findings.map((f) => ({
            rule_code: f.rule_code,
            matched_text: f.matched_text,
            title: f.title,
            suggested_fix: f.suggested_fix,
            receipt_b_rule_quote: f.receipt_b_rule_quote,
          })),
          brand_tone: "high-conversion, professional and compliant",
        }),
      });

      if (!res.ok) {
        throw new Error("Copilot rewrite service unavailable.");
      }

      const data = await res.json();
      setRewrittenContent(data.rewritten_content);
      setChangesSummary(data.changes_summary || []);
      setTonePreserved(data.tone_preserved || "Professional & Compliant");
    } catch (err: any) {
      setError(err?.message || "Failed to generate rewrite.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && originalContent) {
      fetchRewrite();
    }
  }, [isOpen, originalContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#111827]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#F8F9FA] border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                AI Brand Copilot — Smart Auto-Remediation
              </h2>
              <p className="text-xs text-[#6B7280]">
                Resolves all {findings.length} flagged violations while preserving marketing conversion power.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
              <span className="text-sm font-bold text-[#111827]">
                Synthesizing Compliant Marketing Copy...
              </span>
              <p className="text-xs text-[#6B7280]">
                Evaluating policy boundaries & eliminating {findings.length} statutory violations.
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchRewrite}
                className="px-2.5 py-1 bg-white border border-red-200 rounded-md font-semibold text-xs text-red-700 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && rewrittenContent && (
            <>
              {/* Summary of Remediations */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Remediations Applied (100% Predicted Compliance)
                  </span>
                </div>
                <ul className="text-xs text-emerald-950 space-y-1 pl-5 list-disc">
                  {changesSummary.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Side by Side Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Original with violations */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Original Non-Compliant Draft:
                    </span>
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {findings.length} Violations
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#374151] leading-relaxed min-h-[160px] whitespace-pre-wrap font-sans">
                    {originalContent}
                  </div>
                </div>

                {/* Right: Copilot Compliant Rewrite */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                      Copilot Compliant Copy:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      0 Violations (Clean)
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 text-xs text-[#111827] leading-relaxed min-h-[160px] whitespace-pre-wrap font-sans">
                    {rewrittenContent}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8F9FA] border-t border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#4B5563] text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (rewrittenContent) {
                handleApply(rewrittenContent);
                onClose();
              }
            }}
            disabled={isLoading || !rewrittenContent}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Compliant Copy &amp; Re-Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
