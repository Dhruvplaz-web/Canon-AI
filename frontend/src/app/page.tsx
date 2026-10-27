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
  Award,
  Layers,
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
          badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
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
          badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
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
          badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
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
          badgeClass: "bg-gray-50 text-gray-700 border border-gray-200",
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10 text-[#111827]">
      {/* Top Banner / Hero Header */}
      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Double-Receipt Brand Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] leading-[1.15]">
            Pre-Publication Brand Compliance, Refereed by Provable Evidence
          </h1>
          <p className="text-sm md:text-base text-[#4B5563] leading-relaxed">
            Eliminate compliance review bottlenecks and regulatory exposure. Canon verifies marketing copy against active guidelines with immutable double receipts, records human override signals, and safely backtests rule exceptions.
          </p>
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link
              href="/demo"
              className="neo-btn neo-btn-teal py-2.5 px-5 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Evaluator Demo Tour (/demo)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/submissions"
              className="neo-btn neo-btn-white py-2.5 px-5 text-sm"
            >
              Author & Submit Copy
            </Link>
            <Link
              href="/policy"
              className="neo-btn neo-btn-white py-2.5 px-4 text-sm text-[#4B5563]"
            >
              Explore Brand Policy
            </Link>
          </div>
        </div>

        {/* Enterprise Governance Value Card */}
        <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] shadow-xs flex flex-col justify-between gap-3 min-w-[270px] shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280] font-mono">
            <span className="flex items-center gap-1.5 text-[#111827]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              ENTERPRISE GOVERNANCE
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              ACTIVE
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-base font-extrabold text-[#111827]">Zero-Hallucination Shield</span>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Verifiable Double Receipts backed by cryptographic release certificates.
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
            <span>Deterministic Pipeline</span>
            <span className="font-bold text-[#2563EB]">&lt;15ms latency</span>
          </div>
        </div>
      </section>

      {/* Role-Adaptive Greeting & Contextual Alert */}
      {!authLoading && user && roleInfo && (
        <section className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-white border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#111827]">
                  Welcome back, {user.full_name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${roleInfo.badgeClass}`}>
                  {roleInfo.badge}
                </span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed max-w-2xl">
                {roleInfo.guidance}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href={roleInfo.secondaryHref}
              className="neo-btn neo-btn-white flex-1 md:flex-initial text-center text-xs"
            >
              {roleInfo.secondaryText}
            </Link>
            <Link
              href={roleInfo.actionHref}
              className="neo-btn neo-btn-teal flex-1 md:flex-initial text-center text-xs"
            >
              <span>{roleInfo.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </section>
      )}

      {/* Guest Mode Sign-in Banner (when unauthenticated) */}
      {!authLoading && !user && (
        <section className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-white border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
              <LogIn className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-[#111827]">
                Workspace Authentication Recommended
              </h2>
              <p className="text-xs text-[#4B5563] max-w-xl">
                You are currently browsing in guest mode. Sign in to access workspace submissions, triage review queues, or inspect and modify brand governance policies.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="neo-btn neo-btn-teal shrink-0 text-xs"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </section>
      )}

      {/* 4-Pillar Interactive Workflow Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Copy Submission & Pre-Flight */}
        <Link
          href="/submissions"
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between gap-6 group hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div className="flex flex-col gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-semibold">
                Creator Workflow
              </span>
              <h2 className="text-lg font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                Copy Submission & Pre-Flight
              </h2>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Submit marketing drafts for immediate multi-stage analysis: injection sanitization, exact terminology matching, and substantiated claim verification.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-[#2563EB]">
            <span>Stage Draft Copy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Double-Receipt Verification */}
        <Link
          href="/review"
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between gap-6 group hover:border-amber-400 hover:shadow-md transition-all"
        >
          <div className="flex flex-col gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold">
                Reviewer Workflow
              </span>
              <h2 className="text-lg font-bold text-[#111827] group-hover:text-amber-800 transition-colors">
                Double-Receipt Findings
              </h2>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Every violation carries two receipts: the verbatim text span in the draft, and the verbatim guideline rule quote in the source policy. Zero hallucinated claims.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-amber-700">
            <span>Triage Violations</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 3: Live Brand Policy Explorer */}
        <Link
          href="/policy"
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between gap-6 group hover:border-purple-400 hover:shadow-md transition-all"
        >
          <div className="flex flex-col gap-4">
            <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-700 font-semibold">
                Guideline Registry
              </span>
              <h2 className="text-lg font-bold text-[#111827] group-hover:text-purple-800 transition-colors">
                Live Brand Policy Explorer
              </h2>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Inspect active compiled rules, verified source citations, and the temporal approved claims ledger with active validity windows.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-purple-700">
            <span>Explore Active Policy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 4: Rule Health & Backtesting */}
        <Link
          href="/governance"
          className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between gap-6 group hover:border-emerald-400 hover:shadow-md transition-all"
        >
          <div className="flex flex-col gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Brand Manager Workflow
              </span>
              <h2 className="text-lg font-bold text-[#111827] group-hover:text-emerald-800 transition-colors">
                Rule Health & Backtest
              </h2>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Analyze override telemetry, identify flapping rules (e.g. 37.5% override rate), backtest proposals, and approve Policy v1.1.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-emerald-700">
            <span>Analyze Telemetry</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </section>

      {/* Flapping Rule Insight Spotlight */}
      <section className="bg-amber-50/70 border border-amber-200 border-l-4 border-l-amber-500 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                TELEMETRY ALERT
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                Rule TERM-007 High Human Override Drag (37.5%)
              </h3>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed max-w-2xl">
              37.5% of evaluations for rule TERM-007 (&ldquo;guaranteed return&rdquo;) are currently overridden by human reviewers with code <code className="text-[#111827] font-mono font-semibold bg-white border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">RATIONALE_DISCLOSURE</code>. Candidate proposal PROP-01 is ready for historical backtesting.
            </p>
          </div>
        </div>
        <Link
          href="/governance"
          className="neo-btn neo-btn-white shrink-0 text-xs border-amber-300 hover:border-amber-400"
        >
          <span>Examine Proposal PROP-01</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </section>

      {/* Evaluation Walkthrough & AI Benchmark Banner */}
      <section className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827]">
              AI Evaluation & Model Benchmark Suite
            </h3>
            <p className="text-xs text-[#4B5563]">
              Verify 30 adversarial & regression test cases, latency metrics, and 100% OWASP prompt injection defense before submitting to production.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/evaluation"
            className="neo-btn neo-btn-teal text-xs"
          >
            <span>Run AI Benchmark Suite</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
