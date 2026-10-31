"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HeroSection } from "@/features/home/HeroSection";
import { InteractiveHeroScanner } from "@/features/home/InteractiveHeroScanner";
import { StatutoryRoiCalculator } from "@/features/home/StatutoryRoiCalculator";
import { EnterpriseComparisonTable } from "@/features/home/EnterpriseComparisonTable";
import { ComplianceFaqSection } from "@/features/home/ComplianceFaqSection";
import { RoleGreetingBanner, GuestBanner } from "@/features/home/RoleGreetingBanner";
import {
  WorkflowBentoGrid,
  TelemetrySpotlight,
  BenchmarkBanner,
} from "@/features/home/HomeSections";

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const start = performance.now();

    // Fetch live system health
    fetch("/api/v1/health/live", { cache: "no-store" })
      .then((res) => {
        if (!active) return;
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
      })
      .catch(() => {});

    // Fetch live pending review queue count
    fetch("/api/v1/review/queue", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setPendingReviews(data.length);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
      {/* 1. Hero with live latency and real pending counts */}
      <HeroSection
        pendingReviewCount={pendingReviews}
        apiLatencyMs={latencyMs}
      />

      {/* 2. Interactive Live Pre-Flight Scanner Sandbox (Judge-First Instant Demo) */}
      <InteractiveHeroScanner />

      {/* 3. Role-Adaptive Context or Guest Mode Prompt */}
      {!authLoading && user && <RoleGreetingBanner user={user} />}
      {!authLoading && !user && <GuestBanner />}

      {/* 4. 4-Pillar Workflow Bento Grid */}
      <WorkflowBentoGrid />

      {/* 5. Statutory Risk & Media Spend ROI Calculator */}
      <StatutoryRoiCalculator />

      {/* 6. Enterprise Competitive Architecture & Head-to-Head Comparison */}
      <EnterpriseComparisonTable />

      {/* 7. Rule Drag Telemetry Spotlight */}
      <TelemetrySpotlight />

      {/* 8. Statutory Architecture & Evidence Admissibility FAQ */}
      <ComplianceFaqSection />

      {/* 9. Evaluation & Benchmark Banner */}
      <BenchmarkBanner />
    </div>
  );
}
