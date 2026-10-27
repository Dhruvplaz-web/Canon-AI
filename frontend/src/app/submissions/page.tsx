"use client";

import React, { Suspense } from "react";
import { SubmissionsHeader } from "@/features/submissions/SubmissionsHeader";
import { CopyEditor } from "@/features/submissions/CopyEditor";
import { FindingsList } from "@/features/submissions/FindingsList";
import { useSubmissionState } from "@/features/submissions/useSubmissionState";
import { ComplianceCertificateModal } from "@/components/ComplianceCertificateModal";
import { CreativeStudioPreview } from "@/components/CreativeStudioPreview";
import { CopilotRewriteModal } from "@/components/CopilotRewriteModal";
import { Skeleton } from "@/components/ui/Skeleton";

function SubmissionsStudioContent() {
  const {
    selectedPreset,
    channel,
    setChannel,
    title,
    setTitle,
    content,
    setContent,
    hasUnsavedChanges,
    isChecking,
    hasRunCheck,
    findings,
    selectedFindingId,
    setSelectedFindingId,
    certificateData,
    isCertModalOpen,
    setIsCertModalOpen,
    isCopilotOpen,
    setIsCopilotOpen,
    handleSelectPreset,
    handleContentChange,
    handleRunCheck,
    handleApplyFix,
    handleApplyAllMinor,
    handleOpenCertificate,
  } = useSubmissionState();

  return (
    <div className="space-y-6">
      <SubmissionsHeader
        channel={channel}
        onChannelChange={setChannel}
        onSelectPreset={handleSelectPreset}
        onRunCheck={handleRunCheck}
        isChecking={isChecking}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        selectedPresetCode={selectedPreset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Creative Studio Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <CopyEditor
            title={title}
            onTitleChange={setTitle}
            content={content}
            onChange={handleContentChange}
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={setSelectedFindingId}
          />

          <CreativeStudioPreview
            channel={channel}
            title={title}
            content={content}
            findings={findings}
          />
        </div>

        {/* Right Column: Findings List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <FindingsList
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={setSelectedFindingId}
            onApplyFix={handleApplyFix}
            onApplyAllMinor={handleApplyAllMinor}
            onOpenCertificateModal={handleOpenCertificate}
            hasRunCheck={hasRunCheck}
            isChecking={isChecking}
          />
        </div>
      </div>

      {certificateData && (
        <ComplianceCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={certificateData}
        />
      )}

      <CopilotRewriteModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        originalContent={content}
        channel={channel}
        findings={findings}
        onApplyRewrite={(newText: string) => {
          setContent(newText);
        }}
      />
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="lg:col-span-7 h-96 rounded-xl" />
              <Skeleton className="lg:col-span-5 h-96 rounded-xl" />
            </div>
          </div>
        }
      >
        <SubmissionsStudioContent />
      </Suspense>
    </div>
  );
}
