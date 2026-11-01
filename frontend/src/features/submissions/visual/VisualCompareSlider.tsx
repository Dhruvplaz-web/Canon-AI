"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AlertTriangle, Wand2, ShieldCheck, ShieldAlert } from "lucide-react";

interface VisualCompareSliderProps {
  originalImageUrl: string;
  remediatedImageUrl: string;
  aspectRatioClass: string;
  title: string;
  sliderPos: number; // 0 to 100
  onSliderChange: (pos: number) => void;
  originalFineInr?: number;
}

export function VisualCompareSlider({
  originalImageUrl,
  remediatedImageUrl,
  aspectRatioClass,
  title,
  sliderPos,
  onSliderChange,
  originalFineInr = 5000000,
}: VisualCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
      onSliderChange(Math.round(percentage));
    },
    [onSliderChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleMove]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSliderChange(Math.max(0, sliderPos - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSliderChange(Math.min(100, sliderPos + 5));
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Top Value Badges */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span>Original Ad (₹{(originalFineInr / 100000).toFixed(0)}L Penalty Exposure)</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>✨ Canon Auto-Remediated (Statutory Immunity)</span>
        </div>
      </div>

      {/* Main Interactive Slider Canvas Frame */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Before and after compliance remediation comparison slider. Use arrow keys to slide."
        aria-valuenow={sliderPos}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`relative ${aspectRatioClass} w-full rounded-2xl overflow-hidden border-2 border-[var(--color-border-subtle)] shadow-xl cursor-ew-resize focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500`}
      >
        {/* Layer 1: Original Defective Ad (Background) */}
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalImageUrl}
            alt={`Original Defective Creative: ${title}`}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
          {/* Original Watermark Tag */}
          <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ORIGINAL (VIOLATING)</span>
          </div>
        </div>

        {/* Layer 2: Canon Auto-Remediated Ad (Clipped to Slider Pos) */}
        <div
          style={{
            clipPath: `inset(0 0 0 ${sliderPos}%)`,
          }}
          className="absolute inset-0 bg-neutral-900 flex items-center justify-center overflow-hidden transition-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={remediatedImageUrl}
            alt={`Canon Remediated Creative: ${title}`}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
          {/* Remediated Watermark Tag */}
          <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>✨ CANON REMEDIATED</span>
          </div>
        </div>

        {/* Draggable Divider Bar */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-30 pointer-events-none"
        >
          {/* Center Grab Handle Pill */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white dark:bg-neutral-950 border-2 border-blue-600 shadow-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
            ‹ | ›
          </div>
        </div>
      </div>

      {/* Ergonomic Helper Text */}
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] px-1">
        <span>Drag slider left/right or use keyboard ← → to compare</span>
        <span className="font-mono">{sliderPos}% Remediated View</span>
      </div>
    </div>
  );
}
