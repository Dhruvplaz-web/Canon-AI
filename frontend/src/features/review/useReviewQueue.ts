"use client";

import { useState, useEffect, useCallback } from "react";
import { type ReviewItem, type ReasonCode } from "./OverrideModals";
import { type SubmissionSummary } from "./ApproverSignoffView";
import { type ReleaseCertificate } from "@/components/ComplianceCertificateModal";
import { toast } from "@/components/ui/Toast";

export function useReviewQueue() {
  const [queueItems, setQueueItems] = useState<ReviewItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionSummary | null>(null);
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [overrideModalItem, setOverrideModalItem] = useState<ReviewItem | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState<ReleaseCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queueRes = await fetch("/api/v1/review/queue", { cache: "no-store" });
      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueueItems(Array.isArray(data) ? data : data.items || []);
      }

      const subsRes = await fetch("/api/v1/submissions", { cache: "no-store" });
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        const subsList = Array.isArray(subsData) ? subsData : subsData.items || [];
        setSubmissions(subsList);
        if (subsList.length > 0 && !activeSubmission) {
          setActiveSubmission(subsList[0]);
        }
      }

      const rcRes = await fetch("/api/v1/governance/reason-codes", { cache: "no-store" });
      if (rcRes.ok) {
        const rcData = await rcRes.json();
        setReasonCodes(rcData);
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Failed to load review queue telemetry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeSubmission]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmSingleOverride = async (
    findingId: string,
    reasonCode: string,
    notes: string
  ) => {
    try {
      const res = await fetch(`/api/v1/findings/${findingId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason_code: reasonCode, notes }),
      });

      if (!res.ok) throw new Error("Override rejection from server");

      setQueueItems((prev) =>
        prev.map((item) =>
          item.id === findingId ? { ...item, status: "OVERRIDDEN" } : item
        )
      );

      toast({
        title: "Override Recorded",
        description: `Adjudicated finding with reason code ${reasonCode}.`,
      });
    } catch {
      toast({
        title: "Override Failed",
        description: "Could not record override to ledger.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmBatchOverride = async (
    items: ReviewItem[],
    reasonCode: string,
    notes: string
  ) => {
    try {
      const ids = items.map((i) => i.id);
      const res = await fetch("/api/v1/review/batch-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding_ids: ids, reason_code: reasonCode, notes }),
      });

      if (!res.ok) throw new Error("Batch override rejected");

      const idSet = new Set(ids);
      setQueueItems((prev) =>
        prev.map((item) =>
          idSet.has(item.id) ? { ...item, status: "OVERRIDDEN" } : item
        )
      );
      setSelectedIds([]);

      toast({
        title: "Batch Override Applied",
        description: `Successfully recorded overrides for ${items.length} non-critical findings.`,
      });
    } catch {
      toast({
        title: "Batch Override Failed",
        description: "Could not process batch adjudication.",
        variant: "destructive",
      });
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/v1/submissions/${submissionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Approval rejected by policy engine");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: "APPROVED" } : s))
      );
      if (activeSubmission?.id === submissionId) {
        setActiveSubmission((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
      }

      toast({
        title: "Submission Approved",
        description: "Release certificate issued and signed with SHA-256 HMAC.",
      });
    } catch {
      toast({
        title: "Approval Failed",
        description: "Could not approve submission.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSendBack = async (submissionId: string, notes: string) => {
    try {
      const res = await fetch(`/api/v1/submissions/${submissionId}/send-back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Send back failed");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: "SENT_BACK" } : s))
      );
      if (activeSubmission?.id === submissionId) {
        setActiveSubmission((prev) => (prev ? { ...prev, status: "SENT_BACK" } : null));
      }

      toast({
        title: "Draft Returned to Author",
        description: "Author notified with required revision notes.",
      });
    } catch {
      toast({
        title: "Action Failed",
        description: "Could not send draft back.",
        variant: "destructive",
      });
    }
  };

  const handleOpenCertificate = async () => {
    try {
      const res = await fetch("/api/v1/submissions/sub_demo_01/certificate");
      if (res.ok) {
        const cert = await res.json();
        setCertificateData(cert);
        setIsCertModalOpen(true);
      }
    } catch {
      toast({
        title: "Certificate Unavailable",
        description: "Could not load certificate.",
        variant: "destructive",
      });
    }
  };

  const pendingCount = queueItems.filter((i) => i.status === "PENDING_REVIEW").length;
  const activeSubmissionFindings = queueItems.filter(
    (i) => i.submission_id === activeSubmission?.id
  );

  return {
    queueItems,
    submissions,
    activeSubmission,
    setActiveSubmission,
    reasonCodes,
    selectedIds,
    setSelectedIds,
    isLoading,
    overrideModalItem,
    setOverrideModalItem,
    isBatchModalOpen,
    setIsBatchModalOpen,
    certificateData,
    isCertModalOpen,
    setIsCertModalOpen,
    isApproving,
    handleConfirmSingleOverride,
    handleConfirmBatchOverride,
    handleApproveSubmission,
    handleSendBack,
    handleOpenCertificate,
    pendingCount,
    activeSubmissionFindings,
  };
}
