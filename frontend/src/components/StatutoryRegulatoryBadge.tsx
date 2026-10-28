"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Scale,
  ShieldAlert,
  FileCheck2,
  Eye,
  ExternalLink,
  X,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import { RegulatoryStatute, StatutoryMandateTier } from "@/types/api";

interface StatutoryRegulatoryBadgeProps {
  statute?: RegulatoryStatute | null;
  compact?: boolean;
  className?: string;
}

function getTierConfig(tier: StatutoryMandateTier) {
  switch (tier) {
    case "STATUTORY_MANDATE":
      return {
        badgeStyle: "bg-[#FFF0F5] border-[#FF0055] text-[#D6004B] hover:bg-[#FFE4EE]",
        tierLabel: "Statutory Mandate (Primary Law)",
        tierBadgeStyle: "bg-[#FF0055] text-white",
        Icon: Scale,
      };
    case "REGULATORY_RULE":
      return {
        badgeStyle: "bg-[#FFD700] border-black text-black hover:bg-[#FFE234]",
        tierLabel: "Regulatory Rule (Agency Admin)",
        tierBadgeStyle: "bg-black text-[#FFD700]",
        Icon: ShieldAlert,
      };
    case "SUBSTANTIATION_MANDATE":
      return {
        badgeStyle: "bg-[#00C2CB] border-black text-black hover:bg-[#2EE5EE]",
        tierLabel: "Substantiation Mandate (FTC Policy)",
        tierBadgeStyle: "bg-black text-[#00C2CB]",
        Icon: FileCheck2,
      };
    case "ACCESSIBILITY_STANDARD":
      return {
        badgeStyle: "bg-[#F3E8FF] border-[#7928CA] text-[#7928CA] hover:bg-[#E9D5FF]",
        tierLabel: "Accessibility Standard (Civil Rights)",
        tierBadgeStyle: "bg-[#7928CA] text-white",
        Icon: Eye,
      };
    default:
      return {
        badgeStyle: "bg-[#F8F9FA] border-black text-black hover:bg-[#E5E7EB]",
        tierLabel: "Statutory Reference",
        tierBadgeStyle: "bg-black text-white",
        Icon: HelpCircle,
      };
  }
}

function formatJurisdiction(jur: string): string {
  switch (jur) {
    case "US_FEDERAL":
      return "US Federal";
    case "US_STATE_NY":
      return "US (NY State)";
    case "EU":
      return "European Union";
    case "INTERNATIONAL":
      return "International";
    default:
      return jur;
  }
}

export function StatutoryRegulatoryBadge({
  statute,
  compact = false,
  className = "",
}: StatutoryRegulatoryBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on Escape key or outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!statute) {
    return null;
  }

  const { badgeStyle, tierLabel, tierBadgeStyle, Icon } = getTierConfig(
    statute.mandate_tier
  );

  // Short display label: prefer first segment before bullet or statute_code
  const shortLabel =
    statute.section_pin.split("•")[0]?.trim() || statute.statute_code;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Statutory authority: ${statute.act_name}. Click for legal details.`}
        title="View governing statutory authority and penalty exposure"
        className={`inline-flex items-center gap-1.5 font-mono font-black border-2 rounded shadow-xs cursor-pointer transition ${badgeStyle} ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
        }`}
      >
        <Icon className={compact ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
        <span className="truncate max-w-[200px]">{shortLabel}</span>
        <span className="opacity-70 text-[9px] font-sans">⚖️</span>
      </button>

      {/* Interactive Neo-Brutalist Legal Explainer Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Legal grounding: ${statute.act_name}`}
          className="absolute z-50 left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-white border-2.5 border-black rounded-xl p-4 shadow-[5px_5px_0px_#000] text-black flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${tierBadgeStyle}`}
                >
                  {tierLabel}
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#E6FAFA] text-black px-1.5 py-0.5 rounded border border-black/30">
                  {formatJurisdiction(statute.jurisdiction)}
                </span>
              </div>
              <h4 className="text-xs font-black text-black leading-tight mt-0.5">
                {statute.act_name}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded border border-black hover:bg-[#FF00FF] hover:text-white transition cursor-pointer shrink-0"
              title="Close legal explainer"
              aria-label="Close legal explainer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Official Pin & Agency */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold text-[#555555] uppercase tracking-wider">
                Official Statutory Pin
              </span>
              <code className="text-xs font-mono font-black text-black bg-[#F4F0EA] px-2 py-1 rounded border border-black/20 break-all select-all">
                {statute.section_pin}
              </code>
            </div>

            <div className="flex items-baseline justify-between text-xs pt-0.5">
              <span className="font-bold text-[#555555]">Enforcing Agency:</span>
              <span className="font-mono font-black text-black text-right">
                {statute.enforcement_body}
              </span>
            </div>
          </div>

          {/* Mandate Summary */}
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded p-2.5 text-xs font-medium text-[#222222] leading-relaxed">
            <p>{statute.mandate_summary}</p>
          </div>

          {/* Statutory Civil Penalty Exposure Callout */}
          <div className="bg-[#FFF0F5] border-2 border-[#FF0055] rounded-lg p-2.5 flex items-start gap-2 shadow-xs">
            <AlertOctagon className="w-4 h-4 text-[#FF0055] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-black text-[#FF0055] uppercase tracking-wider">
                Statutory Civil Penalty Exposure
              </span>
              <span className="text-xs font-bold text-black leading-snug">
                {statute.penalty_exposure}
              </span>
            </div>
          </div>

          {/* Official Primary Source External Link */}
          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2 text-[11px]">
            <a
              href={statute.official_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-black hover:text-[#00C2CB] hover:underline transition"
            >
              <span>Read Official Government Text</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-[#666666] hover:text-black hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          {/* Educational Disclaimer */}
          <div className="text-[9px] text-[#666666] font-mono leading-tight border-t border-black/10 pt-1.5">
            Disclaimer: Statutory penalties reflect maximum published agency schedules. For enterprise brand compliance governance purposes only.
          </div>
        </div>
      )}
    </div>
  );
}

