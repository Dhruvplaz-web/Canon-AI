"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Database,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ComplianceCertificateModal,
  type ReleaseCertificate,
} from "@/components/ComplianceCertificateModal";

export default function AuditLedgerPage() {
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certificate, setCertificate] = useState<ReleaseCertificate | null>(null);
  const [isLoadingCert, setIsLoadingCert] = useState(false);

  const handleInspectCertificate = async () => {
    setIsLoadingCert(true);
    try {
      const res = await fetch("/api/v1/submissions/sub_demo_01/certificate");
      if (res.ok) {
        const cert = await res.json();
        setCertificate(cert);
        setCertModalOpen(true);
      }
    } catch {
      // Failed to load
    } finally {
      setIsLoadingCert(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Cryptographic Audit &amp; Verification Ledger
            </h1>
            <Badge variant="outline" size="sm">
              Append-Only
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Immutable records of pre-publication compliance determinations, human override justifications, and release signoffs.
          </p>
        </div>

        <Button
          onClick={handleInspectCertificate}
          disabled={isLoadingCert}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Inspect Sample Release Certificate</span>
        </Button>
      </div>

      {/* Backend Gap Notice per F41 Specification */}
      <div
        role="region"
        aria-label="API Endpoint Specification Notice"
        className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-xs text-[var(--color-text-secondary)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
            Audit Export Gateway Status (Standard F41 Notice)
          </h2>
          <Badge variant="secondary" size="sm">
            Backend Gap Verified
          </Badge>
        </div>
        <p className="leading-relaxed">
          The global bulk export endpoint <code className="font-mono bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)] font-semibold">/api/v1/audit/export</code> is currently scheduled on the backend roadmap. In compliance with strict engineering integrity standards, Canon does not simulate mock audit logs. Raw digital certificates and append-only database logs are verified directly per submission.
        </p>
      </div>

      {/* 3 Core Architectural Invariants */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
          Core Architectural Invariants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              PostgreSQL Append-Only Ledger
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              All check runs, findings, and human override decisions are committed to PostgreSQL tables with DDL revoking <code className="font-mono font-bold text-[var(--color-text-primary)]">UPDATE</code> and <code className="font-mono font-bold text-[var(--color-text-primary)]">DELETE</code> privileges.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              SHA-256 HMAC Digital Certificates
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Every approved marketing collateral release generates a cryptographically signed HMAC-SHA256 release certificate binding the exact content hash, policy version, and approver identity.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Strict Tenant &amp; Workspace Isolation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Row-Level Security (RLS) policies enforce database isolation. Submissions, policy rules, and audit events can never leak across tenant enterprise workspace boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Verification Paths */}
      <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
          Live Verification Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Link
            href="/submissions"
            className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] transition flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-[var(--color-text-primary)] block">
                Pre-Flight Copy Submission &rarr;
              </span>
              <span className="text-[var(--color-text-secondary)] text-[11px]">
                Verify clean copy or generate release certificates
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-primary)] group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/review?view=signoff"
            className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] transition flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-[var(--color-text-primary)] block">
                Approver Signoff Ledger &rarr;
              </span>
              <span className="text-[var(--color-text-secondary)] text-[11px]">
                Inspect human override reason codes and signoff events
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-primary)] group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>

      {certificate && (
        <ComplianceCertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          certificate={certificate}
        />
      )}
    </div>
  );
}
