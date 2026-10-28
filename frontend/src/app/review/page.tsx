"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReviewHeader } from "@/features/review/ReviewHeader";
import { ReviewTable } from "@/features/review/ReviewTable";
import {
  SingleOverrideModal,
  BulkOverrideModal,
  type ReviewItem,
} from "@/features/review/OverrideModals";
import { ApproverSignoffView } from "@/features/review/ApproverSignoffView";
import { useReviewQueue } from "@/features/review/useReviewQueue";
import { ComplianceCertificateModal } from "@/components/ComplianceCertificateModal";
import { SlackWebhookNotification } from "@/components/SlackWebhookNotification";
import { Skeleton } from "@/components/ui/Skeleton";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewMode = (searchParams.get("view") === "signoff" ? "signoff" : "queue") as
    | "queue"
    | "signoff";

  const {
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
    webhookDispatch,
    setWebhookDispatch,
  } = useReviewQueue();

  const setViewMode = (mode: "queue" | "signoff") => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("view", mode);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <ReviewHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pendingFindingsCount={pendingCount}
        submissionsCount={submissions.length}
      />

      {viewMode === "queue" ? (
        <ReviewTable
          items={queueItems}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onOverride={(item: ReviewItem) => setOverrideModalItem(item)}
          onBatchOverride={() => setIsBatchModalOpen(true)}
          isLoading={isLoading}
        />
      ) : (
        <ApproverSignoffView
          submissions={submissions}
          activeSubmission={activeSubmission}
          onSelectSubmission={setActiveSubmission}
          findings={activeSubmissionFindings}
          onApprove={handleApproveSubmission}
          onSendBack={handleSendBack}
          onViewCertificate={handleOpenCertificate}
          isApproving={isApproving}
        />
      )}

      {/* Single Override Modal */}
      <SingleOverrideModal
        isOpen={Boolean(overrideModalItem)}
        onClose={() => setOverrideModalItem(null)}
        item={overrideModalItem}
        reasonCodes={reasonCodes}
        onConfirm={handleConfirmSingleOverride}
      />

      {/* Batch Override Modal */}
      <BulkOverrideModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        items={queueItems.filter((i) => selectedIds.includes(i.id))}
        reasonCodes={reasonCodes}
        onConfirm={handleConfirmBatchOverride}
      />

      {/* Compliance Certificate Modal */}
      {certificateData && (
        <ComplianceCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={certificateData}
        />
      )}

      {/* Enterprise Slack Webhook Dispatcher (Task 3.2) */}
      <SlackWebhookNotification
        dispatchResult={webhookDispatch}
        onDismiss={() => setWebhookDispatch(null)}
      />
    </div>
  );
}

export default function ReviewPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        }
      >
        <ReviewContent />
      </Suspense>
    </div>
  );
}
