import Link from "next/link";
import { AlertTriangle, Home, FileText, CheckCircle2 } from "lucide-react";

export default function NotFound() {
  return (
    <div
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center text-[var(--color-text-primary)]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--status-warn-bg)] border border-[var(--status-warn-border)] text-[var(--status-warn-accent)] flex items-center justify-center mb-6 shadow-xs">
        <AlertTriangle className="w-8 h-8 stroke-[1.75]" aria-hidden="true" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] text-[var(--status-warn)] text-xs font-mono font-medium mb-4">
        HTTP 404 · Resource Not Located
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-[var(--color-text-primary)]">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
        The requested URL does not exist in the active Canon workspace or the route has been relocated.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <Home className="w-4 h-4" />
          <span>Return to Workspace</span>
        </Link>

        <Link
          href="/submissions"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <FileText className="w-4 h-4" />
          <span>Authoring Studio</span>
        </Link>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Demo Tour</span>
        </Link>
      </div>

      <div className="mt-12 pt-6 border-t border-[var(--color-border-subtle)] max-w-sm w-full text-xs text-[var(--color-text-muted)]">
        <p>
          Need assistance? Explore the{" "}
          <Link href="/policy" className="underline hover:text-[var(--color-primary)]">
            Brand Policy Explorer
          </Link>{" "}
          or consult{" "}
          <Link href="/transparency" className="underline hover:text-[var(--color-primary)]">
            AI Transparency
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
