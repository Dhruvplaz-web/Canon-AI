"use client";

import React from "react";
import { CheckCircle2, AlertCircle, FileCheck, Calendar } from "lucide-react";
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
  const now = new Date().toISOString();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-[var(--color-text-secondary)] space-y-1">
        <h3 className="font-bold text-[var(--color-text-primary)] text-sm flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Statutory Substantiated Claims Ledger</span>
        </h3>
        <p>
          Approved marketing representations backed by regulatory evidence, formal certificates, and active time-bounded validity periods.
        </p>
      </div>

      <div className="space-y-3">
        {claims.map((claim) => {
          const isExpired = claim.valid_until < now;
          return (
            <div
              key={claim.id}
              className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                    {claim.claim_code}
                  </span>
                  <Badge variant={isExpired ? "destructive" : "success"} size="sm">
                    {isExpired ? "Expired" : "Active & Verified"}
                  </Badge>
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
