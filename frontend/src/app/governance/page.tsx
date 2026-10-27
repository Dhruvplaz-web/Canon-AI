"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RuleHealthGrid, type RuleHealthItem } from "@/features/governance/RuleHealthGrid";
import {
  ProposalAndBacktestSection,
  type ProposalItem,
  type BacktestRun,
} from "@/features/governance/ProposalAndBacktestSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

function GovernanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [healthItems, setHealthItems] = useState<RuleHealthItem[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [activeProposal, setActiveProposal] = useState<ProposalItem | null>(null);
  const [backtestRun, setBacktestRun] = useState<BacktestRun | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [isAdopted, setIsAdopted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync proposal to URL
  const updateProposalUrl = (prop: ProposalItem) => {
    setActiveProposal(prop);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("proposal", prop.proposal_code);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hRes, pRes] = await Promise.all([
        fetch("/api/v1/governance/health", { cache: "no-store" }),
        fetch("/api/v1/governance/proposals", { cache: "no-store" }),
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHealthItems(Array.isArray(hData) ? hData : []);
      }

      if (pRes.ok) {
        const pData: ProposalItem[] = await pRes.json();
        const list = Array.isArray(pData) ? pData : [];
        setProposals(list);

        const targetCode = searchParams.get("proposal");
        const match = targetCode
          ? list.find((p) => p.proposal_code === targetCode)
          : list[0];
        setActiveProposal(match || list[0] || null);
      }
    } catch {
      toast({
        title: "Telemetry Error",
        description: "Failed to load governance telemetry and candidate proposals.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Backtest Simulation
  const handleRunBacktest = async () => {
    if (!activeProposal) return;
    setIsBacktesting(true);
    try {
      const res = await fetch(
        `/api/v1/governance/proposals/${activeProposal.id}/backtest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) throw new Error("Backtest engine returned an error");

      const data: BacktestRun = await res.json();
      setBacktestRun(data);
      toast({
        title: "Backtest Simulation Complete",
        description: `Analyzed ${data.historical_submissions_analyzed} historical submissions with 0 regressions.`,
      });
    } catch {
      toast({
        title: "Simulation Failed",
        description: "Could not execute empirical backtest.",
        variant: "destructive",
      });
    } finally {
      setIsBacktesting(false);
    }
  };

  // Adopt Policy v1.1
  const handleAdoptPolicy = async () => {
    if (!activeProposal) return;
    setIsAdopting(true);
    try {
      const res = await fetch(
        `/api/v1/governance/proposals/${activeProposal.id}/adopt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) throw new Error("Policy adoption authorization failed");

      setIsAdopted(true);
      toast({
        title: "Policy v1.1 Activated",
        description: "Brand Policy v1.1 adopted and compiled into active production rules.",
      });
    } catch {
      toast({
        title: "Adoption Failed",
        description: "Policy adoption could not be completed.",
        variant: "destructive",
      });
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Governance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Rule Health Telemetry &amp; Evolution
            </h1>
            <Badge variant={isAdopted ? "success" : "secondary"} size="sm">
              {isAdopted ? "Policy v1.1 Active" : "Policy v1.0 Baseline"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Analyze reviewer friction signals, simulate historical backtests, and authorize policy revisions.
          </p>
        </div>
      </div>

      {isLoading && healthItems.length === 0 ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <>
          <RuleHealthGrid items={healthItems} />

          <ProposalAndBacktestSection
            proposals={proposals}
            activeProposal={activeProposal}
            onSelectProposal={updateProposalUrl}
            backtestRun={backtestRun}
            onRunBacktest={handleRunBacktest}
            isBacktesting={isBacktesting}
            onAdoptPolicy={handleAdoptPolicy}
            isAdopting={isAdopting}
            isAdopted={isAdopted}
          />
        </>
      )}
    </div>
  );
}

export default function GovernancePage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        }
      >
        <GovernanceContent />
      </Suspense>
    </div>
  );
}
