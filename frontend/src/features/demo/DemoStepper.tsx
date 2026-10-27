"use client";

import React from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface TourStep {
  num: number;
  id: string;
  title: string;
  stageName: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    num: 1,
    id: "policy",
    title: "Policy Baseline & Substantiated Claims",
    stageName: "Stage 1: Policy",
    description: "Inspect compiled brand rules and active statutory claims ledger.",
  },
  {
    num: 2,
    id: "authoring",
    title: "Pre-Flight Verification on High-Risk Draft",
    stageName: "Stage 2: Authoring",
    description: "Run live compliance check catching prohibited terms and stale claims.",
  },
  {
    num: 3,
    id: "review",
    title: "Dual Grounding Triage & Human Override",
    stageName: "Stage 3: Review",
    description: "Inspect draft citation span vs statutory excerpt and sign off with reason codes.",
  },
  {
    num: 4,
    id: "governance",
    title: "Rule Evolution & Policy v1.1 Adoption",
    stageName: "Stage 4: Evolution",
    description: "Analyze override friction telemetry, run empirical backtesting, and adopt v1.1.",
  },
];

interface DemoStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function DemoStepper({ currentStep, onStepChange }: DemoStepperProps) {
  return (
    <div className="space-y-4">
      {/* Top Stepper Track */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TOUR_STEPS.map((step) => {
          const isComplete = currentStep > step.num;
          const isActive = currentStep === step.num;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.num)}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-xs"
                  : isComplete
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {isComplete ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.num}
                </span>

                <Badge
                  variant={isComplete ? "success" : isActive ? "default" : "outline"}
                  size="sm"
                >
                  {step.stageName}
                </Badge>
              </div>

              <div>
                <span className="font-bold text-xs text-[var(--color-text-primary)] block line-clamp-1">
                  {step.title}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                  {step.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
