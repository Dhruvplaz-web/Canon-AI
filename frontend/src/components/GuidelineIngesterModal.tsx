"use client";

import React, { useState } from "react";
import {
  FileUp,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  BookOpen,
  AlertCircle,
  Plus,
} from "lucide-react";

interface ExtractedRule {
  rule_code: string;
  title: string;
  category: string;
  severity: string;
  exact_terms: string[];
  guideline_quote: string;
  suggested_replacement: string;
  rationale: string;
}

interface GuidelineIngesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestComplete?: (rules: ExtractedRule[]) => void;
  onSuccess?: () => void;
}

export function GuidelineIngesterModal({
  isOpen,
  onClose,
  onIngestComplete,
}: GuidelineIngesterModalProps) {
  const [docTitle, setDocTitle] = useState("Acme Healthcare Compliance Policy");
  const [rawText, setRawText] = useState(
    "Acme Healthcare Editorial Policy (v2.0):\n" +
    "1. Medical claims must never promise an absolute 'cure' for chronic conditions. Use 'targeted management therapy'.\n" +
    "2. All clinical outcomes stats must state 'based on 2025 cohort study of 1,200 participants'.\n" +
    "3. Never describe treatment plans as '100% risk-free' or 'guaranteed safe'. Use 'clinically validated safety profile'."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [extractedRules, setExtractedRules] = useState<ExtractedRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/copilot/extract-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_title: docTitle,
          content: rawText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to extract guidelines.");
      }

      const data = await res.json();
      setExtractedRules(data.rules || []);
      if (onIngestComplete) {
        onIngestComplete(data.rules || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#111827]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#F8F9FA] border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Universal Brand Guideline Ingester
              </h2>
              <p className="text-xs text-[#6B7280]">
                Upload or paste ANY company policy to autonomously synthesize structured AST rules.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {extractedRules.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                  Policy / Document Title:
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="neo-input"
                  placeholder="e.g. Acme Healthcare Compliance Manual 2026"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                  Paste Guideline Copy or Regulatory Clauses:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  className="neo-input font-mono text-xs leading-relaxed"
                  placeholder="Paste rules, terminology constraints, or mandatory claims..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#6B7280]">
                  Supported: Plain text, policy excerpts, regulatory disclosures.
                </span>
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isLoading || !rawText.trim()}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting AST Rules...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Synthesize Active Policy Rules</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Successfully Extracted {extractedRules.length} AST Enforceable Rules!
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Policy document compiled into deterministic matching engine.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExtractedRules([])}
                  className="text-xs text-emerald-700 underline font-semibold"
                >
                  Extract Another
                </button>
              </div>

              <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl overflow-hidden">
                {extractedRules.map((rule, idx) => (
                  <div key={idx} className="p-4 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {rule.rule_code}
                        </span>
                        <h4 className="text-xs font-bold text-[#111827]">{rule.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        rule.severity === "CRITICAL"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {rule.severity}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB] text-xs font-mono text-[#374151]">
                      &ldquo;{rule.guideline_quote}&rdquo;
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[#6B7280]">
                        Prohibited Terms: <strong className="text-red-700 font-mono">{rule.exact_terms?.join(", ") || "None"}</strong>
                      </span>
                      <span className="text-[#6B7280]">
                        Suggested: <strong className="text-emerald-700 font-mono">{rule.suggested_replacement}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F8F9FA] border-t border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E7EB] bg-white text-[#4B5563] text-xs font-semibold rounded-lg hover:bg-[#F8F9FA]"
          >
            Close
          </button>
          {extractedRules.length > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#1D4ED8]"
            >
              Apply to Active Inspector
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
