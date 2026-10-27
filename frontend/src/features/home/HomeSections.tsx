"use client";

import React from "react";
import Link from "next/link";
import { FileCheck2, ShieldCheck, BookOpen, GitBranch, ArrowRight, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function WorkflowBentoGrid() {
  const cards = [
    {
      href: "/submissions",
      role: "Creator Workflow",
      title: "Author & Check Copy",
      description: "Submit marketing copy for immediate pre-flight analysis: exact terminology matching, substantiated claims, and tone compliance.",
      cta: "Stage Draft Copy",
      icon: FileCheck2,
      accentClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      borderHover: "hover:border-blue-400 dark:hover:border-blue-600",
    },
    {
      href: "/review",
      role: "Reviewer Workflow",
      title: "Verified Findings Queue",
      description: "Every finding is dual-grounded: linked directly to the draft character span and the statutory policy rule quote. Zero hallucinated claims.",
      cta: "Triage Violations",
      icon: ShieldCheck,
      accentClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      borderHover: "hover:border-amber-400 dark:hover:border-amber-600",
    },
    {
      href: "/policy",
      role: "Policy Authority",
      title: "Brand Policy Explorer",
      description: "Inspect active compiled rules, verified statutory sources, and the temporal approved claims ledger with active validity windows.",
      cta: "Explore Active Policy",
      icon: BookOpen,
      accentClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      borderHover: "hover:border-purple-400 dark:hover:border-purple-600",
    },
    {
      href: "/governance",
      role: "Governance Lead",
      title: "Rule Health & Backtest",
      description: "Analyze override telemetry, identify high-friction rules, simulate historical backtests on proposed revisions, and adopt policy v1.1.",
      cta: "Analyze Telemetry",
      icon: GitBranch,
      accentClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      borderHover: "hover:border-emerald-400 dark:hover:border-emerald-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.href}
            href={c.href}
            className={`bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6 flex flex-col justify-between gap-6 group ${c.borderHover} hover:shadow-md transition-all`}
          >
            <div className="flex flex-col gap-4">
              <div
                className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${c.accentClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                  {c.role}
                </span>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                  {c.title}
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {c.description}
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-primary)]">
              <span>{c.cta}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function TelemetrySpotlight() {
  return (
    <section className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 border-l-4 border-l-amber-500 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-[var(--color-surface)] border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning" size="sm">
              TELEMETRY ALERT
            </Badge>
            <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
              Rule TERM-007 High Reviewer Override Drag (37.5%)
            </h3>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            37.5% of evaluations for rule TERM-007 (&ldquo;guaranteed return&rdquo;) are currently overridden by human reviewers with rationale disclosure. Candidate proposal &ldquo;Mortgage Qualification Exception&rdquo; is ready for historical backtesting.
          </p>
        </div>
      </div>
      <Link href="/governance" className="shrink-0">
        <Button variant="outline" size="sm">
          <span>Examine Proposal</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </Link>
    </section>
  );
}

export function BenchmarkBanner() {
  return (
    <section className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            AI Evaluation &amp; Model Benchmark Suite
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Verify 30 adversarial &amp; regression test cases, latency metrics, and 100% prompt injection defense.
          </p>
        </div>
      </div>
      <Link href="/evaluation" className="shrink-0">
        <Button variant="primary" size="sm">
          <span>Run AI Benchmark Suite</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </Link>
    </section>
  );
}
