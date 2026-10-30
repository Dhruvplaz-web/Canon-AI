"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Eye,
  Maximize2,
  Sparkles,
  RefreshCw,
  Scale,
  ExternalLink,
  Layers,
} from "lucide-react";
import { VISUAL_BENCHMARK_ASSETS } from "@/features/submissions/visual/visualFixtures";
import { auditVisualCreative } from "@/features/submissions/visual/visualAuditEngine";
import { VisualCreativeAsset, VisualBoundingBox, VisualAuditReport } from "@/features/submissions/visual/visualTypes";

export function VisualAuditViewer() {
  const [selectedAssetId, setSelectedAssetId] = React.useState<string>(VISUAL_BENCHMARK_ASSETS[0].id);
  const [selectedBoxId, setSelectedBoxId] = React.useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = React.useState<string | null>(null);
  const [showOnlyViolations, setShowOnlyViolations] = React.useState<boolean>(false);

  // Active asset and dynamically computed audit report
  const activeAsset = React.useMemo<VisualCreativeAsset>(() => {
    return VISUAL_BENCHMARK_ASSETS.find((a) => a.id === selectedAssetId) || VISUAL_BENCHMARK_ASSETS[0];
  }, [selectedAssetId]);

  const auditReport = React.useMemo<VisualAuditReport>(() => {
    return auditVisualCreative(activeAsset);
  }, [activeAsset]);

  // Set default selected box to the first violating region if any
  React.useEffect(() => {
    const firstViolation = auditReport.regions.find((r) => r.violations.length > 0);
    setSelectedBoxId(firstViolation ? firstViolation.id : auditReport.regions[0]?.id || null);
  }, [selectedAssetId, auditReport]);

  const activeBox = React.useMemo<VisualBoundingBox | undefined>(() => {
    const id = hoveredBoxId || selectedBoxId;
    return auditReport.regions.find((r) => r.id === id);
  }, [hoveredBoxId, selectedBoxId, auditReport]);

  const displayedRegions = React.useMemo(() => {
    if (showOnlyViolations) {
      return auditReport.regions.filter((r) => r.violations.length > 0);
    }
    return auditReport.regions;
  }, [showOnlyViolations, auditReport]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header & Benchmark Asset Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Layers className="w-3 h-3" />
              Computer Vision & Layout Parser
            </span>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              ASCI 2023 • CCPA Sec 4(2) • WCAG 2.1 AA
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
            Visual Creative & Disclaimer Bounding-Box Scanner
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Audits font-to-headline scale ratios, absolute canvas height, sideways rotations, and color contrast on marketing banners.
          </p>
        </div>

        {/* 1-Click Preset Switcher for Judges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mr-1">
            Benchmarks:
          </span>
          {VISUAL_BENCHMARK_ASSETS.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-[#111111] text-white dark:bg-white dark:text-black border-transparent shadow-xs"
                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {asset.category === "FINTECH_LOAN" && "🔴 4.2pt FinTech Ad"}
                {asset.category === "EDTECH_GUARANTEE" && "🟠 90° Sideways Ad"}
                {asset.category === "INSTITUTIONAL_BANK" && "🟢 Compliant Bank Ad"}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Visual Canvas + Inspection Sidecar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: The Visual Ad Canvas with Overlaid Bounding Boxes (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs px-1 text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5" />
              Interactive Canvas Viewport ({activeAsset.dimensions.width} × {activeAsset.dimensions.height}px)
            </span>
            <button
              type="button"
              onClick={() => setShowOnlyViolations(!showOnlyViolations)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showOnlyViolations ? "Show all regions" : "Filter violations only"}
            </button>
          </div>

          {/* Canvas Viewport Frame */}
          <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-md select-none group">
            {/* Simulated Banner Visual Content */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${activeAsset.backgroundTheme} p-8 flex flex-col justify-between`}
            >
              {/* Decorative background branding watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5 text-black dark:text-white font-black text-7xl select-none">
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
                    "Special festive commercial offer available for verified mobile KYC customers."}
                </p>
              </div>

              {/* Footer / Disclaimer Area */}
              <div className="z-0 border-t border-black/10 pt-2 flex flex-col gap-1">
                {activeAsset.regions.find((r) => r.label === "PARTNER_BADGE") && (
                  <div className="text-[10px] font-semibold text-slate-800">
                    {activeAsset.regions.find((r) => r.label === "PARTNER_BADGE")?.textExtracted}
                  </div>
                )}
                <div
                  className={`text-[9px] leading-tight ${
                    activeAsset.category === "FINTECH_LOAN" ? "text-zinc-400 text-[6.5px]" : "text-slate-600"
                  }`}
                >
                  {activeAsset.disclaimerText}
                </div>
              </div>

              {/* Special Sideways simulation for EdTech */}
              {activeAsset.category === "EDTECH_GUARANTEE" && (
                <div className="absolute right-2 top-1/4 -translate-y-1/2 rotate-90 origin-right text-[7px] text-slate-400 max-w-[280px] truncate">
                  *Refund criteria apply. 95% attendance mandatory.
                </div>
              )}
            </div>

            {/* SVG Bounding Boxes Overlay Layer */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              {displayedRegions.map((region) => {
                const isSelected = selectedBoxId === region.id;
                const isHovered = hoveredBoxId === region.id;
                const hasViolations = region.violations.length > 0;

                // Box coordinates in percentages
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
                          ? "border-red-600 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.5)] ring-2 ring-red-400 z-20"
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
                          <span>{region.label}</span>
                        </>
                      )}
                    </div>

                    {/* Font Size Tag */}
                    <div className="absolute -bottom-3 right-1 px-1 py-0.2 rounded text-[8.5px] font-mono bg-black/80 text-white font-medium">
                      {region.metrics.calculatedFontSizePt.toFixed(1)}pt
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas Instructions */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-2 rounded-lg border border-[var(--color-border-subtle)]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Click any bounding box above to inspect mathematical geometry and exact statutory citations.
            </span>
            <span className="font-mono text-[11px]">
              {auditReport.criticalViolationsCount} Defects Found
            </span>
          </div>
        </div>

        {/* Right: Statutory Inspection Sidecar & Metric Cards (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Statutory Exposure Scorecard */}
          <div
            className={`p-5 rounded-2xl border ${
              auditReport.overallVerdict === "FLAGGED_CRITICAL"
                ? "bg-red-500/5 border-red-500/30 text-red-950 dark:text-red-200"
                : "bg-emerald-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Statutory Risk Assessment
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
                "₹0 (Compliant)"
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Estimated statutory exposure under Consumer Protection Act 2019 (CCPA) Section 21 & ASCI 2023 Penalties.
            </p>

            {/* Quick Math Gauges */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/10 dark:border-white/10 text-xs">
              <div>
                <span className="text-[var(--color-text-muted)] block">Min Disclaimer Font:</span>
                <span
                  className={`font-mono font-bold ${
                    auditReport.summaryMetrics.minDisclaimerPt < 8.0 ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {auditReport.summaryMetrics.minDisclaimerPt} pt (Min 8.0pt)
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Headline Ratio:</span>
                <span
                  className={`font-mono font-bold ${
                    auditReport.summaryMetrics.disclaimerToHeadlineRatio < 0.3 ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {Math.round(auditReport.summaryMetrics.disclaimerToHeadlineRatio * 100)}% (Min 30%)
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Lowest Contrast:</span>
                <span
                  className={`font-mono font-bold ${
                    auditReport.summaryMetrics.lowestContrastRatio < 4.5 ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {auditReport.summaryMetrics.lowestContrastRatio}:1 (Min 4.5:1)
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Status:</span>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">
                  {auditReport.criticalViolationsCount === 0 ? "PASSED" : "NON-COMPLIANT"}
                </span>
              </div>
            </div>
          </div>

          {/* Focused Region Deep-Dive Inspector */}
          {activeBox ? (
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                  Inspection Focus: [{activeBox.label}]
                </span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  ID: {activeBox.id}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] mb-3 text-xs font-mono text-[var(--color-text-secondary)] line-clamp-3">
                &ldquo;{activeBox.textExtracted}&rdquo;
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Calculated Size:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.calculatedFontSizePt.toFixed(1)} pt
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Canvas Height %:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.canvasHeightPercentage.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Luminance Contrast:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.contrastRatio.toFixed(1)}:1
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Orientation:</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {activeBox.metrics.rotationDegrees || 0}°
                  </span>
                </div>
              </div>

              {/* Violations List for Active Box */}
              {activeBox.violations.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                    Statutory Violations ({activeBox.violations.length}):
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
                  <span>This text region complies with ASCI 2023, CCPA 2022, and WCAG AA guidelines.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed rounded-xl border-[var(--color-border-subtle)]">
              Select or hover over any bounding box on the left to inspect detailed statutory evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
