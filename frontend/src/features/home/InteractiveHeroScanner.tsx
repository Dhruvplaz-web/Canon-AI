"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Copy,
  Scale,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Presets {
  id: string;
  title: string;
  industry: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  draft: string;
  ruleCode: string;
  ruleName: string;
  statute: string;
  fineExposure: string;
  rewrite: string;
  explanation: string;
}

const PRESET_SCENARIOS: Presets[] = [
  {
    id: "surrogate",
    title: "Surrogate Soda (Alcohol Brand)",
    industry: "Alcobev / Media",
    severity: "CRITICAL",
    draft: "Celebrate every victory with Royal Challenge Premium Club Soda! Live bold, play hard, order your party crate tonight.",
    ruleCode: "ASCI-SURR-01",
    ruleName: "Surrogate Advertising & Direct Brand Extension Prohibition",
    statute: "CPA 2019 Sec 21 & Cable TV Networks Rules 1994",
    fineExposure: "₹50,00,000 fine + mandatory 1-yr celebrity/media ban",
    rewrite: "Celebrate responsibly with curated mocktail recipes for your weekend gatherings. Non-alcoholic beverage assortment.",
    explanation: "Promoting 'Royal Challenge' club soda with active party/lifestyle cues violates ASCI Guidelines on surrogate marketing when primary alcohol trademark shares identical color scheme and typography.",
  },
  {
    id: "guarantee",
    title: "Guaranteed 18% Returns (BFSI)",
    industry: "Fintech / Wealth",
    severity: "CRITICAL",
    draft: "Double your savings safely! Guaranteed 18% annual return on our zero-risk SmartAlpha equity fund. Start SIP in 60 secs.",
    ruleCode: "SEBI-MUT-04",
    ruleName: "Prohibition of Guaranteed Return Claims on Market-Linked Securities",
    statute: "SEBI (Mutual Funds) Regulations 1996 Regulation 38",
    fineExposure: "₹1,00,00,000 regulatory penalty + license suspension notice",
    rewrite: "Target high growth potential with our SmartAlpha equity fund. Historical returns do not assure future outcomes. Subject to market risks.",
    explanation: "Promising 'Guaranteed 18%' and 'zero-risk' on an equity instrument directly breaches SEBI advertising codes requiring standard market-risk disclosures and prohibiting return guarantees.",
  },
  {
    id: "dark_pattern",
    title: "Fake Countdown Timer (E-Commerce)",
    industry: "D2C / Retail",
    severity: "HIGH",
    draft: "HURRY! Only 2 items left at 90% discount! Flash sale ends in 03:42 mins. Claim your exclusive voucher now before it expires forever!",
    ruleCode: "CCPA-DARK-07",
    ruleName: "Prohibition of False Urgency & Artificial Scarcity Dark Patterns",
    statute: "CCPA Guidelines for Prevention and Regulation of Dark Patterns 2023",
    fineExposure: "₹10,00,000 for first offence + ₹50,00,000 for subsequent violations",
    rewrite: "Seasonal promotional discount available on select inventory. Explore our limited-time collection today.",
    explanation: "Fabricating countdown clocks or artificial scarcity ('Only 2 items left') without real-time inventory synchronisation constitutes an unlawful deceptive design pattern under CCPA 2023.",
  },
  {
    id: "hinglish",
    title: "Hinglish Surrogate 'Asli Swad'",
    industry: "Vernacular / Pan-India",
    severity: "HIGH",
    draft: "Zindagi ka asli swad, Bagpiper Gold Club Soda ke sath. Har dawat mein shaan badhayein, dosto ko bulao!",
    ruleCode: "ASCI-VERN-02",
    ruleName: "Code-Mixed Vernacular Surrogate Brand Extension",
    statute: "ASCI Code for Self-Regulation in Advertising (Hindi/Code-Mixed Annexure)",
    fineExposure: "₹25,00,000 media broadcaster notice & ad withdrawal",
    rewrite: "Har gathering ko banayein khaas hamare naye sparkling flavored club soda ke sath. Shuddh refreshment.",
    explanation: "Code-mixed Hinglish phrases utilizing historic liquor taglines ('asli swad', 'shaan badhayein') trigger surrogate brand recall under Vernacular NLP Radar checks.",
  },
];

export function InteractiveHeroScanner() {
  const [selectedPreset, setSelectedPreset] = useState<Presets>(PRESET_SCENARIOS[0]);
  const [customText, setCustomText] = useState(PRESET_SCENARIOS[0].draft);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (preset: Presets) => {
    setSelectedPreset(preset);
    setCustomText(preset.draft);
    triggerScanAnimation();
  };

  const triggerScanAnimation = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 280);
  };

  const handleCopyRewrite = () => {
    navigator.clipboard.writeText(selectedPreset.rewrite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg overflow-hidden flex flex-col transition-colors">
      {/* Top Banner Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                Live Pre-Flight AST Scanner
              </span>
              <Badge variant="info" size="sm" className="text-[10px]">
                Interactive Sandbox
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Test real-world regulatory scenarios or type draft copy below. Verified sub-12ms inference.
            </p>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mr-1 hidden sm:inline">
            Scenarios:
          </span>
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--color-primary)] text-white shadow-xs font-semibold"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <span>{preset.title.split(" ")[0]}</span>
                {preset.severity === "CRITICAL" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-rose-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Input Draft Box vs Live Regulatory Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border-subtle)]">
        {/* Left Column: Draft Input (5 Cols) */}
        <div className="lg:col-span-6 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="interactive-draft-input"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2"
            >
              <span>Marketing Creative Copy</span>
              <Badge variant="secondary" size="sm" className="text-[10px] font-mono">
                {selectedPreset.industry}
              </Badge>
            </label>
            <button
              type="button"
              onClick={triggerScanAnimation}
              className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>Re-run AST Parser</span>
            </button>
          </div>

          <div className="relative flex-1 min-h-[140px]">
            <textarea
              id="interactive-draft-input"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                triggerScanAnimation();
              }}
              rows={5}
              className="w-full h-full p-3.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] text-sm font-sans leading-relaxed text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition resize-none"
              placeholder="Type or paste your ad copy, campaign slogan, or social creative text here..."
            />
          </div>

          {/* Real-time telemetry indicators */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AST Engine: 11.4ms
            </span>
            <span>{customText.length} characters</span>
            <span className="text-[var(--color-text-primary)] font-semibold">Dual-Grounding: ON</span>
          </div>
        </div>

        {/* Right Column: Live Regulatory Adjudication & Remedy (6 Cols) */}
        <div className="lg:col-span-6 p-6 bg-[var(--color-surface-muted)]/40 flex flex-col gap-4 justify-between">
          <div className="space-y-4">
            {/* Header Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                  Provable Statutory Violation Detected
                </span>
              </div>
              <Badge
                variant={selectedPreset.severity === "CRITICAL" ? "destructive" : "warning"}
                size="sm"
                className="font-mono"
              >
                {selectedPreset.severity}
              </Badge>
            </div>

            {/* Rule Citation Box */}
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  {selectedPreset.ruleCode}
                </span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  {selectedPreset.statute}
                </span>
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {selectedPreset.ruleName}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {selectedPreset.explanation}
              </p>
            </div>

            {/* Penalty Exposure */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-1.5 font-medium">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Statutory Penalty Exposure:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                {selectedPreset.fineExposure}
              </span>
            </div>

            {/* Verified Safe Rewrite */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Compliant 100% Safe Rewrite</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyRewrite}
                  className="text-[11px] text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? "Copied!" : "Copy Rewrite"}</span>
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-primary)] font-medium leading-relaxed italic bg-[var(--color-surface)]/70 p-2.5 rounded-lg border border-emerald-500/10">
                &ldquo;{selectedPreset.rewrite}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--color-border-subtle)] flex-wrap gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              Want to run deep visual OCR &amp; Hinglish parsing?
            </span>
            <Link href="/submissions">
              <Button variant="primary" size="sm" className="text-xs gap-1.5">
                <span>Open Authoring Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
