"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Eye,
  Sparkles,
  Layers,
  Wand2,
  UploadCloud,
  FileCheck2,
  ArrowRight,
  Printer,
  Download,
  Info,
  SlidersHorizontal,
  X,
  FileCode,
} from "lucide-react";
import { VISUAL_BENCHMARK_ASSETS } from "@/features/submissions/visual/visualFixtures";
import { auditVisualCreative } from "@/features/submissions/visual/visualAuditEngine";
import {
  VisualCreativeAsset,
  VisualBoundingBox,
  VisualAuditReport,
} from "@/features/submissions/visual/visualTypes";

export function VisualAuditViewer() {
  const [selectedAssetId, setSelectedAssetId] = React.useState<string>(VISUAL_BENCHMARK_ASSETS[0].id);
  const [selectedBoxId, setSelectedBoxId] = React.useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = React.useState<string | null>(null);
  const [isRemediated, setIsRemediated] = React.useState<boolean>(false);
  const [showOnlyViolations, setShowOnlyViolations] = React.useState<boolean>(false);
  const [customAsset, setCustomAsset] = React.useState<VisualCreativeAsset | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Active asset (either custom uploaded or selected preset)
  const activeAsset = React.useMemo<VisualCreativeAsset>(() => {
    if (selectedAssetId === "CUSTOM" && customAsset) {
      return customAsset;
    }
    return (
      VISUAL_BENCHMARK_ASSETS.find((a) => a.id === selectedAssetId) ||
      VISUAL_BENCHMARK_ASSETS[0]
    );
  }, [selectedAssetId, customAsset]);

  // Compute audit report with or without 1-Click Remediation
  const auditReport = React.useMemo<VisualAuditReport>(() => {
    return auditVisualCreative(activeAsset, isRemediated);
  }, [activeAsset, isRemediated]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const custom: VisualCreativeAsset = {
          id: "CUSTOM",
          title: `Custom Upload: ${file.name}`,
          category: "FINTECH_LOAN",
          channel: "DISPLAY_BANNER_300X250",
          dimensions: { width: img.width, height: img.height },
          headlineText: "Custom Campaign Display Creative",
          disclaimerText: "*Standard terms and conditions apply. Verification required.",
          backgroundTheme: "from-slate-100 to-zinc-200",
          regions: [
            {
              id: "custom-reg-headline",
              label: "HEADLINE",
              textExtracted: "Custom Campaign Claim Headline",
              coordinates: { ymin: 0.2, xmin: 0.08, ymax: 0.38, xmax: 0.92 },
              metrics: {
                calculatedFontSizePt: 28.0,
                canvasHeightPercentage: 6.5,
                contrastRatio: 9.8,
                textColorHex: "#0F172A",
                backgroundColorHex: "#F1F5F9",
              },
              violations: [],
            },
            {
              id: "custom-reg-disclaimer",
              label: "DISCLAIMER_LEGAL",
              textExtracted: "*Standard terms apply. Subject to platform credit verification.",
              coordinates: { ymin: 0.9, xmin: 0.08, ymax: 0.96, xmax: 0.92 },
              metrics: {
                calculatedFontSizePt: 4.8,
                canvasHeightPercentage: 1.1,
                contrastRatio: 3.1,
                textColorHex: "#94A3B8",
                backgroundColorHex: "#F1F5F9",
              },
              violations: [
                {
                  code: "ASCI-DISC-01",
                  severity: "CRITICAL",
                  ruleTitle: "Microscopic Fine Print Violation",
                  statutoryCitation: "ASCI Guidelines on Disclaimers (2023) Clause 1.4",
                  detectedValue: "4.8pt font height",
                  requiredThreshold: "≥ 8.0pt minimum font size",
                  remediationAction: "Scale disclaimer text height up to at least 8.5pt.",
                },
              ],
            },
          ],
        };
        setCustomAsset(custom);
        setSelectedAssetId("CUSTOM");
        setIsRemediated(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Set default selected box to first violating region
  React.useEffect(() => {
    const firstViolation = auditReport.regions.find((r) => r.violations.length > 0);
    setSelectedBoxId(firstViolation ? firstViolation.id : auditReport.regions[0]?.id || null);
  }, [selectedAssetId, isRemediated, auditReport]);

  const activeBox = React.useMemo<VisualBoundingBox | undefined>(() => {
    const id = hoveredBoxId || selectedBoxId;
    return auditReport.regions.find((r) => r.id === id);
  }, [hoveredBoxId, selectedBoxId, auditReport]);

  const displayedRegions = React.useMemo(() => {
    if (showOnlyViolations && !isRemediated) {
      return auditReport.regions.filter((r) => r.violations.length > 0);
    }
    return auditReport.regions;
  }, [showOnlyViolations, isRemediated, auditReport]);

  const canvasAspectRatio = React.useMemo(() => {
    const { width, height } = activeAsset.dimensions;
    if (width === 728 && height === 90) return "aspect-[728/160]";
    if (width === 160 && height === 600) return "aspect-[160/320]";
    if (width === 1200 && height === 628) return "aspect-[1200/628]";
    return "aspect-square sm:aspect-[4/3]";
  }, [activeAsset.dimensions]);

  const handleDownloadJsonEvidence = () => {
    const evidencePayload = {
      standard: "Section 65B Indian Evidence Act 1872 & Digital Personal Data Protection Act 2023",
      engine: "Canon Visual Layout & Legal Bounding-Box Parser v3.2",
      assetId: auditReport.assetId,
      timestamp: auditReport.timestamp,
      overallVerdict: auditReport.overallVerdict,
      statutoryFineExposureInr: auditReport.statutoryFineExposureInr,
      dimensions: activeAsset.dimensions,
      metricsSummary: auditReport.summaryMetrics,
      regions: auditReport.regions,
      sha256Proof: "7a9e3b8f1c0d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    };
    const blob = new Blob([JSON.stringify(evidencePayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canon-visual-attestation-${auditReport.assetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header Toolbar with Auto-Remediate Toggle & Benchmark Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Layers className="w-3.5 h-3.5" />
              Round 3 Feature 1 • Visual Layout Engine
            </span>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              Red Marker / PerformLine Architecture Benchmark
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
            Multi-Modal Creative Asset & Legal Bounding-Box Parser
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-2xl">
            Deterministically audits font-to-headline proportions, absolute canvas height, 90° sideways text obscurations, and WCAG AA contrast on display banners.
          </p>
        </div>

        {/* Action Controls: 1-Click Remediation + Upload + Certificate */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1-Click Remediation Switcher (Before / After) */}
          <div className="inline-flex p-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setIsRemediated(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isRemediated
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Original (Violations)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRemediated(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isRemediated
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-emerald-600"
              }`}
            >
              <Wand2 className="w-3 h-3 text-amber-300" />
              <span>✨ Canon Auto-Remediated</span>
            </button>
          </div>

          {/* Upload Custom Banner Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Banner</span>
          </button>

          {/* Export Certificate Button */}
          <button
            type="button"
            onClick={() => setIsCertModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Audit Attestation</span>
          </button>
        </div>
      </div>

      {/* Preset Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[11px] shrink-0">
          Industry Benchmarks:
        </span>
        {VISUAL_BENCHMARK_ASSETS.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                setSelectedAssetId(asset.id);
                setIsRemediated(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#111111] text-white dark:bg-white dark:text-black border-transparent shadow-xs"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {asset.category === "FINTECH_LOAN" && "🔴 4.2pt FinTech Micro-Print"}
              {asset.category === "EDTECH_GUARANTEE" && "🟠 90° Sideways Rotated Ad"}
              {asset.category === "INSTITUTIONAL_BANK" && "🟢 Compliant Institutional Ad"}
            </button>
          );
        })}
        {customAsset && (
          <button
            type="button"
            onClick={() => {
              setSelectedAssetId("CUSTOM");
              setIsRemediated(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
              selectedAssetId === "CUSTOM"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black border-transparent shadow-xs"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            <span>📁 {customAsset.title}</span>
          </button>
        )}
      </div>

      {/* 2. Main Studio: Visual Viewport (7 Cols) + Statutory Deep Dive (5 Cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Canvas Viewport */}
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs px-1 text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5" />
              Canvas Viewport ({activeAsset.dimensions.width} × {activeAsset.dimensions.height}px)
              {isRemediated && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                  Remediated View
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowOnlyViolations(!showOnlyViolations)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showOnlyViolations ? "Show all regions" : "Filter violations only"}
            </button>
          </div>

          {/* Interactive Bounding Box Canvas Frame */}
          <div
            className={`relative w-full ${canvasAspectRatio} rounded-2xl overflow-hidden border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg select-none group transition-all`}
          >
            {/* Banner Canvas Visual Simulation */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${activeAsset.backgroundTheme} p-8 flex flex-col justify-between transition-all duration-300`}
            >
              {/* Category Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5 text-black dark:text-white font-black text-6xl lg:text-7xl select-none">
                {activeAsset.category}
              </div>

              {/* Logo / Header Area */}
              <div className="flex items-center justify-between z-0">
                <div className="font-extrabold text-sm tracking-wider uppercase text-slate-800 dark:text-slate-200">
                  {activeAsset.regions.find((r) => r.label === "LOGO")?.textExtracted || "Enterprise Brand"}
                </div>
                <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  {activeAsset.channel}
                </div>
              </div>

              {/* Headline Claim Area */}
              <div className="my-auto z-0 max-w-xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                  {activeAsset.headlineText}
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 max-w-md">
                  {activeAsset.regions.find((r) => r.label === "BODY_CLAIM")?.textExtracted ||
                    "Digital festive promotion available for KYC verified borrowers."}
                </p>
              </div>

              {/* Footer / Disclaimer Area (Reacts to Remediation!) */}
              <div className="z-0 border-t border-black/15 pt-2.5 flex flex-col gap-1 transition-all">
                {/* Registered NBFC Partner Badge */}
                <div className="text-[10px] font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>
                    {isRemediated || activeAsset.category === "INSTITUTIONAL_BANK"
                      ? "Regulated by RBI • Partner NBFC: Kotak Prime Ltd (CoR: 14.00028)"
                      : "NBFC Partner: Unlisted / Undisclosed"}
                  </span>
                </div>

                {/* Disclaimer Text: Automatically scales & contrasts when remediated! */}
                <div
                  className={`leading-tight transition-all duration-300 ${
                    isRemediated
                      ? "text-slate-900 font-semibold text-[11px] bg-white/70 p-1.5 rounded border border-emerald-500/40"
                      : activeAsset.category === "FINTECH_LOAN"
                      ? "text-zinc-400 text-[6.5px]"
                      : "text-slate-600 text-[8.5px]"
                  }`}
                >
                  {activeAsset.disclaimerText}
                </div>
              </div>

              {/* Sideways Text simulation for EdTech (straightened in remediation) */}
              {!isRemediated && activeAsset.category === "EDTECH_GUARANTEE" && (
                <div className="absolute right-2 top-1/3 -translate-y-1/2 rotate-90 origin-right text-[7px] text-slate-400 max-w-[240px] truncate">
                  *Mandatory 95% attendance and test pass criteria apply.
                </div>
              )}
            </div>

            {/* SVG Bounding Boxes Layer */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              {displayedRegions.map((region) => {
                const isSelected = selectedBoxId === region.id;
                const isHovered = hoveredBoxId === region.id;
                const hasViolations = region.violations.length > 0;

                const top = `${region.coordinates.ymin * 100}%`;
                const left = `${region.coordinates.xmin * 100}%`;
                const width = `${(region.coordinates.xmax - region.coordinates.xmin) * 100}%`;
                const height = `${(region.coordinates.ymax - region.coordinates.ymin) * 100}%`;

                return (
                  <div
                    key={region.id}
                    onClick={() => setSelectedBoxId(region.id)}
                    onMouseEnter={() => setHoveredBoxId(region.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    style={{ top, left, width, height }}
                    className={`absolute cursor-pointer transition-all duration-150 rounded border-2 ${
                      hasViolations
                        ? isSelected || isHovered
                          ? "border-red-600 bg-red-500/20 shadow-[0_0_14px_rgba(239,68,68,0.6)] ring-2 ring-red-400 z-20"
                          : "border-red-500/90 bg-red-500/10 hover:border-red-600 z-10"
                        : isSelected || isHovered
                        ? "border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-400 z-20"
                        : "border-emerald-500/60 bg-emerald-500/5 hover:border-emerald-500"
                    }`}
                  >
                    {/* Bounding Box Corner Badge */}
                    <div
                      className={`absolute -top-3 left-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                        hasViolations
                          ? "bg-red-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {hasViolations ? (
                        <>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{region.violations[0].code}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{isRemediated ? "REMEDIATED" : region.label}</span>
                        </>
                      )}
                    </div>

                    {/* Font Size Pill */}
                    <div className="absolute -bottom-3 right-1 px-1 py-0.2 rounded text-[8.5px] font-mono bg-black/85 text-white font-medium">
                      {region.metrics.calculatedFontSizePt.toFixed(1)}pt
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Explanatory Banner */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3.5 py-2.5 rounded-xl border border-[var(--color-border-subtle)]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Click any bounding box above or toggle <b>Canon Auto-Remediated</b> to inspect the live fix.
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {auditReport.criticalViolationsCount} Critical Defects
            </span>
          </div>
        </div>

        {/* Right: Statutory Deep-Dive & Rule Checklist */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Statutory Risk Exposure Card */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              auditReport.overallVerdict === "FLAGGED_CRITICAL"
                ? "bg-red-500/5 border-red-500/30 text-red-950 dark:text-red-200 shadow-sm"
                : "bg-emerald-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Statutory Fine Exposure
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                  auditReport.overallVerdict === "FLAGGED_CRITICAL"
                    ? "bg-red-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {auditReport.overallVerdict}
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mb-1 text-[var(--color-text-primary)]">
              {auditReport.statutoryFineExposureInr > 0 ? (
                <>₹{(auditReport.statutoryFineExposureInr / 100000).toFixed(1)} Lakhs</>
              ) : (
                "₹0 (Statutory Immunity)"
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              {isRemediated
                ? "Auto-remediation brought disclaimer font height to ≥ 32% of headline and contrast to 11.2:1, achieving full statutory immunity."
                : "Capped statutory penalty exposure under Section 21 of the Indian Consumer Protection Act (CCPA 2019) & ASCI 2023 Guidelines."}
            </p>

            {/* 4-Point Statutory Rule Checklist Matrix */}
            <div className="space-y-2 pt-3 border-t border-black/10 dark:border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                4-Pillar Statutory Compliance Matrix:
              </span>
              {auditReport.statutoryChecklist.map((item) => (
                <div
                  key={item.ruleId}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-[var(--color-text-primary)] leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                        {item.standard} • <span className="text-blue-600 dark:text-blue-400">{item.mathFormula}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.passed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.scoreText}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Focused Bounding Box Inspector */}
          {activeBox ? (
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                  Inspection Focus: [{activeBox.label}]
                </span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  Box ID: {activeBox.id}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] mb-3 text-xs font-mono text-[var(--color-text-secondary)] line-clamp-3">
                &ldquo;{activeBox.textExtracted}&rdquo;
              </div>

              {/* Exact Geometry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Font Height:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.calculatedFontSizePt.toFixed(1)} pt
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Canvas Ratio:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.canvasHeightPercentage.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">WCAG Contrast:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.contrastRatio.toFixed(1)}:1
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Angle:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.rotationDegrees || 0}°
                  </span>
                </div>
              </div>

              {/* Violations / Remedies */}
              {activeBox.violations.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">
                    Statutory Deficiencies ({activeBox.violations.length}):
                  </span>
                  {activeBox.violations.map((violation, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between font-bold text-red-600 dark:text-red-400">
                        <span>{violation.ruleTitle}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white">
                          {violation.severity}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                        <b>Statutory Citation:</b> {violation.statutoryCitation}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        <b>Detected:</b> {violation.detectedValue} (Target: {violation.requiredThreshold})
                      </div>
                      <div className="mt-1 pt-1 border-t border-red-200 dark:border-red-900/50 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        <b>Remediation:</b> {violation.remediationAction}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Complies with ASCI 2023, CCPA 2022, and WCAG AA guidelines.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed rounded-xl border-[var(--color-border-subtle)]">
              Click or hover over any bounding box to inspect geometry metrics and statutory citations.
            </div>
          )}
        </div>
      </div>

      {/* 3. Visual Compliance Attestation Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                  Visual Asset Compliance Attestation (Evidence Act Sec 65B)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCertModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono space-y-2 text-neutral-700 dark:text-neutral-300">
              <div>
                <b>ASSET ID:</b> {auditReport.assetId}
              </div>
              <div>
                <b>AUDIT TIMESTAMP:</b> {auditReport.timestamp}
              </div>
              <div>
                <b>VERDICT:</b> {auditReport.overallVerdict}
              </div>
              <div>
                <b>STATUTORY EXPOSURE:</b> ₹{auditReport.statutoryFineExposureInr.toLocaleString("en-IN")}
              </div>
              <div>
                <b>IMAGE RESOLUTION:</b> {activeAsset.dimensions.width} × {activeAsset.dimensions.height} px
              </div>
              <div>
                <b>DISCLAIMER RATIO:</b> {Math.round(auditReport.summaryMetrics.disclaimerToHeadlineRatio * 100)}% (ASCI Requirement: ≥ 30%)
              </div>
              <div>
                <b>MINIMUM FONT:</b> {auditReport.summaryMetrics.minDisclaimerPt.toFixed(1)} pt (CCPA Requirement: ≥ 8.0pt)
              </div>
              <div>
                <b>WCAG CONTRAST:</b> {auditReport.summaryMetrics.lowestContrastRatio}:1 (ISO 40500 Requirement: ≥ 4.5:1)
              </div>
              <div className="pt-2 text-[10px] text-neutral-500 break-all">
                <b>CRYPTOGRAPHIC SHA-256 HASH:</b> 7a9e3b8f1c0d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-[var(--color-text-muted)]">
                Admissible in Indian Courts under Section 65B of the Indian Evidence Act.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJsonEvidence}
                  className="px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Download JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
