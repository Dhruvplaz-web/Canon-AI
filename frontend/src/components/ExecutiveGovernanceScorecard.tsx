"use client";

import React, { useState, useId } from "react";
import {
  TrendingUp,
  DollarSign,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Sliders,
  Info,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  FileText,
  Building2,
  Zap,
} from "lucide-react";

export interface ExecutiveGovernanceScorecardProps {
  className?: string;
}

export function ExecutiveGovernanceScorecard({ className = "" }: ExecutiveGovernanceScorecardProps) {
  // Calculator Interactive Inputs (Task 3.3)
  const [monthlyVolume, setMonthlyVolume] = useState<number>(50); // Default 50, range 10-500
  const [hourlyLegalRate, setHourlyLegalRate] = useState<number>(350); // Default $350, range 150-750
  const [showAssumptions, setShowAssumptions] = useState<boolean>(true);

  // Generate unique stable IDs for form controls
  const volumeSliderId = useId();
  const volumeNumberId = useId();
  const rateSliderId = useId();
  const rateNumberId = useId();

  // Model Constants & Assumptions
  const BASELINE_LEGAL_HOURS_PER_CAMPAIGN = 2.0; // Hours spent by outside counsel on manual review
  const CANON_LEGAL_HOURS_PER_CAMPAIGN = 0.2; // Hours required with Canon Double Receipts (12 mins)
  const HOURS_SAVED_PER_CAMPAIGN = BASELINE_LEGAL_HOURS_PER_CAMPAIGN - CANON_LEGAL_HOURS_PER_CAMPAIGN; // 1.8 hrs saved
  const ASSUMED_ANNUAL_PLATFORM_COST = 36000; // $3,000/mo illustrative enterprise license (DEC-02)

  // Calculations
  const annualCampaignVolume = monthlyVolume * 12;
  const annualHoursSaved = annualCampaignVolume * HOURS_SAVED_PER_CAMPAIGN;
  const grossAnnualSavings = annualHoursSaved * hourlyLegalRate;
  const netAnnualSavings = grossAnnualSavings - ASSUMED_ANNUAL_PLATFORM_COST;
  const netRoiPercentage =
    ASSUMED_ANNUAL_PLATFORM_COST > 0
      ? (netAnnualSavings / ASSUMED_ANNUAL_PLATFORM_COST) * 100
      : 0;
  const monthlyGrossSavings = grossAnnualSavings / 12;
  const paybackMonths =
    monthlyGrossSavings > 0
      ? ASSUMED_ANNUAL_PLATFORM_COST / monthlyGrossSavings
      : 0;

  // Presets for quick executive exploration
  const applyPreset = (volume: number, rate: number) => {
    setMonthlyVolume(volume);
    setHourlyLegalRate(rate);
  };

  const handleReset = () => {
    setMonthlyVolume(50);
    setHourlyLegalRate(350);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section
      aria-label="Executive Governance ROI Scorecard & Fine Prevention Calculator"
      className={`flex flex-col gap-6 ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE KPI CARDS (Assignment Specified) */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Executive Governance ROI &amp; Risk Scorecard
              </h2>
              <p className="text-xs text-slate-500">
                High-level brand governance telemetry, compliance velocity, and statutory fine risk mitigation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Executive Briefing View</span>
            </span>
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI Card 1: First-Time Pass Rate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  First-Time Pass Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    78.4%
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <ArrowUpRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
                    +20.1%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Baseline pre-Canon:</span>
                <span className="font-mono font-medium text-slate-500 line-through">58.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">24-draft empirical benchmark</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">
                  Illustrative Demo Metric
                </span>
              </div>
            </div>
          </div>

          {/* KPI Card 2: Review Turnaround */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Review Turnaround
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    1.2 hrs
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    97.5% faster
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Legacy legal review queue:</span>
                <span className="font-mono font-medium text-slate-500 line-through">48.0 hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Submission-to-signoff latency</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">
                  Illustrative Demo Metric
                </span>
              </div>
            </div>
          </div>

          {/* KPI Card 3: Estimated Fines Prevented */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Est. Fines Prevented
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    $185,000
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    4 Blocks
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Statutory exposure blocked:</span>
                <span className="font-mono font-medium text-slate-700">FTC / CFPB / EU AI Act</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Pre-publication intercept</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">
                  Illustrative Demo Metric
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE ROI CALCULATOR & SAVINGS SIMULATOR */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Enterprise ROI &amp; Legal Cost Savings Calculator
              </h3>
              <p className="text-xs text-slate-500">
                Adjust monthly volume and outside counsel rates to project annual operational savings and net ROI.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(20, 275)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            >
              Seed (20/mo)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(50, 350)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            >
              Mid-Market (50/mo)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(200, 500)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            >
              Enterprise (200/mo)
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset to defaults"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Controls on Left, Outputs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: SLIDERS & INPUTS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Sliders className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Operating Assumptions
              </span>
            </div>

            {/* Input 1: Monthly Campaign Volume */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={volumeNumberId}
                  className="text-xs font-bold text-slate-800"
                >
                  Monthly Campaign Volume
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id={volumeNumberId}
                    type="number"
                    min={10}
                    max={500}
                    step={5}
                    value={monthlyVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setMonthlyVolume(Math.min(500, Math.max(10, val)));
                      }
                    }}
                    className="w-20 px-2 py-1 text-right text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-500">/ mo</span>
                </div>
              </div>

              <input
                id={volumeSliderId}
                aria-label="Monthly Campaign Volume Slider"
                type="range"
                min={10}
                max={500}
                step={5}
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>10/mo</span>
                <span className="text-slate-600 font-semibold">{annualCampaignVolume} campaigns / yr</span>
                <span>500/mo</span>
              </div>
            </div>

            {/* Input 2: External Legal Review Cost */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={rateNumberId}
                  className="text-xs font-bold text-slate-800"
                >
                  External Legal Review Cost
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500">$</span>
                  <input
                    id={rateNumberId}
                    type="number"
                    min={150}
                    max={750}
                    step={25}
                    value={hourlyLegalRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setHourlyLegalRate(Math.min(750, Math.max(150, val)));
                      }
                    }}
                    className="w-20 px-2 py-1 text-right text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-500">/ hr</span>
                </div>
              </div>

              <input
                id={rateSliderId}
                aria-label="External Legal Review Cost Slider"
                type="range"
                min={150}
                max={750}
                step={25}
                value={hourlyLegalRate}
                onChange={(e) => setHourlyLegalRate(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>$150/hr</span>
                <span className="text-slate-600 font-semibold">${hourlyLegalRate}/hr billing rate</span>
                <span>$750/hr</span>
              </div>
            </div>

            {/* Assumed Review Time Savings Callout */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Assumed Review Time Saved:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  1.8 hrs / campaign
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Baseline manual review takes ~2.0 hrs; automated AST verification reduces outside counsel review to ~0.2 hrs (12 mins).
              </p>
            </div>
          </div>

          {/* RIGHT: DYNAMIC SAVINGS & ROI CARDS (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Main Hero Card: Gross Annual Legal Savings */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wider text-blue-300 uppercase">
                      Estimated Annual Legal Savings
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Direct Counsel Savings
                    </span>
                  </div>
                  <h4 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-1">
                    {formatCurrency(grossAnnualSavings)}
                    <span className="text-base sm:text-lg font-sans font-medium text-slate-300 ml-1">
                      / year
                    </span>
                  </h4>
                </div>

                <div className="text-right sm:self-start bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <span className="text-[11px] font-mono text-blue-200 block uppercase">
                    Hours Saved
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    {Math.round(annualHoursSaved).toLocaleString()} hrs
                  </span>
                </div>
              </div>

              {/* Sub-metrics bar inside Hero card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 z-10 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-blue-300 text-[11px]">Monthly Savings</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatCurrency(monthlyGrossSavings)}/mo
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-blue-300 text-[11px]">Net Annual Savings</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(netAnnualSavings)}/yr
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                  <span className="text-blue-300 text-[11px]">Est. Payback Period</span>
                  <span className="font-mono font-bold text-blue-200 text-sm">
                    {paybackMonths < 1 ? "< 1 month" : `~${paybackMonths.toFixed(1)} months`}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Secondary Strategic Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card A: Net Annual ROI % */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Net ROI
                  </span>
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {netRoiPercentage > 0 ? `${Math.round(netRoiPercentage)}%` : "0%"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {(grossAnnualSavings / ASSUMED_ANNUAL_PLATFORM_COST).toFixed(1)}x gross return
                  </span>
                </div>
              </div>

              {/* Card B: Legal FTE Capacity Freed */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    FTE Capacity
                  </span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {(annualHoursSaved / 1920).toFixed(1)} FTEs
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Redirected to strategic counsel
                  </span>
                </div>
              </div>

              {/* Card C: Assumed Platform Cost */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Canon License
                  </span>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    $36k
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    $3,000/mo illustrative tier
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ASSUMPTIONS, METHODOLOGY & DISCLAIMERS */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAssumptions((prev) => !prev)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showAssumptions ? "Hide" : "Show"} Transparent Calculation Methodology &amp; Assumptions</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              Formula: (Vol × 12 × 1.8 hrs × Rate) − License
            </span>
          </div>

          {showAssumptions && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                    Documented Mathematical Formulas:
                  </span>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-700">
                    <li>
                      <strong>Annual Campaign Volume</strong> = Monthly Volume ({monthlyVolume}) × 12 ={" "}
                      {annualCampaignVolume} campaigns/yr
                    </li>
                    <li>
                      <strong>Review Hours Saved</strong> = {annualCampaignVolume} × 1.8 hrs saved ={" "}
                      {annualHoursSaved.toFixed(0)} hours/yr
                    </li>
                    <li>
                      <strong>Gross Legal Savings</strong> = {annualHoursSaved.toFixed(0)} hrs × $
                      {hourlyLegalRate}/hr = {formatCurrency(grossAnnualSavings)}/yr
                    </li>
                    <li>
                      <strong>Net Annual Savings</strong> = {formatCurrency(grossAnnualSavings)} − $36,000 ={" "}
                      {formatCurrency(netAnnualSavings)}/yr
                    </li>
                    <li>
                      <strong>Net Annual ROI</strong> = ({formatCurrency(netAnnualSavings)} / $36,000) × 100 ={" "}
                      {Math.round(netRoiPercentage)}%
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                    Real Telemetry vs. Illustrative Demo Assumptions:
                  </span>
                  <div className="flex flex-col gap-1.5 text-slate-600 text-[11px] leading-relaxed">
                    <p>
                      &bull; <strong className="text-slate-800">Verified Project Telemetry:</strong> Historical backtests show a 91.7% simulated pass rate and elimination of 8 false-positive flags (TERM-007) across real marketing drafts.
                    </p>
                    <p>
                      &bull; <strong className="text-slate-800">Illustrative Assumptions:</strong> 78.4% first-time pass rate, 1.2 hr turnaround (vs. 48 hr manual baseline), and $185,000 fine prevention figures reflect enterprise benchmark fixtures provided in project requirements.
                    </p>
                    <p>
                      &bull; <strong className="text-slate-800">Net ROI &amp; Platform Cost:</strong> Product pricing is illustrative ($36,000/yr base platform tier under DEC-02). Actual net ROI varies based on negotiated enterprise volume agreements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
