"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, FileCheck, Calendar, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatters";

export interface ApprovedClaim {
  id: string;
  claim_code: string;
  claim_text: string;
  substantiation: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface ApprovedClaimsTabProps {
  claims: ApprovedClaim[];
}

export function ApprovedClaimsTab({ claims }: ApprovedClaimsTabProps) {
  // Temporal Simulation State (Function 2.1)
  const [simulationOffsetDays, setSimulationOffsetDays] = useState<number>(0);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(0);

  // Compute effective simulation date
  const effectiveSimulatedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + simulationOffsetDays);
    return d;
  }, [simulationOffsetDays]);

  const simulatedDateIso = effectiveSimulatedDate.toISOString();

  // Evaluate claims against effective simulated date and grace period
  const evaluatedClaims = useMemo(() => {
    return claims.map((claim) => {
      const validUntil = new Date(claim.valid_until);
      const graceCutoff = new Date(validUntil);
      graceCutoff.setDate(graceCutoff.getDate() + gracePeriodDays);

      const isStrictlyExpired = claim.valid_until < simulatedDateIso;
      const isInGracePeriod = isStrictlyExpired && effectiveSimulatedDate <= graceCutoff;
      const isTerminal = isStrictlyExpired && !isInGracePeriod;

      return {
        ...claim,
        isStrictlyExpired,
        isInGracePeriod,
        isTerminal,
      };
    });
  }, [claims, simulatedDateIso, effectiveSimulatedDate, gracePeriodDays]);

  const expiredCount = evaluatedClaims.filter((c) => c.isTerminal).length;
  const graceCount = evaluatedClaims.filter((c) => c.isInGracePeriod).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-[var(--color-text-secondary)] space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Statutory Substantiated Claims Ledger</span>
          </h3>
          <span className="px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300">
            🇮🇳 CCPA 2022 &bull; ASCI 1.4 &bull; SEC/FTC Substantive Ledger
          </span>
        </div>
        <p>
          Approved marketing representations backed by regulatory evidence, formal certificates, and active time-bounded validity periods to prevent civil fines under Consumer Protection &amp; FTC acts.
        </p>
      </div>

      {/* Function 2.1: Temporal Claims Expiry & Legal Grace-Period Simulator */}
      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                Temporal Expiry &amp; Legal Grace-Period Simulator
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Simulate how time-windowed marketing claims evolve and escalate into blocking audit findings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--color-text-muted)]">Effective Date:</span>
            <span className="px-2 py-0.5 rounded bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] font-bold text-[var(--color-text-primary)]">
              {effectiveSimulatedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Simulator Preset Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] mr-1">Time Warp:</span>
            <button
              type="button"
              onClick={() => setSimulationOffsetDays(0)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                simulationOffsetDays === 0
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
              }`}
            >
              Today (Real-Time)
            </button>
            <button
              type="button"
              onClick={() => setSimulationOffsetDays(90)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                simulationOffsetDays === 90
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
              }`}
            >
              +90 Days (Q1 Review)
            </button>
            <button
              type="button"
              onClick={() => setSimulationOffsetDays(180)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                simulationOffsetDays === 180
                  ? "bg-[var(--color-primary)] text-white shadow-2xs"
                  : "bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
              }`}
            >
              +180 Days (H2 Audit)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] mr-1">Statutory Grace:</span>
            <button
              type="button"
              onClick={() => setGracePeriodDays(0)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                gracePeriodDays === 0
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              Strict (0d)
            </button>
            <button
              type="button"
              onClick={() => setGracePeriodDays(30)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                gracePeriodDays === 30
                  ? "bg-amber-600 text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              30-Day FTC Grace
            </button>
          </div>
        </div>

        {/* Live Simulation Alert */}
        {(simulationOffsetDays > 0 || gracePeriodDays > 0) && (
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Simulation Active:</strong> {expiredCount} claims expired &bull; {graceCount} claims in statutory grace period.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimulationOffsetDays(0);
                setGracePeriodDays(0);
              }}
              className="text-[11px] underline font-semibold text-blue-700 dark:text-blue-300 cursor-pointer"
            >
              Reset to Real-Time
            </button>
          </div>
        )}
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {evaluatedClaims.map((claim) => {
          return (
            <div
              key={claim.id}
              className={`p-4 rounded-xl border bg-[var(--color-surface)] shadow-xs space-y-3 transition-colors ${
                claim.isTerminal
                  ? "border-rose-500/30 bg-rose-500/[0.02]"
                  : claim.isInGracePeriod
                  ? "border-amber-500/30 bg-amber-500/[0.02]"
                  : "border-[var(--color-border-subtle)]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                    {claim.claim_code}
                  </span>
                  {claim.isTerminal ? (
                    <Badge variant="destructive" size="sm">
                      Expired &bull; Blocks Release
                    </Badge>
                  ) : claim.isInGracePeriod ? (
                    <Badge variant="warning" size="sm">
                      Grace Period ({gracePeriodDays}d)
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      Active &amp; Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Valid: {formatDate(claim.valid_from)} &ndash; {formatDate(claim.valid_until)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                  &ldquo;{claim.claim_text}&rdquo;
                </h4>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-xs space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-[var(--color-text-muted)] block">
                  SUBSTANTIATION EVIDENCE
                </span>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {claim.substantiation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
