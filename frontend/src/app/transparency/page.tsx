"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import {
  EUAIActDisclosures,
  TelemetryMetricsGrid,
  RecentInferenceCallsTable,
  type TransparencyData,
} from "@/features/transparency/TransparencyComponents";
import { RefreshCw, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";

function TransparencyContent() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/transparency/disclosure", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast({
        title: "Telemetry Unavailable",
        description: "Could not load AI disclosure telemetry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              AI Transparency &amp; Regulatory Disclosures
            </h1>
            <Badge variant="outline" size="sm">
              EU AI Act Art. 50
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Auditable records of model invocations, provider terms, token throughput, and regulatory privacy guarantees.
          </p>
        </div>

        <Button
          onClick={fetchTelemetry}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </Button>
      </div>

      {isLoading && !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <EUAIActDisclosures />

          <TelemetryMetricsGrid data={data} />

          {data?.recent_calls && (
            <RecentInferenceCallsTable calls={data.recent_calls} />
          )}
        </>
      )}
    </div>
  );
}

export default function TransparencyPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <TransparencyContent />
      </Suspense>
    </div>
  );
}
