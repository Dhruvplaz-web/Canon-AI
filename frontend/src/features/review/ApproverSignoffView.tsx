"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  FileCheck,
  Send,
  ShieldCheck,
  UserCheck,
  Hash,
  Bell,
  Code,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import type { ReviewItem } from "./OverrideModals";

export interface SubmissionSummary {
  id: string;
  title: string;
  channel: string;
  status: string;
  creator_name?: string;
  created_at: string;
}

interface ApproverSignoffViewProps {
  submissions: SubmissionSummary[];
  activeSubmission: SubmissionSummary | null;
  onSelectSubmission: (sub: SubmissionSummary) => void;
  findings: ReviewItem[];
  onApprove: (submissionId: string) => Promise<void>;
  onSendBack: (submissionId: string, notes: string) => Promise<void>;
  onOpenCertificate?: () => void;
  onViewCertificate?: () => void;
  isApproving: boolean;
}

export function ApproverSignoffView({
  submissions,
  activeSubmission,
  onSelectSubmission,
  findings,
  onApprove,
  onSendBack,
  onOpenCertificate,
  onViewCertificate,
  isApproving,
}: ApproverSignoffViewProps) {
  const handleCert = onOpenCertificate || onViewCertificate || (() => {});
  const [sendBackModalOpen, setSendBackModalOpen] = useState(false);
  const [sendBackNotes, setSendBackNotes] = useState("");
  const [isSendingBack, setIsSendingBack] = useState(false);
  const [showWebhookPayload, setShowWebhookPayload] = useState(false);

  const unresolvedCriticals = findings.filter(
    (f) => f.severity === "CRITICAL" && f.status === "PENDING_REVIEW"
  );
  const isBlockedFromApproval = unresolvedCriticals.length > 0;
  const isApproved = activeSubmission?.status === "APPROVED";

  const handleConfirmSendBack = async () => {
    if (!activeSubmission) return;
    setIsSendingBack(true);
    await onSendBack(activeSubmission.id, sendBackNotes);
    setIsSendingBack(false);
    setSendBackModalOpen(false);
    setSendBackNotes("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Submissions Sidebar (4 cols) */}
      <div className="lg:col-span-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-text-muted)]">
          Submissions Awaiting Signoff
        </h3>
        <div className="space-y-2">
          {submissions.map((sub) => {
            const isSelected = activeSubmission?.id === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubmission(sub)}
                className={`w-full p-3 rounded-lg border text-left transition flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-xs"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[var(--color-text-primary)] truncate">
                    {sub.title}
                  </span>
                  <Badge
                    variant={sub.status === "APPROVED" ? "success" : "warning"}
                    size="sm"
                  >
                    {sub.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                  <span>{sub.channel}</span>
                  <span>{sub.creator_name || "Creator"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Signoff Workspace (8 cols) */}
      <div className="lg:col-span-8 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 space-y-6">
        {activeSubmission ? (
          <>
            {/* Header with Title and Signoff Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {activeSubmission.title}
                  </h2>
                  <Badge variant={isApproved ? "success" : "warning"} size="sm">
                    {activeSubmission.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Channel: {activeSubmission.channel} &bull; Author: {activeSubmission.creator_name || "Charlie Creator"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isApproved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSendBackModalOpen(true)}
                    className="gap-1.5 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Send Back with Notes</span>
                  </Button>
                )}

                {isApproved ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCert}
                    className="gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Release Certificate</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onApprove(activeSubmission.id)}
                    disabled={isBlockedFromApproval || isApproving}
                    className="gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isApproving ? "Authorizing..." : "Approve & Sign Off"}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Critical Blockers Banner */}
            {isBlockedFromApproval && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3"
              >
                <AlertOctagon className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold">
                    Approval Blocked: {unresolvedCriticals.length} Critical Violation Unresolved
                  </h4>
                  <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                    Enterprise governance standards prohibit release approval while critical violations remain pending. The creator must fix the draft or an authorized reviewer must record a reason-coded override.
                  </p>
                </div>
              </div>
            )}

            {/* Function 3.2: Simulated Enterprise Webhook & Slack Notification Dispatcher */}
            {isApproved && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#4A154B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      #
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        Enterprise Webhook Dispatched &bull; Slack #brand-governance
                      </span>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Payload triggered on release sign-off: broadcast to Slack, MarTech CMS, and webhook subscriber endpoints.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWebhookPayload((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[11px] font-mono font-semibold text-[var(--color-text-secondary)] transition cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{showWebhookPayload ? "Hide Webhook JSON" : "Inspect Webhook Payload"}</span>
                  </button>
                </div>

                {/* Slack Message Mock Preview */}
                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs space-y-1 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-text-primary)]">Canon Bot</span>
                    <span className="text-[10px] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] px-1 rounded font-mono">APP</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Just now</span>
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    &bull; <strong>Status:</strong> Approved &amp; Released under Certificate <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">#CERT-ACME-{activeSubmission.id.slice(0, 8)}</code>
                    <br />
                    &bull; <strong>Campaign:</strong> &ldquo;{activeSubmission.title}&rdquo; ({activeSubmission.channel})
                    <br />
                    &bull; <strong>Approver:</strong> Rachel Reviewer (Human Sign-off complete, 0 unresolved blocking violations).
                  </p>
                </div>

                {/* Raw Webhook JSON Drawer */}
                {showWebhookPayload && (
                  <pre className="p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] font-mono text-[10px] text-[var(--color-text-secondary)] overflow-x-auto">
                    {JSON.stringify(
                      {
                        event: "governance.submission.approved",
                        timestamp: new Date().toISOString(),
                        workspace: "Acme Corp (Primary)",
                        submission_id: activeSubmission.id,
                        title: activeSubmission.title,
                        channel: activeSubmission.channel,
                        approver: {
                          name: "Rachel Reviewer",
                          email: "reviewer@acme.corp",
                          role: "reviewer",
                        },
                        certificate: {
                          id: `CERT-ACME-${activeSubmission.id.slice(0, 8)}`,
                          algorithm: "HMAC-SHA256",
                          standard: "Canon Brand Governance Protocol v1.0",
                          zero_ai_veto_enforced: true,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            )}

            {/* Findings List for this Submission */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--color-text-muted)]">
                Dual-Grounded Compliance Findings ({findings.length})
              </h3>

              {findings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                        {f.rule_code}
                      </span>
                      <StatusBadge
                        status={
                          f.severity === "CRITICAL"
                            ? "CRITICAL"
                            : f.severity === "WARNING"
                            ? "WARNING"
                            : "INFO"
                        }
                      />
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {f.title}
                      </span>
                    </div>
                    <Badge variant={f.status === "PENDING_REVIEW" ? "warning" : "success"} size="sm">
                      {f.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Dual Grounding Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                        FLAGGED DRAFT CITATION
                      </span>
                      <p className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                        &ldquo;{f.matched_text || f.receipt_a_draft_span}&rdquo;
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-[var(--color-text-muted)] block">
                        STATUTORY POLICY EXCERPT
                      </span>
                      <p className="text-[var(--color-text-secondary)] italic">
                        &ldquo;{f.receipt_b_rule_quote}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)]">
            Select a submission from the left rail to inspect findings and sign off.
          </div>
        )}
      </div>

      {/* Send-Back Dialog with Revision Notes */}
      <Dialog open={sendBackModalOpen} onOpenChange={setSendBackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Back Submission to Author</DialogTitle>
            <DialogDescription>
              Return this copy to the author with mandatory compliance revision guidance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <label htmlFor="sendback-notes" className="font-semibold text-[var(--color-text-secondary)] block">
              Revision Notes for Creator (Mandatory)
            </label>
            <textarea
              id="sendback-notes"
              value={sendBackNotes}
              onChange={(e) => setSendBackNotes(e.target.value)}
              placeholder="Explain required changes, required substantiations, or policy references..."
              rows={4}
              className="w-full p-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSendBackModalOpen(false)}
              disabled={isSendingBack}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmSendBack}
              disabled={isSendingBack || !sendBackNotes.trim()}
            >
              {isSendingBack ? "Sending..." : "Send Back Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
