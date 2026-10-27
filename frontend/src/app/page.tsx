"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HeroSection } from "@/features/home/HeroSection";
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Hero with live latency and real pending counts */}
      <HeroSection
        pendingReviewCount={pendingReviews}
        apiLatencyMs={latencyMs}
      />

      {/* Role-Adaptive Context or Guest Mode Prompt */}
      {!authLoading && user && <RoleGreetingBanner user={user} />}
      {!authLoading && !user && <GuestBanner />}

      {/* 4-Pillar Workflow Bento Grid */}
      <WorkflowBentoGrid />

      {/* Rule Drag Telemetry Spotlight */}
      <TelemetrySpotlight />

      {/* Evaluation & Benchmark Banner */}
      <BenchmarkBanner />
    </div>
  );
}
