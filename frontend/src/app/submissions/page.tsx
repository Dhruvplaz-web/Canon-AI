"use client";

import React, { Suspense } from "react";
import { FileText, Layers, Sparkles } from "lucide-react";
import { SubmissionsHeader } from "@/features/submissions/SubmissionsHeader";
import { CopyEditor } from "@/features/submissions/CopyEditor";
import { FindingsList } from "@/features/submissions/FindingsList";
import { useSubmissionState } from "@/features/submissions/useSubmissionState";
import { ComplianceCertificateModal } from "@/components/ComplianceCertificateModal";
import { CreativeStudioPreview } from "@/components/CreativeStudioPreview";
import { CopilotRewriteModal } from "@/components/CopilotRewriteModal";
import { VisualAuditViewer } from "@/components/VisualAuditViewer";
import { Skeleton } from "@/components/ui/Skeleton";

function SubmissionsStudioContent() {
  const [auditMode, setAuditMode] = React.useState<"COPY_TEXT" | "VISUAL_BANNER">("COPY_TEXT");

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
      {/* Round 3 Multi-Modal Studio Switcher */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
        <div className="inline-flex p-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setAuditMode("COPY_TEXT")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              auditMode === "COPY_TEXT"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Copywriter Text Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setAuditMode("VISUAL_BANNER")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              auditMode === "VISUAL_BANNER"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Visual Banner & Layout Parser</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Round 3
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Statutory Engine Active: ASCI 2023 • CCPA Sec 4</span>
        </div>
      </div>

      {auditMode === "VISUAL_BANNER" ? (
        <VisualAuditViewer />
      ) : (
        <>
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
                channel={channel}
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
        </>
      )}

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
