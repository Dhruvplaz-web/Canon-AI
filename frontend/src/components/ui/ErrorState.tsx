"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
  retryAction?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  description,
  onRetry,
  retryAction,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  const finalMessage = message || description || "An unexpected error occurred.";
  const finalRetry = onRetry || retryAction;
  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-[var(--radius-card)] border border-[var(--status-critical-border)] bg-[var(--status-critical-bg)] shadow-xs",
          className
        )
      )}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--status-critical-border)] flex items-center justify-center text-[var(--status-critical)] mb-3">
        <AlertCircle className="w-5 h-5 stroke-[2]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--status-critical)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] max-w-sm leading-relaxed mb-4">
        {finalMessage}
      </p>
      {finalRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={finalRetry}
          disabled={isRetrying}
          className="border-[var(--status-critical-border)] bg-[var(--color-surface)] text-[var(--status-critical)] hover:bg-[var(--color-surface-hover)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>{isRetrying ? "Retrying..." : "Retry action"}</span>
        </Button>
      )}
    </div>
  );
}
