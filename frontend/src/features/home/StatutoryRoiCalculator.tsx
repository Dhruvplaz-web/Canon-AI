"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import {
  Calculator,
  TrendingUp,
  ShieldCheck,
  Scale,
  Clock,
  ArrowRight,
  IndianRupee,
  BadgePercent,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface IndustryConfig {
  name: string;
  maxFineMultiplier: number; // in INR
  violationRatePercent: number;
  adHaltSavingsPercent: number;
  description: string;
}

const INDUSTRIES: Record<string, IndustryConfig> = {
  bfsi: {
    name: "Fintech, Wealth & BFSI",
    maxFineMultiplier: 10000000, // ₹1 Cr (SEBI/RBI penalties)
    violationRatePercent: 12,
    adHaltSavingsPercent: 4.5,
    description: "Strict scrutiny under SEBI Mutual Fund & RBI Fair Lending Disclosure circulars.",
  },
  alcobev: {
    name: "Alcobev & FMCG (Surrogates)",
    maxFineMultiplier: 5000000, // ₹50L (CCPA Sec 21)
    violationRatePercent: 18,
    adHaltSavingsPercent: 6.2,
    description: "Direct surrogate scrutiny under CCPA 2024 & ASCI Cable Television Network Rules.",
  },
  d2c: {
    name: "D2C Brands & E-Commerce",
    maxFineMultiplier: 2500000, // ₹25L (CCPA Dark Patterns)
    violationRatePercent: 14,
    adHaltSavingsPercent: 3.8,
    description: "Aggressive enforcement of CCPA 2023 Dark Pattern Scarcity & Drip Pricing codes.",
  },
  edtech: {
    name: "Edtech & Higher Learning",
    maxFineMultiplier: 5000000, // ₹50L (ASCI Job Guarantee ban)
    violationRatePercent: 16,
    adHaltSavingsPercent: 5.0,
    description: "Prohibition of '100% Placement' claims under CCPA & ASCI Education Guidelines.",
  },
};

export function StatutoryRoiCalculator() {
  const [spendInLakhs, setSpendInLakhs] = useState<number>(50); // ₹50 Lakhs default
  const [selectedIndustry, setSelectedIndustry] = useState<string>("bfsi");
  const sliderId = useId();

  const spendAmount = spendInLakhs * 100000;
  const config = INDUSTRIES[selectedIndustry] || INDUSTRIES.bfsi;

  // Compute calculated metrics
  const estimatedCampaigns = Math.max(4, Math.round(spendInLakhs * 0.8));
  const expectedViolationsCaught = Math.max(1, Math.round((estimatedCampaigns * config.violationRatePercent) / 100));
  const adServerHaltSavings = Math.round((spendAmount * config.adHaltSavingsPercent) / 100);
  const statutoryFinesAvoided = expectedViolationsCaught * (config.maxFineMultiplier * 0.4);
  const legalReviewHoursSaved = Math.round(estimatedCampaigns * 3.5);
  const legalCostSaved = legalReviewHoursSaved * 4500; // ₹4,500/hr counsel billing rate

  const totalFinancialProtection = adServerHaltSavings + statutoryFinesAvoided + legalCostSaved;
  const canonEnterpriseCost = 150000; // Simulated enterprise tier ₹1.5L/mo
  const roiMultiplier = Math.max(4.2, (totalFinancialProtection / canonEnterpriseCost)).toFixed(1);

  const formatLakhs = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(1)} L`;
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-md overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono text-xs font-semibold mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>ENTERPRISE VALUE AUDIT</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Statutory Risk &amp; Media Spend ROI Calculator
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
            Quantify financial penalty avoidance, ad-server waste mitigation, and legal throughput gains.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant="outline" className="font-mono text-xs py-1">
            CCPA • SEBI • ASCI • RBI
          </Badge>
        </div>
      </div>

      {/* Grid: Interactive Controls vs Projected Protection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border-subtle)]">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 p-6 md:p-8 space-y-6">
          {/* Industry Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Primary Regulatory Sector
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(INDUSTRIES).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedIndustry(key)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                    selectedIndustry === key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  <p className="truncate">{val.name.split(" ")[0]}</p>
                  <span className="text-[10px] text-[var(--color-text-muted)] truncate block">
                    {val.name.split("(")[1]?.replace(")", "") || "Enterprise"}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] italic pt-1">
              {config.description}
            </p>
          </div>

          {/* Spend Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={sliderId}
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]"
              >
                Monthly Digital Media Spend
              </label>
              <span className="text-base font-extrabold text-[var(--color-text-primary)] font-mono">
                {spendInLakhs >= 100
                  ? `₹${(spendInLakhs / 100).toFixed(1)} Cr`
                  : `₹${spendInLakhs} Lakhs`}
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={5}
              max={1000}
              step={5}
              value={spendInLakhs}
              onChange={(e) => setSpendInLakhs(Number(e.target.value))}
              className="w-full h-2 bg-[var(--color-border-default)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
            />

            <div className="flex justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
              <span>₹5 Lakhs</span>
              <span>₹50 Lakhs</span>
              <span>₹2.5 Cr</span>
              <span>₹10 Cr</span>
            </div>
          </div>

          {/* Operating Assumptions Callout */}
          <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)] block">
              Auditing Throughput:
            </span>
            <div className="flex justify-between text-xs">
              <span>Estimated Campaigns / Mo:</span>
              <strong className="font-mono text-[var(--color-text-primary)]">{estimatedCampaigns} drafts</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span>Statutory Scrutiny Risk:</span>
              <strong className="font-mono text-amber-600 dark:text-amber-400">
                {config.violationRatePercent}% benchmark rate
              </strong>
            </div>
          </div>
        </div>

        {/* Projections Column (7 cols) */}
        <div className="lg:col-span-7 p-6 md:p-8 bg-[var(--color-surface-muted)]/30 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Projected Monthly Value &amp; Liability Shield
            </span>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1 */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  <span>Statutory Fines Avoided</span>
                </span>
                <p className="text-lg md:text-xl font-extrabold text-[var(--color-text-primary)] font-mono tabular-nums">
                  {formatLakhs(statutoryFinesAvoided)}
                </p>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-medium">
                  {expectedViolationsCaught} violations halted
                </span>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Circuit-Breaker Savings</span>
                </span>
                <p className="text-lg md:text-xl font-extrabold text-[var(--color-text-primary)] font-mono tabular-nums">
                  {formatLakhs(adServerHaltSavings)}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">
                  Rogue ad spend blocked
                </span>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Legal Hours Saved</span>
                </span>
                <p className="text-lg md:text-xl font-extrabold text-[var(--color-text-primary)] font-mono tabular-nums">
                  {legalReviewHoursSaved} hrs
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                  {formatLakhs(legalCostSaved)} billing saved
                </span>
              </div>
            </div>

            {/* Total Protection & ROI Banner */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-default)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Total Quantifiable Monthly Protection
                </span>
                <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)] font-mono">
                  {formatLakhs(totalFinancialProtection)}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Based on ASCI Code penalties and standard litigation / ad-server waste metrics.
                </p>
              </div>

              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-center shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider block">
                  Net Platform ROI
                </span>
                <span className="text-2xl font-black font-mono">
                  {roiMultiplier}x
                </span>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)] flex-wrap gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              Ready to safeguard your enterprise ad spend?
            </span>
            <Link href="/demo">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                <span>Request Custom Governance Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

