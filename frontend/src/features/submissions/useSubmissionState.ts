"use client";

import { useState, useEffect } from "react";
import { type Finding } from "./FindingsList";
import { type SAMPLE_PRESETS } from "./SubmissionsHeader";
import { type ReleaseCertificate } from "@/components/ComplianceCertificateModal";
import { toast } from "@/components/ui/Toast";

export function useSubmissionState() {
  const [selectedPreset, setSelectedPreset] = useState<string>("VIOLATIONS");
  const [channel, setChannel] = useState("email_blast");
  const [title, setTitle] = useState("UPI & Digital Lending Campaign (Bengaluru Launch)");
  const [content, setContent] = useState(
    "Bank on us for all your financial operations! We offer super dope yields with instant loan approval in seconds. Acme has been rated #1 banking app with 99.99% uptime across all major benchmarks."
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Compliance check run state
  const [isChecking, setIsChecking] = useState(false);
  const [hasRunCheck, setHasRunCheck] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals
  const [certificateData, setCertificateData] = useState<ReleaseCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Warn on tab/window close if there are unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle Preset selection
  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setSelectedPreset(preset.code);
    setTitle(preset.title);
    setContent(preset.content);
    setChannel(preset.channel);
    setFindings([]);
    setHasRunCheck(false);
    setSelectedFindingId(null);
    setHasUnsavedChanges(false);
  };

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    setHasUnsavedChanges(true);
  };

  // Run compliance check against live engine
  const handleRunCheck = async () => {
    setIsChecking(true);
    try {
      const createRes = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, channel }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to initialize submission draft.");
      }

      const draft = await createRes.json();
      const subId = draft.id;

      const checkRes = await fetch(`/api/v1/submissions/${subId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!checkRes.ok) {
        throw new Error("Compliance verification check failed.");
      }

      const checkData = await checkRes.json();
      setFindings(checkData.findings || []);
      setHasRunCheck(true);
      setHasUnsavedChanges(false);

      if (checkData.findings && checkData.findings.length > 0) {
        setSelectedFindingId(checkData.findings[0].id);
        toast({
          title: "Check Completed with Violations",
          description: `Identified ${checkData.findings.length} findings requiring remediation or review.`,
          variant: "destructive",
        });
      } else {
        setSelectedFindingId(null);
        toast({
          title: "Clean Copy Approved",
          description: "No brand violations detected. Ready for release certification.",
          variant: "default",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during check.";
      toast({
        title: "Check Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Apply single remediation fix with undo history
  const handleApplyFix = (finding: Finding) => {
    if (!finding.suggested_fix) return;
    setHistory((prev) => [...prev, content]);

    const updated =
      content.substring(0, finding.start_offset) +
      finding.suggested_fix +
      content.substring(finding.end_offset);

    setContent(updated);
    setHasUnsavedChanges(true);
    setFindings((prev) => prev.filter((f) => f.id !== finding.id));
    toast({
      title: "Remediation Applied",
      description: `Replaced "${finding.matched_text}" with approved guideline wording.`,
    });
  };

  // Apply all minor / non-critical fixes
  const handleApplyAllMinor = (minorFindings: Finding[]) => {
    setHistory((prev) => [...prev, content]);

    let updated = content;
    const sorted = [...minorFindings].sort((a, b) => b.start_offset - a.start_offset);
    sorted.forEach((f) => {
      if (f.suggested_fix) {
        updated =
          updated.substring(0, f.start_offset) +
          f.suggested_fix +
          updated.substring(f.end_offset);
      }
    });

    setContent(updated);
    setHasUnsavedChanges(true);

    const minorIds = new Set(minorFindings.map((f) => f.id));
    setFindings((prev) => prev.filter((f) => !minorIds.has(f.id)));

    toast({
      title: "Batch Remediation Complete",
      description: `Applied ${minorFindings.length} approved phrase substitutions.`,
    });
  };

  // Generate release certificate
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
        description: "Could not generate certificate at this time.",
        variant: "destructive",
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setContent(prev);
    setHistory((h) => h.slice(0, -1));
    toast({ title: "Undo Applied", description: "Restored previous draft wording." });
  };

  return {
    selectedPreset,
    channel,
    setChannel,
    title,
    setTitle,
    content,
    setContent,
    hasUnsavedChanges,
    history,
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
    handleUndo,
  };
}
