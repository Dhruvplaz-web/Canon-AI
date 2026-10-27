"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "critical"
    | "warning"
    | "info"
    | "success"
    | "destructive";
  size?: "sm" | "md" | "lg";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-medium transition-colors select-none";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-[11px]",
    lg: "px-3 py-1 text-xs",
  };

  const resolvedVariant = variant === "destructive" ? "critical" : variant;

  const variants = {
    default:
      "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary-muted)]",
    secondary:
      "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]",
    outline:
      "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-default)]",
    critical:
      "bg-[var(--status-critical-bg)] text-[var(--status-critical)] border border-[var(--status-critical-border)] font-semibold",
    warning:
      "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border border-[var(--status-warn-border)] font-semibold",
    info:
      "bg-[var(--status-minor-bg)] text-[var(--status-minor)] border border-[var(--status-minor-border)] font-semibold",
    success:
      "bg-[var(--status-pass-bg)] text-[var(--status-pass)] border border-[var(--status-pass-border)] font-semibold",
  };

  return (
    <span
      className={twMerge(clsx(base, sizeClasses[size], variants[resolvedVariant], className))}
      {...props}
    >
      {children}
    </span>
  );
}
