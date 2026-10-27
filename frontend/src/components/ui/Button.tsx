"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2";

    const variants = {
      primary:
        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] border border-transparent shadow-xs active:translate-y-[1px]",
      secondary:
        "bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] shadow-xs active:translate-y-[1px]",
      outline:
        "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] border border-[var(--color-border-default)]",
      ghost:
        "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] border border-transparent",
      destructive:
        "bg-[var(--status-critical-accent)] text-white hover:opacity-90 border border-transparent shadow-xs active:translate-y-[1px]",
    };

    const sizes = {
      sm: "h-8 px-2.5 text-xs rounded-[var(--radius-button)] gap-1.5",
      md: "h-9 px-3.5 text-xs rounded-[var(--radius-button)] gap-2",
      lg: "h-11 px-5 text-sm rounded-[var(--radius-button)] gap-2.5",
      icon: "h-9 w-9 p-0 rounded-[var(--radius-button)]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
