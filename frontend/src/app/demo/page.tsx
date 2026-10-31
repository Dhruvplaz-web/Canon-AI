"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DemoStepper, TOUR_STEPS } from "@/features/demo/DemoStepper";
import {
  Stage1Policy,
  Stage2Authoring,
  Stage3Review,
  Stage4Governance,
} from "@/features/demo/DemoStages";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles, Play, Pause, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const PITCH_COMMENTARY = [
  {
    stage: 1,
    title: "Ground Truth Policy & Statutory Claims",
    takeaway: "Traditional brand guidelines rot in 90-page PDFs. Canon compiles them into active AST rules with cryptographic hash signatures and time-bounded claims to prevent FTC/ASCI fines.",
    pillar: "Pillar 1: Deterministic Truth",
  },
  {
    stage: 2,
    title: "Pre-Flight Intercept & Double Receipts",
    takeaway: "Marketing drafts are checked in sub-5ms. Every violation generates a Double Receipt: Receipt A (exact draft substring) + Receipt B (exact policy quotation). Zero AI hallucinations.",
    pillar: "Pillar 2: Double-Receipt Proof",
  },
  {
    stage: 3,
    title: "Dual-Grounding Triage & Reason Codes",
    takeaway: "Eliminates rubber-stamp approvals. Overrides require audited reason codes (e.g. APPROVED_CAMPAIGN_EXCEPTION) signed into a tamper-evident SHA-256 audit ledger.",
    pillar: "Pillar 3: Human Oversight",
  },
  {
    stage: 4,
    title: "Closed-Loop Governance & Empirical Backtest",
    takeaway: "Overrides feed rule health telemetry. The engine synthesizes Policy v1.1, replays 24 historical drafts, and proves a 37.5% false positive reduction with 0 regressions before human adoption.",
    pillar: "Pillar 4: Self-Healing Evolution",
  },
];

function DemoTourContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const currentStep = Math.min(Math.max(stepParam, 1), 4);

  // Judge Auto-Pilot state
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState<number>(0);

  const handleStepChange = useCallback(
    (nextStep: number) => {
      const step = Math.min(Math.max(nextStep, 1), 4);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("step", String(step));
      router.replace(`?${sp.toString()}`, { scroll: false });
      setAutoPilotProgress(0);
    },
    [router, searchParams]
  );

  const handleToggleAutoPilot = () => {
    setIsAutoPilot((prev) => {
      const next = !prev;
      if (!next) {
        setAutoPilotProgress(0);
      }
      return next;
    });
  };

  // Auto-Pilot timer effect
  useEffect(() => {
    if (!isAutoPilot) {
      return;
    }

    const intervalMs = 100;
    const totalStepDurationMs = 12000; // 12 seconds per stage
    const stepIncrement = (intervalMs / totalStepDurationMs) * 100;

    const timer = setInterval(() => {
      setAutoPilotProgress((prev) => {
        if (prev >= 100) {
          handleStepChange((currentStep % 4) + 1);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPilot, currentStep, handleStepChange]);

  const activeCommentary = PITCH_COMMENTARY[currentStep - 1];

  return (
    <div className="space-y-8">
      {/* Tour Header with Judge Auto-Pilot */}
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

        {/* Auto-Pilot Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={isAutoPilot ? "destructive" : "primary"}
            size="sm"
            onClick={handleToggleAutoPilot}
            className="gap-2 cursor-pointer shadow-xs"
          >
            {isAutoPilot ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Auto-Pilot</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start 3-Min Judge Auto-Pilot</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleStepChange(1)}
            title="Reset tour to Stage 1"
            className="cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Auto-Pilot Progress Bar */}
      {isAutoPilot && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Judge Auto-Pilot Active &bull; Stage {currentStep} of 4</span>
            </div>
            <span className="font-mono text-[11px]">
              Advancing in {Math.max(1, Math.ceil((100 - autoPilotProgress) * 0.12))}s
            </span>
          </div>
          <div className="w-full bg-blue-200/50 dark:bg-blue-900/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${autoPilotProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Judge Pitch Cue Card */}
      <div className="p-4.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              {activeCommentary.pillar}
            </Badge>
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {activeCommentary.title}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {activeCommentary.takeaway}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-[var(--color-text-muted)] shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Wired to /api/v1</span>
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
