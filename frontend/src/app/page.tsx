"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  BookOpen,
  LogIn,
  UserCheck,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HealthState {
  status: "checking" | "connected" | "degraded" | "error";
  details?: Record<string, unknown>;
  latencyMs?: number;
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [health, setHealth] = useState<HealthState>({ status: "checking" });
  const [healthTrigger, setHealthTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    const start = performance.now();

    fetch("/api/v1/health/live")
      .then(async (res) => {
        if (!active) return;
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          const data = await res.json();
          setHealth({ status: "connected", details: data, latencyMs: elapsed });
        } else {
          setHealth({ status: "degraded", latencyMs: elapsed });
        }
      })
      .catch(() => {
        if (active) setHealth({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, [healthTrigger]);

  const checkApiHealth = () => {
    setHealth({ status: "checking" });
    setHealthTrigger((t) => t + 1);
  };

  const getRolePresentation = (role: string) => {
    switch (role) {
      case "brand_manager":
        return {
          title: "Brand Governance & Policy Lead",
          badge: "Brand Manager",
          badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          actionText: "Manage Rule Health & Backtest",
          actionHref: "/governance",
          guidance:
            "Rule TERM-007 has a 37.5% override rate. Review candidate proposal PROP-01 and run historical backtesting.",
          secondaryHref: "/policy",
          secondaryText: "Inspect Active Policy",
        };
      case "reviewer":
        return {
          title: "Editorial & Compliance Triage",
          badge: "Reviewer",
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          actionText: "Open Review Queue",
          actionHref: "/review",
          guidance:
            "Double-receipt evidence is pre-compiled for all draft submissions. Confirm or override flagged findings.",
          secondaryHref: "/policy",
          secondaryText: "Browse Rules & Claims",
        };
      case "creator":
        return {
          title: "Marketing Copy & Creative Authoring",
          badge: "Creator",
          badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          actionText: "Stage New Submission",
          actionHref: "/submissions",
          guidance:
            "Pre-flight your draft copy to verify exact terminology and substantiated claims prior to reviewer handoff.",
          secondaryHref: "/policy",
          secondaryText: "Check Brand Guidelines",
        };
      default:
        return {
          title: "Workspace Member",
          badge: role,
          badgeClass: "bg-white text-black border-2 border-black",
          actionText: "Explore Workspace",
          actionHref: "/submissions",
          guidance: "Explore brand guidelines and review compliance workflows.",
          secondaryHref: "/policy",
          secondaryText: "Active Policy",
        };
    }
  };

  const roleInfo = user ? getRolePresentation(user.role) : null;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
      {/* Top Banner / Hero Header */}
      <section className="neo-box-prominent bg-white p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="neo-badge bg-[#FFD700] text-black w-fit">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Deterministic Double-Receipt Brand Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-black leading-tight">
            Pre-Publication Brand Compliance, Refereed by Provable Evidence
          </h1>
          <p className="text-sm md:text-base text-black/80 font-medium leading-relaxed">
            Eliminate compliance review bottlenecks and regulatory exposure. Canon verifies marketing copy against active guidelines with immutable double receipts, records human override signals, and safely backtests rule exceptions.
          </p>
          <div className="flex items-center gap-4 pt-2 flex-wrap">
            <Link
              href="/demo"
              className="neo-btn neo-btn-teal py-3 px-5 text-sm"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Take Interactive Tour (/demo)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <Link
              href="/policy"
              className="neo-btn neo-btn-white py-3 px-5 text-sm"
            >
              Explore Brand Policy
            </Link>
          </div>
        </div>

        {/* Live Proxy Connectivity Card */}
        <div className="p-5 rounded-xl bg-[#F4F0EA] border-[2px] border-black shadow-[2px_2px_0px_#000] flex flex-col gap-2 min-w-[240px] shrink-0">
          <div className="flex items-center justify-between text-xs font-black text-black font-mono">
            <span>EDGE PROXY STATUS</span>
            <button
              onClick={checkApiHealth}
              className="neo-btn neo-btn-white p-1 text-black"
              title="Refresh connection test"
              aria-label="Refresh API connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${health.status === "checking" ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {health.status === "connected" && (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span className="text-base font-black text-black">Connected</span>
                {health.latencyMs !== undefined && (
                  <span className="text-xs font-mono font-bold text-black ml-auto bg-white border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                    {health.latencyMs}ms
                  </span>
                )}
              </>
            )}
            {health.status === "checking" && (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span className="text-sm font-bold text-black">Probing /api/v1...</span>
              </>
            )}
            {(health.status === "degraded" || health.status === "error") && (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                <span className="text-sm font-black text-amber-700">Offline / Mock Mode</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono font-bold text-black/70 pt-2 border-t border-black/20">
            Proxy: Next.js Edge &rarr; /api/v1
          </span>
        </div>
      </section>

      {/* Role-Adaptive Greeting & Contextual Alert */}
      {!authLoading && user && roleInfo && (
        <section className="neo-box p-6 bg-[#00C2CB] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_#000]">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-black">
                  Welcome back, {user.full_name}
                </h2>
                <span className="neo-badge bg-black text-white">
                  {roleInfo.badge}
                </span>
              </div>
              <p className="text-xs text-black font-semibold leading-relaxed max-w-2xl">
                {roleInfo.guidance}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href={roleInfo.secondaryHref}
              className="neo-btn neo-btn-white flex-1 md:flex-initial text-center"
            >
              {roleInfo.secondaryText}
            </Link>
            <Link
              href={roleInfo.actionHref}
              className="neo-btn neo-btn-black flex-1 md:flex-initial text-center"
            >
              <span>{roleInfo.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Guest Mode Sign-in Banner (when unauthenticated) */}
      {!authLoading && !user && (
        <section className="neo-box p-6 bg-[#FFD700] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_#000]">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black text-black">
                Workspace Authentication Recommended
              </h2>
              <p className="text-xs text-black font-semibold max-w-xl">
                You are currently browsing in guest mode. Sign in to access workspace submissions, triage review queues, or inspect and modify brand governance policies.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="neo-btn neo-btn-black shrink-0"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}

      {/* 4-Pillar Interactive Workflow Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Copy Submission & Pre-Flight */}
        <Link
          href="/submissions"
          className="neo-box p-6 flex flex-col justify-between gap-6 group hover:bg-[#F4F0EA]"
        >
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00C2CB] border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="neo-badge bg-[#00C2CB] text-black w-fit">
                Creator Workflow
              </span>
              <h2 className="text-xl font-black text-black group-hover:underline">
                Copy Submission & Pre-Flight
              </h2>
            </div>
            <p className="text-xs text-black font-semibold leading-relaxed">
              Submit marketing drafts for immediate multi-stage analysis: injection sanitization, exact terminology matching, and substantiated claim verification.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-black text-xs font-black text-black">
            <span>Stage Draft Copy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Double-Receipt Verification */}
        <Link
          href="/review"
          className="neo-box p-6 flex flex-col justify-between gap-6 group hover:bg-[#F4F0EA]"
        >
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700] border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="neo-badge bg-[#FFD700] text-black w-fit">
                Reviewer Workflow
              </span>
              <h2 className="text-xl font-black text-black group-hover:underline">
                Double-Receipt Findings
              </h2>
            </div>
            <p className="text-xs text-black font-semibold leading-relaxed">
              Every violation carries two receipts: the verbatim text span in the draft, and the verbatim guideline rule quote in the source policy. Zero hallucinated claims.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-black text-xs font-black text-black">
            <span>Triage Violations</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 3: Live Brand Policy Explorer (PROP-U12) */}
        <Link
          href="/policy"
          className="neo-box p-6 flex flex-col justify-between gap-6 group hover:bg-[#F4F0EA]"
        >
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF00FF] border-2 border-black text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="neo-badge bg-[#FF00FF] text-white w-fit">
                Guideline Registry
              </span>
              <h2 className="text-xl font-black text-black group-hover:underline">
                Live Brand Policy Explorer
              </h2>
            </div>
            <p className="text-xs text-black font-semibold leading-relaxed">
              Inspect active compiled rules, verified source citations, and the temporal approved claims ledger with active validity windows.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-black text-xs font-black text-black">
            <span>Explore Active Policy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 4: Rule Health & Backtesting */}
        <Link
          href="/governance"
          className="neo-box p-6 flex flex-col justify-between gap-6 group hover:bg-[#F4F0EA]"
        >
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border-2 border-black text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <GitBranch className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="neo-badge bg-black text-white w-fit">
                Brand Manager Workflow
              </span>
              <h2 className="text-xl font-black text-black group-hover:underline">
                Rule Health & Backtest
              </h2>
            </div>
            <p className="text-xs text-black font-semibold leading-relaxed">
              Analyze override telemetry, identify flapping rules (e.g. 37.5% override rate), backtest proposals, and approve Policy v1.1.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t-2 border-black text-xs font-black text-black">
            <span>Analyze Telemetry</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </section>

      {/* Flapping Rule Insight Spotlight */}
      <section className="neo-box p-6 bg-[#FFD700] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_#000]">
            <Flame className="w-6 h-6 text-black" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="neo-badge bg-black text-white">
                TELEMETRY ALERT
              </span>
              <h3 className="text-base font-black text-black">Rule TERM-007 High Human Override Drag</h3>
            </div>
            <p className="text-xs text-black font-semibold leading-relaxed max-w-2xl">
              37.5% of evaluations for rule TERM-007 (&ldquo;guaranteed return&rdquo;) are currently overridden by human reviewers with code <code className="text-black font-mono font-bold bg-white border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">RATIONALE_DISCLOSURE</code>. Candidate proposal PROP-01 is ready for historical backtesting.
            </p>
          </div>
        </div>
        <Link
          href="/governance"
          className="neo-btn neo-btn-black shrink-0"
        >
          <span>Examine Proposal PROP-01</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Evaluation Walkthrough Banner */}
      <section className="neo-box p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00C2CB] border-2 border-black flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_#000]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-black">Deterministic Evaluation Walkthrough</h3>
            <p className="text-xs text-black font-semibold">
              Pre-seeded Acme Financial guidelines (12 rules), active claims ledger with expired claim, and seeded proposal PROP-01 ready for deterministic verification.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/submissions"
            className="neo-btn neo-btn-teal"
          >
            <span>Start with Submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
