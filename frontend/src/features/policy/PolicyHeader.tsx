"use client";

import React, { useState } from "react";
import { BookOpen, RefreshCw, Copy, Check, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";

interface PolicyHeaderProps {
  versionNumber?: string;
  rulesCount?: number;
  contentHash?: string;
  onRefresh: () => void;
  onOpenIngester?: () => void;
  isRefreshing?: boolean;
}

export function PolicyHeader({
  versionNumber = "1.0",
  rulesCount = 0,
  contentHash,
  onRefresh,
  onOpenIngester,
  isRefreshing = false,
}: PolicyHeaderProps) {
  const { user } = useAuth();
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    if (!contentHash) return;
    navigator.clipboard.writeText(contentHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isBrandManager = user?.role === "brand_manager";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Brand Policy Explorer
          </h1>
          <Badge variant="secondary" size="sm">
            v{versionNumber} (Active)
          </Badge>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            {rulesCount} active rules
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Inspect compiled brand rules, verbatim statutory source citations, and approved claims.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {contentHash && (
          <button
            type="button"
            onClick={handleCopyHash}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[11px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            title="Copy document SHA-256 hash"
          >
            {copiedHash ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>SHA: {contentHash.slice(0, 8)}...</span>
          </button>
        )}

        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>

        {isBrandManager && onOpenIngester && (
          <Button onClick={onOpenIngester} variant="primary" size="sm" className="gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ingest Document</span>
          </Button>
        )}
      </div>
    </div>
  );
}
