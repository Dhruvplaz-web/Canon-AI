"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  X,
  FileCheck2,
  Lock,
  UserCheck,
  ExternalLink,
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

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `compliance-certificate-${certificate.submission.id.slice(0, 8)}.json`
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-8 bg-[#F4F0EA] border-3 border-black rounded-2xl shadow-[10px_10px_0px_#000] p-6 sm:p-8 flex flex-col gap-6 text-black"
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
                ID: {certificate.certificate_id} • Issued:{" "}
                {new Date(certificate.issued_at).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-start p-2 rounded-lg border-2 border-black bg-white hover:bg-[#FF00FF] hover:text-white transition shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Close certificate"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Grounding Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Verified Copy Provenance (Draft Citation Span) */}
          <div className="neo-box p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#00C2CB]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Verified Copy Provenance
                </span>
              </div>
              <span className="neo-badge bg-[#00C2CB] text-black text-[10px]">
                v{certificate.submission.version_number}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#555555]">Title:</span>
              <span className="text-sm font-black text-black truncate">
                {certificate.submission.title}
              </span>
              <span className="text-[11px] font-medium text-[#444444]">
                Scope: {certificate.submission.channel} •{" "}
                {certificate.submission.content_length_chars} characters
              </span>
            </div>

            <div className="flex flex-col gap-1 bg-[#F4F0EA] p-2.5 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#555555]">
                <span>CONTENT SHA-256 HASH</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(certificate.submission.content_sha256, "content_hash")
                  }
                  className="flex items-center gap-1 text-black font-black hover:underline cursor-pointer"
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
                {certificate.submission.content_sha256}
              </code>
            </div>
          </div>

          {/* Card 2: Governing Policy Document (Policy Excerpt Grounding) */}
          <div className="neo-box p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Governing Policy Citation
                </span>
              </div>
              <span className="neo-badge bg-[#FFD700] text-black text-[10px]">
                Policy v{certificate.governing_policy.policy_version}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#555555]">Document:</span>
              <span className="text-sm font-black text-black truncate">
                {certificate.governing_policy.document_title}
              </span>
              <span className="text-[11px] font-medium text-[#444444]">
                Verification: {certificate.governing_policy.verification_mode}
              </span>
            </div>

            <div className="flex flex-col gap-1 bg-[#F4F0EA] p-2.5 rounded-lg border-2 border-black">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#555555]">
                <span>POLICY DOCUMENT SHA-256</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      certificate.governing_policy.document_sha256,
                      "policy_hash"
                    )
                  }
                  className="flex items-center gap-1 text-black font-black hover:underline cursor-pointer"
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
                {certificate.governing_policy.document_sha256}
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
              {certificate.approval_attestation.approver_role}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#555555]">Certified Approver:</span>
              <strong className="font-black text-black">
                {certificate.approval_attestation.approver_name}
              </strong>
              <span className="text-xs text-[#555555] font-mono">
                ({certificate.approval_attestation.approver_email})
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#444444]">
              {new Date(
                certificate.approval_attestation.approved_at
              ).toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F4F0EA] border-2 border-black text-xs font-medium text-[#222222] leading-relaxed">
            <p>{certificate.approval_attestation.statutory_compliance_note}</p>
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
                  certificate.cryptographic_verification.digital_signature,
                  "signature"
                )
              }
              className="flex items-center gap-1 text-xs text-[#FFD700] font-black hover:underline cursor-pointer"
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
            {certificate.cryptographic_verification.digital_signature}
          </code>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pt-1">
            <span>Algorithm: {certificate.cryptographic_verification.signature_algorithm}</span>
            <span>Standard: {certificate.standard}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#444444]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cryptographically sealed under Zero AI Veto protocol</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="neo-btn neo-btn-teal text-xs py-2 px-4"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download JSON Certificate</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="neo-btn neo-btn-white text-xs py-2 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
