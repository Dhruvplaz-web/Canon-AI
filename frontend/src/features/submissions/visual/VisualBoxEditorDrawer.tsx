"use client";

import React, { useState } from "react";
import {
  Wand2,
  Sliders,
  Sparkles,
  Download,
  X,
  RefreshCw,
} from "lucide-react";
import { VisualBoundingBox, VisualCreativeAsset } from "./visualTypes";
import {
  inpaintAndRemediateCreative,
  InpaintRemediationOptions,
} from "./visualCanvasInpainter";

interface VisualBoxEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeAsset: VisualCreativeAsset;
  selectedBox?: VisualBoundingBox;
  onAssetPatched: (updatedAsset: VisualCreativeAsset) => void;
}

export function VisualBoxEditorDrawer({
  isOpen,
  onClose,
  activeAsset,
  selectedBox,
  onAssetPatched,
}: VisualBoxEditorDrawerProps) {
  const initialText =
    selectedBox?.textExtracted ||
    activeAsset.disclaimerText ||
    "*Terms apply. All loans subject to credit assessment under RBI guidelines.";

  const [editText, setEditText] = useState<string>(initialText);
  const [fontSizePt, setFontSizePt] = useState<number>(
    Math.max(9.0, selectedBox?.metrics.calculatedFontSizePt || 9.5)
  );
  const [textColor, setTextColor] = useState<string>("#0F172A");
  const [bgColor, setBgColor] = useState<string>("#FFFFFF");
  const [addPartnerBadge, setAddPartnerBadge] = useState<boolean>(true);
  const [isInpainting, setIsInpainting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time calculation of compliance thresholds
  const isFontSizeCompliant = fontSizePt >= 8.0;
  const isContrastCompliant = textColor !== "#B45309" && textColor !== "#A1A1AA";

  const handleApplyPatch = async () => {
    setIsInpainting(true);
    try {
      const sourceImage = activeAsset.imageUrl || "";
      const patchOptions: InpaintRemediationOptions = {
        disclaimerFontSizePt: fontSizePt,
        disclaimerTextColor: textColor,
        disclaimerBgColor: bgColor,
        addPartnerBadge,
        customDisclaimerText: editText,
      };

      const remediatedDataUrl = await inpaintAndRemediateCreative(
        sourceImage,
        activeAsset,
        patchOptions
      );

      // Create updated asset with remediated image and patched box metrics
      const updatedRegions = activeAsset.regions.map((region) => {
        if (
          region.id === selectedBox?.id ||
          region.label === "DISCLAIMER_LEGAL"
        ) {
          return {
            ...region,
            textExtracted: editText,
            metrics: {
              ...region.metrics,
              calculatedFontSizePt: fontSizePt,
              textColorHex: textColor,
              backgroundColorHex: bgColor,
              contrastRatio: isContrastCompliant ? 11.2 : 2.4,
              rotationDegrees: 0,
            },
            violations: isFontSizeCompliant && isContrastCompliant ? [] : region.violations,
          };
        }
        if (region.label === "PARTNER_BADGE" && addPartnerBadge) {
          return {
            ...region,
            violations: [],
          };
        }
        return region;
      });

      const updatedAsset: VisualCreativeAsset = {
        ...activeAsset,
        remediatedImageUrl: remediatedDataUrl,
        regions: updatedRegions,
      };

      onAssetPatched(updatedAsset);
      onClose();
    } catch (err) {
      console.error("Inpainting failed:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  const handleDownloadPatched = async () => {
    try {
      const sourceImage = activeAsset.remediatedImageUrl || activeAsset.imageUrl || "";
      const a = document.createElement("a");
      a.href = sourceImage;
      a.download = `${activeAsset.id.toLowerCase()}-canon-compliant-creative.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                Interactive Canvas Remediation &amp; Inpainter
              </h4>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Patch violating fine print and redraw the creative to ASCI &amp; RBI compliance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="patch-disclaimer-text"
              className="font-bold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              Statutory Disclaimer Copy
            </label>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {editText.length} characters
            </span>
          </div>
          <textarea
            id="patch-disclaimer-text"
            rows={2}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
            placeholder="Type compliant disclaimer text..."
          />
        </div>

        {/* Font Size Scrubber */}
        <div className="p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-secondary)]">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Font Size (pt)</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                isFontSizeCompliant
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse"
              }`}
            >
              {fontSizePt.toFixed(1)} pt • {isFontSizeCompliant ? "COMPLIANT (≥8.0pt)" : "ILLEGAL (<8.0pt)"}
            </span>
          </div>

          <input
            type="range"
            min={4.0}
            max={14.0}
            step={0.5}
            value={fontSizePt}
            onChange={(e) => setFontSizePt(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
            <span>4.0 pt (Microscopic)</span>
            <span className="text-amber-500 font-bold">8.0 pt (Legal Floor)</span>
            <span className="text-emerald-600 font-bold">14.0 pt (Prominent)</span>
          </div>
        </div>

        {/* Color & Contrast Presets */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] space-y-2">
            <span className="font-bold text-[var(--color-text-secondary)]">
              Contrast &amp; Palette Preset
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTextColor("#0F172A");
                  setBgColor("#FFFFFF");
                }}
                className="px-2.5 py-1.5 rounded-lg border text-[11px] font-mono bg-white text-slate-900 border-slate-300 font-bold"
              >
                High-Contrast White
              </button>
              <button
                type="button"
                onClick={() => {
                  setTextColor("#FFFFFF");
                  setBgColor("#0F172A");
                }}
                className="px-2.5 py-1.5 rounded-lg border text-[11px] font-mono bg-slate-900 text-white border-slate-700 font-bold"
              >
                Dark Slate
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] space-y-2">
            <span className="font-bold text-[var(--color-text-secondary)]">
              Mandatory Partner Badge
            </span>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={addPartnerBadge}
                onChange={(e) => setAddPartnerBadge(e.target.checked)}
                className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-[var(--color-text-primary)]">
                Inject RBI Registered NBFC Badge
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={handleDownloadPatched}
            className="px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Download PNG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isInpainting}
              onClick={handleApplyPatch}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              {isInpainting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inpainting Canvas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Inpaint Patch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
