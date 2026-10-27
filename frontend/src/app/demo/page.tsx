"use client";

import React, { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DemoStepper, TOUR_STEPS } from "@/features/demo/DemoStepper";
import {
  Stage1Policy,
  Stage2Authoring,
  Stage3Review,
  Stage4Governance,
} from "@/features/demo/DemoStages";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

function DemoTourContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const currentStep = Math.min(Math.max(stepParam, 1), 4);

  const handleStepChange = useCallback(
    (nextStep: number) => {
      const step = Math.min(Math.max(nextStep, 1), 4);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("step", String(step));
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-8">
      {/* Tour Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Interactive Governance Pipeline Walkthrough
            </h1>
            <Badge variant="secondary" size="sm">
              Live Architecture
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Experience Canon&rsquo;s 4-stage deterministic compliance lifecycle, wired directly to live gateway endpoints.
          </p>
        </div>
      </div>

      {/* Stepper Navigation */}
      <DemoStepper currentStep={currentStep} onStepChange={handleStepChange} />

      {/* Active Stage View */}
      {currentStep === 1 && (
        <Stage1Policy onNext={() => handleStepChange(2)} />
      )}
      {currentStep === 2 && (
        <Stage2Authoring onNext={() => handleStepChange(3)} />
      )}
      {currentStep === 3 && (
        <Stage3Review onNext={() => handleStepChange(4)} />
      )}
      {currentStep === 4 && (
        <Stage4Governance />
      )}
    </div>
  );
}

export default function DemoPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        }
      >
        <DemoTourContent />
      </Suspense>
    </div>
  );
}
