"use client";

import * as React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs",
          className
        )
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-muted)] mb-4">
        <Icon className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
