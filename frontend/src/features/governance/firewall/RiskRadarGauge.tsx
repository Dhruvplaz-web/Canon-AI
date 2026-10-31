"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface RiskRadarGaugeProps {
  score: number; // 0 to 100
  totalViolationsCount: number;
  unmitigatedLiabilityInr: number;
  onFilterViolations?: () => void;
}

export function RiskRadarGauge({
  score,
  totalViolationsCount,
  unmitigatedLiabilityInr,
  onFilterViolations,
}: RiskRadarGaugeProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine severity tier
  const tier: "LOW" | "MODERATE" | "CRITICAL" =
    clampedScore < 35 ? "LOW" : clampedScore < 70 ? "MODERATE" : "CRITICAL";

  // Angle math for semi-circle: 180deg (left, score 0) to 0deg (right, score 100)
  // needle rotation in degrees: -90deg (score 0) to +90deg (score 100)
  const needleRotationDeg = (clampedScore / 100) * 180 - 90;

  // Arc path constants
  const cx = 120;
  const cy = 100;
  const radius = 80;

  // Format currency
  const formattedLiability = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(unmitigatedLiabilityInr);

  return (
    <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs flex flex-col justify-between">
      {/* Gauge Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          {tier === "CRITICAL" ? (
            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
          ) : tier === "MODERATE" ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
            Statutory Liability Risk Gauge
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
            tier === "CRITICAL"
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
              : tier === "MODERATE"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {tier === "CRITICAL"
            ? "CRITICAL EXPOSURE"
            : tier === "MODERATE"
            ? "ELEVATED RISK"
            : "GOVERNANCE COMPLIANT"}
        </span>
      </div>

      {/* SVG Speedometer Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg
          viewBox="0 0 240 135"
          className="w-full max-w-[260px] h-auto overflow-visible select-none"
          role="img"
          aria-label={`Risk gauge score ${clampedScore} out of 100. Status: ${tier}`}
        >
          <defs>
            {/* Color Zone Gradients */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Track Arc (Semi-circle from 180 to 0 deg) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            className="text-neutral-200 dark:text-neutral-800"
          />

          {/* Colored Active Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * radius}`}
            strokeDashoffset={`${Math.PI * radius * (1 - clampedScore / 100)}`}
            className="transition-all duration-700 ease-out"
          />

          {/* Ticks and Labels */}
          <text x={cx - radius - 2} y={cy + 16} fontSize="9" fill="currentColor" className="text-neutral-400 font-mono" textAnchor="middle">
            0
          </text>
          <text x={cx} y={cy - radius - 6} fontSize="9" fill="currentColor" className="text-neutral-400 font-mono" textAnchor="middle">
            50
          </text>
          <text x={cx + radius + 2} y={cy + 16} fontSize="9" fill="currentColor" className="text-neutral-400 font-mono" textAnchor="middle">
            100
          </text>

          {/* Needle Group with Animated Pivot */}
          <g
            style={{
              transform: `rotate(${needleRotationDeg}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            filter="url(#needleGlow)"
          >
            {/* Needle Body */}
            <polygon
              points={`${cx - 3},${cy} ${cx},${cy - radius + 8} ${cx + 3},${cy}`}
              fill={tier === "CRITICAL" ? "#EF4444" : tier === "MODERATE" ? "#F59E0B" : "#10B981"}
            />
            {/* Center Pivot Circle */}
            <circle cx={cx} cy={cy} r="6" fill="#18181B" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        </svg>

        {/* Central Metric Value Display */}
        <div className="text-center -mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-[var(--color-text-primary)]">
              {clampedScore}
            </span>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">/ 100</span>
          </div>
          <div className="text-[11px] font-mono text-[var(--color-text-secondary)]">
            Active RBI / ASCI Risk Score
          </div>
        </div>
      </div>

      {/* Gauge Footer Context Card */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
        <div>
          <div className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase">Unhedged Liability</div>
          <div className="font-bold font-mono text-rose-600 dark:text-rose-400">
            {formattedLiability}
          </div>
        </div>
        {onFilterViolations && totalViolationsCount > 0 ? (
          <button
            type="button"
            onClick={onFilterViolations}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold border border-rose-500/20 transition-all flex items-center gap-1"
          >
            <span>Inspect {totalViolationsCount} Breaches</span>
            <span>&rarr;</span>
          </button>
        ) : (
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>All Channels Protected</span>
          </div>
        )}
      </div>
    </div>
  );
}

