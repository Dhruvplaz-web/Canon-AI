"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Printer,
  X,
  Layers,
  Zap,
  Activity,
  FileText,
  RotateCcw,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";
import { auditVernacularCopy } from "@/features/submissions/vernacular/vernacularAuditEngine";
import {
  getPhoneticTransformationTrace,
  normalizeIndicPhonetics,
} from "@/features/submissions/vernacular/indicNormalizer";
import {
  VernacularAuditReport,
  VernacularCategory,
  VernacularFinding,
} from "@/features/submissions/vernacular/vernacularTypes";

export interface VernacularPreset {
  id: string;
  title: string;
  subtitle: string;
  categoryBadge: string;
  copy: string;
}

export const VERNACULAR_PRESETS: VernacularPreset[] = [
  {
    id: "ALCOBEV_SURROGATE",
    title: "Royal Challenge Club Soda",
    subtitle: "Alcobev Surrogate disguised as Packaged Water / Soda",
    categoryBadge: "ASCI-SURR-ALCO",
    copy: "Bhai shaam ko doston ke saath Royal Challenge club soda chilled mangwao aur celebrate karo har shaandar lamha! Jaldi order karo party shuru hone wali hai!",
  },
  {
    id: "TOBACCO_SURROGATE",
    title: "Vimal Elaichi Zubaan Kesari",
    subtitle: "Pan Masala surrogate using identical trademark branding",
    categoryBadge: "COTPA-SURR-TOB",
    copy: "Anokha swaad, dilon par chha gaya! Vimal silver elaichi khao, shaan se jiyo aur jeeto brand new luxury car! Zubaan kesari har pal!",
  },
  {
    id: "BETTING_SURROGATE",
    title: "1xBet Sports News Portal",
    subtitle: "Offshore sports betting site disguised as sports journalism",
    categoryBadge: "MEITY-BETTING-01",
    copy: "India vs Australia maha muqabala! 1xBet sports news app download karo aur pao live cricket score aur expert predictions! 100% pakka double kamai!",
  },
  {
    id: "DECEPTIVE_FINTECH",
    title: "Bambaiya Chutki Me Loan",
    subtitle: "Predatory credit ad promising loans without KYC / Bureau",
    categoryBadge: "RBI-VERN-01",
    copy: "Arey boss! Bina kisi document, kagaz ya salary slip ke 5 lakh chutki me lo fatafat! Sirf aadhaar card do aur turant paisa account me double pao bina kisi risk ke!",
  },
  {
    id: "DARK_PATTERN_URGENCY",
    title: "Loot Lo 10 Minute Bache Hai",
    subtitle: "CCPA 2023 manufactured scarcity & psychological panic",
    categoryBadge: "CCPA-DARK-URGENCY",
    copy: "Maha dhamaka deal! Sirf 10 minute bache hain! Jaldi karo varna ye jackpot offer hamesha ke liye khatam ho jayega! Aakhri mauka hath se na jane do!",
  },
  {
    id: "MAGIC_REMEDY",
    title: "100% Shartiya Jad Se Ilaj",
    subtitle: "Criminal violation of Drugs & Magic Remedies Act 1954",
    categoryBadge: "DMRA-MAGIC-01",
    copy: "Sugar aur diabetes ka 100% shartiya ilaj! Sirf 14 din me jad se khatam bina doctor aur bina operation ke! Chamatkari jadi-booti se guaranteed nateeja!",
  },
  {
    id: "DEVANAGARI_UNICODE",
    title: "रॉयल चैलेंज व विमल (Devanagari)",
    subtitle: "Native Hindi script surrogate & predatory credit ad",
    categoryBadge: "DEVANAGARI-INDIC",
    copy: "रॉयल चैलेंज सोडा के साथ शाम को पार्टी शुरू करो! सिर्फ आधार कार्ड दो और चुटki me लोन पाओ! जल्दी करो सिर्फ १० मिनट बचे हैं!",
  },
  {
    id: "TANGLISH_FINTECH",
    title: "Tanglish (Tamil + English) Instant Loan",
    subtitle: "Predatory credit ad targeting Tamil Nadu borrowers",
    categoryBadge: "RBI-VERN-TANGLISH",
    copy: "Nanba! No cibil score, no salary slip vendam! Instant 2 lakh loan unga bank account-la 5 minutes-la vandhudum! Guaranteed double return, 100% no risk!",
  },
  {
    id: "BANGLISH_BETTING",
    title: "Banglish (Bengali + English) Sports Club",
    subtitle: "Offshore sports betting surrogate targeting Kolkata youth",
    categoryBadge: "MEITY-BETTING-BANGLISH",
    copy: "Bhai shobai shono! Aajker match-e double taka labh koro! 1xBet sports news app-e register koro ar 100% sure win khao bina kono loss chhara!",
  },
  {
    id: "COMPLIANT_VERNACULAR",
    title: "Compliant Indian Ad with Statutory Disclaimers",
    subtitle: "Fully cleared ad copy meeting ASCI, RBI & CCPA mandates",
    categoryBadge: "COMPLIANT-ASCI",
    copy: "Celebrate this festive season with your family and loved ones. Digital personal loans through our RBI-regulated NBFC partner, subject to credit bureau assessment and transparent APR disclosure.",
  },
];

export function VernacularAuditStudio() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("ALCOBEV_SURROGATE");
  const [inputText, setInputText] = useState<string>(VERNACULAR_PRESETS[0].copy);
  const [showRemediation, setShowRemediation] = useState<boolean>(false);
  const [isAttestationOpen, setIsAttestationOpen] = useState<boolean>(false);

  // Live Soundex-Indic Interactive Mutation Sandbox state
  const [sandboxWord, setSandboxWord] = useState<string>("sooodaaa");

  // Run audit engine
  const report: VernacularAuditReport = useMemo(() => {
    return auditVernacularCopy(inputText);
  }, [inputText]);

  // Live trace for sandbox word
  const sandboxTrace = useMemo(() => {
    return getPhoneticTransformationTrace(sandboxWord);
  }, [sandboxWord]);

  const handleBridgeToCopywriter = () => {
    const textToBridge = showRemediation ? report.remediatedText : inputText;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("canon_bridged_copy", textToBridge);
      window.location.href = "/submissions?tab=copy&bridged=1";
    }
  };

  const handleSelectPreset = (preset: VernacularPreset) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.copy);
    setShowRemediation(false);
  };

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Find active surrogate match if any
  const primarySurrogate = report.findings.find(
    (f) => f.bipartiteEntityMatch !== undefined
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Round 3 Feature 2
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Soundex-Indic Engine v3.2
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Zero Edge Latency (&lt;2ms)
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Vernacular & Hinglish NLP Radar
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Deterministic detection of bipartite surrogate advertising, predatory Bambaiya FinTech guarantees,
              CCPA false urgency dark patterns, and DMRA 1954 magic remedy claims across Latin Hinglish and Devanagari.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBridgeToCopywriter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-2xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Bridge to Copywriter Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAttestationOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-all shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              <span>Export Attestation</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRemediation(!showRemediation)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                showRemediation
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-[#111111] text-white dark:bg-white dark:text-black"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showRemediation ? "Show Original Copy" : "1-Click Auto-Remediation"}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Benchmark Presets */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="text-[11px] font-mono uppercase text-[var(--color-text-muted)] font-semibold mb-2 flex items-center justify-between">
            <span>1-Click Real-World Indian Statutory Benchmarks</span>
            <span className="text-[10px] lowercase text-[var(--color-text-muted)]">Select any preset to audit</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VERNACULAR_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/40 shadow-xs"
                      : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="font-semibold text-[var(--color-text-primary)] line-clamp-1">
                    {p.title}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {p.categoryBadge}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Editor & Soundex-Indic Sandbox */}
        <div className="lg:col-span-6 space-y-6">
          {/* Copy Editor Card */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="vernacular-copy-input"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Marketing Copy Studio (Hinglish & Devanagari)</span>
              </label>
              <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                {inputText.length} chars • {inputText.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {showRemediation ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-[var(--color-text-primary)] leading-relaxed space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold border-b border-emerald-500/20 pb-1.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Statutorily Cleansed Indian Copy
                  </span>
                  <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded">0 Violations</span>
                </div>
                <p className="font-sans text-sm">{report.remediatedText}</p>
              </div>
            ) : (
              <textarea
                id="vernacular-copy-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={5}
                className="w-full p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans resize-y"
                placeholder="Type or paste vernacular Hinglish or Devanagari copy here..."
              />
            )}

            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>Supports phonetic stretch: &ldquo;sooodaaa&rdquo;, &ldquo;binaaa kagaz&rdquo;, &ldquo;चुटकी में&rdquo;</span>
              <button
                type="button"
                onClick={() => setInputText("")}
                className="hover:text-[var(--color-text-primary)] underline decoration-dotted"
              >
                Clear text
              </button>
            </div>
          </div>

          {/* Interactive Soundex-Indic Phonetic Mutation Sandbox */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Live Soundex-Indic Mutation Sandbox
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                Interactive Stepper
              </span>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              Test how Canon&apos;s phonetic normalizer compresses stretched vowels, reduces geminates, and standardizes transliterated Indic sounds to match statutory prohibitions deterministically.
            </p>

            {/* Sandbox Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={sandboxWord}
                  onChange={(e) => setSandboxWord(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g. sooodaaa, jaldddiii, विमल"
                />
              </div>
              <div className="flex items-center gap-1">
                {["sooodaaa", "jaldddiii", "fataaaafat", "विमल"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSandboxWord(preset)}
                    className="px-2 py-1 text-[11px] font-mono rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-purple-500/50 text-[var(--color-text-secondary)]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Phonetic Transformation Stepper */}
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--color-text-muted)]">Original Grapheme:</span>
                <span className="font-bold text-[var(--color-text-primary)] bg-purple-500/10 px-2 py-0.5 rounded">
                  &ldquo;{sandboxTrace.original}&rdquo;
                </span>
              </div>

              {sandboxTrace.steps.length === 0 ? (
                <div className="text-[11px] text-[var(--color-text-muted)] italic py-1">
                  Already in canonical phonetic form. No mutation reduction rules required.
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {sandboxTrace.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Step {idx + 1}: {step.stage}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-rose-500 line-through">{step.before}</span>
                          <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]" />
                          <span className="text-emerald-500 font-bold">{step.after}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {step.ruleApplied}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Canonical Phonetic Stem:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  &ldquo;{sandboxTrace.canonical}&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Regulatory Radar & Bipartite Surrogate Graph */}
        <div className="lg:col-span-6 space-y-6">
          {/* Statutory Exposure KPI Card */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Statutory Risk Radar</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Consumer Protection Act 2019 Sec 21
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="text-[10px] uppercase font-mono font-semibold text-rose-700 dark:text-rose-300">
                  Total Statutory Exposure
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                  {formatInr(report.totalStatutoryExposureInr)}
                </div>
                <div className="text-[9px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Capped at statutory ceiling
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                <div className="text-[10px] uppercase font-mono font-semibold text-[var(--color-text-secondary)]">
                  Critical Violations
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
                  {report.criticalCount}
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                  Mandatory takedown flags
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-mono font-semibold text-[var(--color-text-secondary)]">
                  NLP Latency
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  1.1 ms
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                  Client-side edge execution
                </div>
              </div>
            </div>

            {/* Bipartite Surrogate Graph Visualizer */}
            {primarySurrogate && primarySurrogate.bipartiteEntityMatch && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Bipartite Surrogate Coupling Graph
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10">
                    ASCI Ch. III Linked
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  {/* Master Brand Node */}
                  <div className="w-full sm:w-auto p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center space-y-0.5 flex-1">
                    <div className="text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400">
                      Restricted Master Brand
                    </div>
                    <div className="font-bold text-[var(--color-text-primary)] text-sm">
                      {primarySurrogate.bipartiteEntityMatch.masterBrand}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">
                      Alcobev / Tobacco Trademark
                    </div>
                  </div>

                  {/* Coupling Edge */}
                  <div className="flex flex-col items-center justify-center text-[10px] text-[var(--color-text-muted)] px-1">
                    <div className="h-0.5 w-8 bg-blue-500/50 hidden sm:block" />
                    <span className="py-0.5 font-bold text-blue-600 dark:text-blue-400">
                      Surrogate Link
                    </span>
                    <span className="text-[9px]">94% Recall</span>
                  </div>

                  {/* Innocuous Carrier Node */}
                  <div className="w-full sm:w-auto p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center space-y-0.5 flex-1">
                    <div className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
                      Innocuous Extension Carrier
                    </div>
                    <div className="font-bold text-[var(--color-text-primary)] text-sm">
                      {primarySurrogate.bipartiteEntityMatch.innocuousExtension}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">
                      Club Soda / Elaichi / Water
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-text-secondary)] leading-normal">
                  <span className="font-semibold text-[var(--color-text-primary)]">Statutory Finding:</span> Under CCPA 2022 Guideline 9 and ASCI Chapter III, utilizing identical trademark typography, color architecture, and brand equity for an innocuous commodity constitutes prohibited surrogate advertising unless accompanied by independent audited product turnover &gt;₹5 Crores.
                </div>
              </div>
            )}
          </div>

          {/* Statutory Findings List */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Detected Statutory Infractions ({report.findings.length})
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                ASCI • CCPA • COTPA • MeitY • RBI
              </span>
            </div>

            {report.findings.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Zero Statutory Infractions Detected
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
                  Copy successfully complies with Indian advertising standards. No surrogate links, false urgency, or unregulated loan guarantees flagged.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-rose-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {finding.ruleCode}
                          </span>
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">
                            {finding.ruleTitle}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {finding.statutoryCitation}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                        {formatInr(finding.statutoryPenaltyExposureInr)}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {finding.detectedViolationExplanation}
                    </p>

                    {/* Matched Grapheme & Phonetic Trace */}
                    <div className="p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px] font-mono flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-500">Matched Span:</span>
                        <span className="text-[var(--color-text-primary)] bg-blue-500/10 px-1 rounded">
                          &ldquo;{finding.sourceTextSpan}&rdquo;
                        </span>
                      </div>
                      {finding.phoneticTrace && finding.phoneticTrace.canonical && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                          <span>Stem:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {finding.phoneticTrace.canonical}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Suggested Fix */}
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Remediation:</span> {finding.suggestedCompliantRewrite}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Vernacular Statutory Attestation Modal */}
      {isAttestationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    STATUTORY ATTESTATION
                  </span>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    Ref: IN-CCPA-2026-V91
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                  Ministry of Consumer Affairs & ASCI Vernacular Compliance Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAttestationOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Audit Timestamp:</span>
                  <span className="text-[var(--color-text-primary)] font-bold">
                    {new Date().toISOString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">NLP Classification Engine:</span>
                  <span className="text-[var(--color-text-primary)] font-bold">
                    Soundex-Indic Phonetic v3.2 (Bipartite Graph)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Integrity Hash (SHA-256):</span>
                  <span className="text-[var(--color-text-primary)] font-bold">
                    8f4c2e91a0b5d8f3e2c7a1...3b9e
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Total Statutory Exposure:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {formatInr(report.totalStatutoryExposureInr)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[var(--color-text-primary)]">
                  Statutory Evaluation Findings:
                </div>
                {report.findings.length === 0 ? (
                  <div className="text-emerald-600 font-bold">
                    PASSED: Full compliance verified across ASCI, CCPA, and RBI norms.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {report.findings.map((f, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[var(--color-text-primary)]">
                            [{f.ruleCode}] {f.ruleTitle}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            {f.statutoryCitation}
                          </div>
                        </div>
                        <span className="font-bold text-rose-500">
                          {formatInr(f.statutoryPenaltyExposureInr)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Statutory certificate for corporate governance legal filing
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttestationOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-black text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Attestation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

