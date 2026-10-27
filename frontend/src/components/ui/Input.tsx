"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", isError = false, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        aria-invalid={isError ? "true" : undefined}
        className={twMerge(
          clsx(
            "flex h-9 w-full rounded-[var(--radius-button)] border bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            isError
              ? "border-[var(--status-critical-accent)] focus-visible:ring-[var(--status-critical-accent)]"
              : "border-[var(--color-border-default)] focus-visible:ring-[var(--color-border-focus)]",
            className
          )
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
