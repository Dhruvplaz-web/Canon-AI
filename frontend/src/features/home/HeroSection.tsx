"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface HeroSectionProps {
  pendingReviewCount?: number | null;
  ruleCount?: number | null;
  apiLatencyMs?: number | null;
}

export function HeroSection({
  pendingReviewCount,
  ruleCount,
  apiLatencyMs,
}: HeroSectionProps) {
  return (
    <section className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 transition-colors">
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evidence-Based Brand Governance Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]">
          Pre-Publication Brand Compliance, Refereed by Provable Evidence
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
          Eliminate compliance review bottlenecks and regulatory exposure. Canon verifies marketing copy against active brand policies with immutable dual grounding, captures human adjudications, and safely backtests rule exceptions.
        </p>
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Link href="/demo">
            <Button variant="primary" className="py-2.5 px-5 text-sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Explore Guided Demo</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/submissions">
            <Button variant="outline" className="py-2.5 px-5 text-sm">
              Author &amp; Check Copy
            </Button>
          </Link>
          <Link href="/policy">
            <Button variant="ghost" className="py-2.5 px-4 text-sm text-[var(--color-text-secondary)]">
              Brand Policy
            </Button>
          </Link>
        </div>
      </div>

      {/* Enterprise Governance Value Card */}
      <div className="p-5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] shadow-xs flex flex-col justify-between gap-4 min-w-[280px] shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] font-mono">
          <span className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
            ENTERPRISE PLATFORM
          </span>
          <Badge variant="success" size="sm">
            ACTIVE
          </Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Dual-Grounding Engine</span>
          </span>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Every violation cites the exact draft span and the statutory policy excerpt.
          </p>
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border-subtle)]">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {apiLatencyMs !== null && apiLatencyMs !== undefined ? `${apiLatencyMs}ms ping` : "<15ms latency"}
          </span>
        </div>
        {pendingReviewCount !== undefined && pendingReviewCount !== null && (
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] pt-1">
            <span>Pending Reviews</span>
            <span className="font-semibold text-[var(--color-primary)]">
              {pendingReviewCount} items
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
