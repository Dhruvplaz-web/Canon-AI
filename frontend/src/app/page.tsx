"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  GitBranch,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface HealthState {
  status: "checking" | "connected" | "degraded" | "error";
  details?: Record<string, unknown>;
  latencyMs?: number;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthState>({ status: "checking" });

  const checkApiHealth = async () => {
    setHealth({ status: "checking" });
    const start = performance.now();
    try {
      // Test the single-origin edge rewrite proxy to backend
      const res = await fetch("/api/v1/health/live");
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setHealth({ status: "connected", details: data, latencyMs: elapsed });
      } else {
        setHealth({ status: "degraded", latencyMs: elapsed });
      }
    } catch {
      setHealth({ status: "error" });
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#27272A] pb-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Double-Receipt Brand Governance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Pre-Publication Brand Compliance, Refereed by Provable Evidence
          </h1>
          <p className="text-sm md:text-base text-[#A1A1AA] leading-relaxed">
            Eliminate compliance review bottlenecks and regulatory exposure. Canon verifies marketing copy against active guidelines with immutable double receipts, records human override signals, and safely backtests rule exceptions.
          </p>
        </div>

        {/* Live Proxy Connectivity Card */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 flex flex-col gap-2 min-w-[240px]">
          <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Edge Proxy Status</span>
            <button
              onClick={checkApiHealth}
              className="text-[#A1A1AA] hover:text-white transition p-1 rounded"
              title="Refresh connection test"
              aria-label="Refresh API connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${health.status === "checking" ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {health.status === "connected" && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Connected</span>
                {health.latencyMs !== undefined && (
                  <span className="text-xs font-mono text-[#71717A] ml-auto">{health.latencyMs}ms</span>
                )}
              </>
            )}
            {health.status === "checking" && (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-sm font-medium text-[#A1A1AA]">Probing /api/v1...</span>
              </>
            )}
            {(health.status === "degraded" || health.status === "error") && (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Offline / Mock Mode</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono text-[#71717A]">
            Proxy: Next.js Edge $\to$ /api/v1
          </span>
        </div>
      </section>

      {/* 4-Pillar Workflow Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Submissions */}
        <div className="bg-[#18181B] border border-[#27272A] hover:border-[#3B82F6]/50 rounded-lg p-6 flex flex-col justify-between gap-6 transition group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
              Copy Submission & Pre-Flight
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Submit marketing drafts for immediate multi-stage analysis: injection sanitization, exact terminology matching, and substantiated claim verification.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A] text-xs font-medium text-blue-400">
            <span>Stage Draft Copy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Double-Receipt Verification */}
        <div className="bg-[#18181B] border border-[#27272A] hover:border-emerald-500/50 rounded-lg p-6 flex flex-col justify-between gap-6 transition group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">
              Double-Receipt Findings
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Every violation carries two receipts: the verbatim text span in the draft, and the verbatim guideline rule quote in the source policy. Zero hallucinated claims.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A] text-xs font-medium text-emerald-400">
            <span>Review Findings</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 3: Rule Health Diagnosis */}
        <div className="bg-[#18181B] border border-[#27272A] hover:border-amber-500/50 rounded-lg p-6 flex flex-col justify-between gap-6 transition group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-amber-400 transition">
              Rule Health Analytics
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Identifies over-restrictive or flapping rules from recurring reviewer override codes. Pinpoints rules causing operational drag (e.g. 38% override rate on TERM-007).
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A] text-xs font-medium text-amber-400">
            <span>Analyze Rule Health</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 4: Backtest & Policy v1.1 Approval */}
        <div className="bg-[#18181B] border border-[#27272A] hover:border-purple-500/50 rounded-lg p-6 flex flex-col justify-between gap-6 transition group">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-purple-400 transition">
              Backtest & v1.1 Approval
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Simulate candidate rule modification PROP-01 across historical drafts. Verify zero regressions, then adopt Policy v1.1 upon explicit human approval.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A] text-xs font-medium text-purple-400">
            <span>Run Backtest</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </section>

      {/* Demo Quick-Launch Banner */}
      <section className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Milestone 1 Demo Evaluation Walkthrough (4 Minutes)</h3>
            <p className="text-xs text-[#A1A1AA]">
              Pre-seeded Acme Financial guidelines (12 rules), active claims ledger with expired claim, and seeded proposal PROP-01 ready for deterministic evaluation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/demo"
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2"
          >
            <span>Launch Evaluation Flow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
