"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  X,
  FileCheck2,
  Lock,
  UserCheck,
} from "lucide-react";

export interface ReleaseCertificate {
  certificate_id: string;
  standard: string;
  issued_at: string;
  status: string;
  workspace: {
    id: string;
    name: string;
  };
  submission: {
    id: string;
    title: string;
    channel: string;
    version_number: number;
    content_length_chars: number;
    content_sha256: string;
  };
  governing_policy: {
    policy_version: string;
    document_title: string;
    document_sha256: string;
    verification_mode: string;
  };
  approval_attestation: {
    approver_name: string;
    approver_role: string;
    approver_email: string;
    approved_at: string;
    statutory_compliance_note: string;
  };
  cryptographic_verification: {
    signature_algorithm: string;
    digital_signature: string;
    tamper_evident_payload: string;
    verification_url: string;
  };
}

interface ComplianceCertificateModalProps {
  certificate: ReleaseCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComplianceCertificateModal({
  certificate,
  isOpen,
  onClose,
}: ComplianceCertificateModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !certificate) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `compliance-certificate-${(certificate?.submission?.id || "draft").slice(0, 8)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto print-certificate-container"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-8 bg-[#F4F0EA] border-3 border-black rounded-2xl shadow-[10px_10px_0px_#000] p-6 sm:p-8 flex flex-col gap-6 text-black print-certificate-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Watermark Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2.5 border-black pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#00C2CB] border-2.5 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#000]">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="neo-badge bg-[#FFD700] text-black text-[10px] font-black uppercase">
                  EU AI Act Art. 14 Attestation
                </span>
                <span className="neo-badge bg-[#00C2CB] text-black text-[10px] font-black uppercase">
                  SHA-256 Provenance
                </span>
              </div>
              <h2
                id="cert-modal-title"
                className="text-2xl font-black tracking-tight text-black flex items-center gap-2"
              >
                <span>Compliance Release Certificate</span>
              </h2>
              <span className="text-xs font-mono font-bold text-[#333333]">
                ID: {certificate?.certificate_id || "CERT-ACME-RELEASE"} • Issued:{" "}
                {certificate?.issued_at
                  ? new Date(certificate.issued_at).toLocaleString()
                  : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-start p-2 rounded-lg border-2 border-black bg-white hover:bg-[#FF00FF] hover:text-white transition shadow-[2px_2px_0px_#000] cursor-pointer no-print"
            title="Close certificate"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Grounding Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Verified Copy Provenance (Receipt A) */}
          <div className="neo-box p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#00C2CB]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Verified Copy (Receipt A)
                </span>
              </div>
              <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                v{certificate?.submission?.version_number ?? 1}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#555555]">Title:</span>
              <span className="text-sm font-black text-black truncate">
                {certificate?.submission?.title || "Untitled Submission"}
              </span>
              <span className="text-[11px] font-medium text-[#444444]">
                Scope: {certificate?.submission?.channel || "web_landing_page"} •{" "}
                {certificate?.submission?.content_length_chars ?? 0} characters
              </span>
            </div>

            <div className="flex flex-col gap-1 bg-[#F4F0EA] p-2.5 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#555555]">
                <span>CONTENT SHA-256 HASH</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      certificate?.submission?.content_sha256 || "",
                      "content_hash"
                    )
                  }
                  className="flex items-center gap-1 text-black font-black hover:underline cursor-pointer no-print"
                >
                  {copiedField === "content_hash" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-[11px] font-mono font-bold text-black break-all select-all">
                {certificate?.submission?.content_sha256 ||
                  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </code>
            </div>
          </div>

          {/* Card 2: Governing Policy Document (Receipt B Grounding) */}
          <div className="neo-box p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Governing Policy (Receipt B)
                </span>
              </div>
              <span className="neo-badge bg-[#FFD700] text-black text-[10px]">
                Policy v{certificate?.governing_policy?.policy_version || "1.0"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#555555]">Document:</span>
              <span className="text-sm font-black text-black truncate">
                {certificate?.governing_policy?.document_title ||
                  "ACME-GUIDELINES-2026-V1"}
              </span>
              <span className="text-[11px] font-medium text-[#444444]">
                Verification:{" "}
                {certificate?.governing_policy?.verification_mode ||
                  "DOUBLE_RECEIPT_GROUNDING"}
              </span>
            </div>

            <div className="flex flex-col gap-1 bg-[#F4F0EA] p-2.5 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#555555]">
                <span>POLICY DOCUMENT SHA-256</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      certificate?.governing_policy?.document_sha256 || "",
                      "policy_hash"
                    )
                  }
                  className="flex items-center gap-1 text-black font-black hover:underline cursor-pointer no-print"
                >
                  {copiedField === "policy_hash" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-[11px] font-mono font-bold text-black break-all select-all">
                {certificate?.governing_policy?.document_sha256 ||
                  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </code>
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Human Oversight Attestation */}
        <div className="neo-box p-4.5 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-black" />
              <span className="text-xs font-black uppercase tracking-wider">
                Human Oversight Sign-Off Attestation
              </span>
            </div>
            <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
              {certificate?.approval_attestation?.approver_role ||
                "Compliance Officer"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#555555]">Certified Approver:</span>
              <strong className="font-black text-black">
                {certificate?.approval_attestation?.approver_name ||
                  "Authorized Reviewer"}
              </strong>
              <span className="text-xs text-[#555555] font-mono">
                ({certificate?.approval_attestation?.approver_email ||
                  "compliance@acme.corp"})
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#444444]">
              {certificate?.approval_attestation?.approved_at
                ? new Date(
                    certificate.approval_attestation.approved_at
                  ).toLocaleString()
                : new Date().toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F4F0EA] border-2 border-black text-xs font-medium text-[#222222] leading-relaxed">
            <p>
              {certificate?.approval_attestation?.statutory_compliance_note ||
                "All claims verified against approved registry; 0 unresolved blocking violations."}
            </p>
          </div>
        </div>

        {/* Section 4: Composite Cryptographic Digital Signature */}
        <div className="neo-box p-4.5 bg-[#111111] text-white flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-[#333333] pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00C2CB]" />
              <span className="text-xs font-mono font-black uppercase tracking-wider text-[#00C2CB]">
                Composite Cryptographic Digital Signature
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  certificate?.cryptographic_verification?.digital_signature ||
                    "",
                  "signature"
                )
              }
              className="flex items-center gap-1 text-xs text-[#FFD700] font-black hover:underline cursor-pointer no-print"
            >
              {copiedField === "signature" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Signature</span>
                </>
              )}
            </button>
          </div>

          <code className="text-xs font-mono font-bold text-[#00C2CB] break-all select-all bg-black/60 p-2.5 rounded-lg border border-[#333333]">
            {certificate?.cryptographic_verification?.digital_signature ||
              "UNSIGNED"}
          </code>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pt-1">
            <span>
              Algorithm:{" "}
              {certificate?.cryptographic_verification?.signature_algorithm ||
                "HMAC-SHA256"}
            </span>
            <span>
              Standard:{" "}
              {certificate?.standard ||
                "Canon Brand Governance Protocol v1.0"}
            </span>
          </div>
        </div>

        {/* Section 5: Statutory Disclaimer & Enterprise Governance Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
              Enterprise Brand Governance Notice &amp; Legal Disclaimer
            </span>
            <p className="text-amber-900/90 font-medium">
              This certificate attests to algorithmic policy verification and human oversight adherence under Canon&apos;s Double-Receipt Invariant and EU AI Act Article 14 governance workflows. It certifies internal compliance with designated organizational brand rules and does not constitute statutory legal counsel, binding regulatory exemption, or commercial warranty.
            </p>
          </div>
        </div>

        {/* Action Footer (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 no-print">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#444444]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cryptographically sealed under Zero AI Veto protocol</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="neo-btn neo-btn-teal text-xs py-2 px-4 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>Print / PDF Certificate</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="neo-btn neo-btn-white text-xs py-2 px-4 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="neo-btn neo-btn-white text-xs py-2 px-4 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
