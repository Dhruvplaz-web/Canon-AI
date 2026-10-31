"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Keyboard } from "lucide-react";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

interface HealthStatus {
  status: string;
  version?: string;
  service?: string;
}

export function StatusFooter() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const start = performance.now();

    fetch("/api/v1/health/live", { cache: "no-store" })
      .then((res) => {
        if (!active) return;
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
        return res.json();
      })
      .then((data) => {
        if (active && data) {
          setHealth(data);
        }
      })
      .catch(() => {
        if (active) {
          setHealth({ status: "unavailable" });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand & Mission Column */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs"
                aria-hidden="true"
              >
                C
              </div>
              <span className="font-extrabold tracking-tight text-[var(--color-text-primary)] text-base">
                CANON
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              Enterprise pre-publication brand governance platform providing deterministic compliance verification backed by verified evidence citations and human-in-the-loop decisions.
            </p>

            {/* Live Gateway Status Badge */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] text-[11px] font-mono"
                aria-label="API System Status"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    health?.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                  aria-hidden="true"
                />
                <span>
                  API: {health?.status === "ok" ? "Operational" : "Checking..."}
                  {latencyMs !== null ? ` (${latencyMs}ms)` : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] text-[11px] font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Keyboard className="w-3 h-3" />
                <span>Shortcuts (?)</span>
              </button>

              <Link
                href="/llms.txt"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 font-mono text-[11px] hover:opacity-90 transition"
              >
                llms.txt
              </Link>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
              Platform
            </span>
            <Link href="/submissions" className="hover:text-[var(--color-primary)] transition">
              Author &amp; Check Copy
            </Link>
            <Link href="/review" className="hover:text-[var(--color-primary)] transition">
              Human Reviewer Queue
            </Link>
            <Link href="/policy" className="hover:text-[var(--color-primary)] transition">
              Brand Policy Explorer
            </Link>
            <Link href="/governance" className="hover:text-[var(--color-primary)] transition">
              Rule Health &amp; Backtest
            </Link>
            <Link href="/evaluation" className="hover:text-[var(--color-primary)] transition">
              AI Evaluation &amp; Benchmark
            </Link>
            <Link href="/transparency" className="hover:text-[var(--color-primary)] transition">
              AI Service Telemetry
            </Link>
            <Link href="/audit" className="hover:text-[var(--color-primary)] transition">
              Audit &amp; Verification Ledger
            </Link>
            <Link
              href="/demo"
              className="hover:text-[var(--color-primary)] transition font-semibold text-[var(--color-primary)]"
            >
              Evaluator Guided Demo
            </Link>
          </div>

          {/* Company & Legal Links */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
              Legal &amp; Trust
            </span>
            <Link href="/about" className="hover:text-[var(--color-primary)] transition">
              About Canon
            </Link>
            <Link href="/contact" className="hover:text-[var(--color-primary)] transition">
              Contact &amp; Inquiries
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-primary)] transition">
              Privacy &amp; EU AI Act
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-primary)] transition">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-[var(--color-primary)] transition">
              Cookie Policy
            </Link>
            <Link
              href="/security.txt"
              className="hover:text-[var(--color-primary)] transition font-mono text-[11px]"
            >
              security.txt
            </Link>
          </div>

          {/* Verified Evidence Guarantees (Section 3 Invariants in Plain English) */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Evidence Guarantees</span>
            </span>
            <span className="text-[var(--color-text-muted)]">
              Draft Citation: exact character span
            </span>
            <span className="text-[var(--color-text-muted)]">
              Rule Excerpt: statutory policy text
            </span>
            <span className="text-[var(--color-text-muted)]">
              Human Final Decision with Reason Codes
            </span>
            <span className="text-[var(--color-text-muted)]">
              Append-Only Audit Verification Ledger
            </span>
            <span className="text-[var(--color-text-muted)]">
              Strict Workspace Multi-Tenant Isolation
            </span>
          </div>
        </div>

        {/* Bottom Disclaimer Row */}
        <div className="border-t border-[var(--color-border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)] text-center sm:text-left">
          <p className="max-w-3xl leading-relaxed">
            Canon is a working title; trademark clearance search pending. Canon provides automated brand review assistance. It does not provide legal advice or guarantee regulatory compliance.
          </p>
          <p className="shrink-0 font-mono text-[11px]">
            &copy; {new Date().getFullYear()} Acme Corp. All rights reserved.
          </p>
        </div>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </footer>
  );
}
