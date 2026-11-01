"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Crosshair, Scale } from "lucide-react";
import { VisualBoundingBox } from "./visualTypes";

interface VisualMagnifierLoupeProps {
  isEnabled: boolean;
  activeBox?: VisualBoundingBox;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  imageUrl?: string;
}

export function VisualMagnifierLoupe({
  isEnabled,
  activeBox,
  canvasContainerRef,
  imageUrl,
}: VisualMagnifierLoupeProps) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !isEnabled) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMousePos({ x, y });
      } else {
        setMousePos(null);
      }
    };

    const handleMouseLeave = () => {
      setMousePos(null);
    };

    window.addEventListener("resize", updateSize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", updateSize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isEnabled, canvasContainerRef]);

  if (!isEnabled || !mousePos || containerSize.width === 0) {
    return null;
  }

  const loupeRadius = 85; // 170px lens
  const zoomFactor = 3.0; // 3x optical magnification

  // Calculate background image offset so cursor is centered in the loupe lens
  const bgPosX = -(mousePos.x * zoomFactor - loupeRadius);
  const bgPosY = -(mousePos.y * zoomFactor - loupeRadius);

  const metrics = activeBox?.metrics || {
    calculatedFontSizePt: 4.2,
    contrastRatio: 2.3,
    textColorHex: "#B45309",
    backgroundColorHex: "#FEF3C7",
  };

  const isFontCompliant = metrics.calculatedFontSizePt >= 8.0;
  const isContrastCompliant = metrics.contrastRatio >= 4.5;

  // Position HUD tooltip to left or right depending on cursor pos
  const isNearRight = mousePos.x > containerSize.width - 240;
  const hudLeft = isNearRight ? mousePos.x - 220 : mousePos.x + loupeRadius + 15;
  const hudTop = Math.max(10, Math.min(containerSize.height - 130, mousePos.y - 40));

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden select-none">
      {/* Floating Loupe Lens */}
      <div
        style={{
          width: `${loupeRadius * 2}px`,
          height: `${loupeRadius * 2}px`,
          left: `${mousePos.x - loupeRadius}px`,
          top: `${mousePos.y - loupeRadius}px`,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: `${containerSize.width * zoomFactor}px ${containerSize.height * zoomFactor}px`,
          backgroundPosition: `${bgPosX}px ${bgPosY}px`,
          backgroundRepeat: "no-repeat",
        }}
        className="absolute rounded-full border-2 border-cyan-400 bg-neutral-900 shadow-[0_0_25px_rgba(6,182,212,0.65)] ring-4 ring-black/40 overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Crosshair Optical Reticle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-full h-[1px] bg-cyan-400" />
          <div className="h-full w-[1px] bg-cyan-400 absolute" />
          <div className="w-6 h-6 rounded-full border border-cyan-400 absolute" />
        </div>

        {/* Loupe Lens Glare Reflection */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
      </div>

      {/* Synchronized Micro-Print Inspection HUD */}
      <div
        style={{
          left: `${hudLeft}px`,
          top: `${hudTop}px`,
        }}
        className="absolute w-52 p-3 rounded-xl border border-cyan-500/40 bg-neutral-950/90 text-white backdrop-blur-md shadow-xl text-xs space-y-1.5 font-sans"
      >
        <div className="flex items-center justify-between font-mono text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1">
            <Crosshair className="w-3 h-3" />
            <span>3x Optical Loupe</span>
          </span>
          <span>{activeBox ? activeBox.label : "CANVAS"}</span>
        </div>

        {/* Measured Font Size */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800">
          <span className="text-neutral-400">Measured Font:</span>
          <span
            className={`font-mono font-bold flex items-center gap-1 ${
              isFontCompliant ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {metrics.calculatedFontSizePt.toFixed(1)} pt
            {isFontCompliant ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            )}
          </span>
        </div>

        {/* WCAG Contrast */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">WCAG Contrast:</span>
          <span
            className={`font-mono font-bold flex items-center gap-1 ${
              isContrastCompliant ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {metrics.contrastRatio.toFixed(1)}:1
            {isContrastCompliant ? (
              <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300">PASS</span>
            ) : (
              <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300">FAIL</span>
            )}
          </span>
        </div>

        {/* Statutory Citation Rule */}
        <div className="text-[9.5px] font-mono text-neutral-400 pt-1 border-t border-neutral-800 flex items-center gap-1">
          <Scale className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span className="truncate">CCPA Sec 4(2) • Min 8.0pt Floor</span>
        </div>
      </div>
    </div>
  );
}
