"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Audit error boundary capture
  }, [error]);

  return (
    <div
      id="main-content"
      role="alert"
      className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center text-[var(--color-text-primary)]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--status-critical-bg)] border border-[var(--status-critical-border)] text-[var(--status-critical-accent)] flex items-center justify-center mb-6 shadow-xs">
        <AlertCircle className="w-8 h-8 stroke-[1.75]" aria-hidden="true" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] text-[var(--status-critical)] text-xs font-mono font-medium mb-4">
        Application Boundary Intercepted
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-[var(--color-text-primary)]">
        An Unexpected Error Occurred
      </h1>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
        The application encountered an unexpected condition. Your session and draft copies have been isolated safely.
      </p>

      {error.digest && (
        <p className="font-mono text-xs text-[var(--color-text-muted)] mb-8 bg-[var(--color-surface-muted)] px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)]">
          Diagnostic ID: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="w-4 h-4" />
          <span>Retry Operation</span>
        </Button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <Home className="w-4 h-4" />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
}
