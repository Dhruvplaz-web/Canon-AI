"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, isError = false, disabled, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={isError ? "true" : undefined}
          className={twMerge(
            clsx(
              "flex h-9 w-full appearance-none rounded-[var(--radius-button)] border bg-[var(--color-surface)] px-3 pr-8 py-1.5 text-xs text-[var(--color-text-primary)] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              isError
                ? "border-[var(--status-critical-accent)] focus-visible:ring-[var(--status-critical-accent)]"
                : "border-[var(--color-border-default)] focus-visible:ring-[var(--color-border-focus)]",
              className
            )
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = "Select";
