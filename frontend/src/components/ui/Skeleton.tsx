"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={twMerge(
        clsx(
          "skeleton rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]",
          className
        )
      )}
      {...props}
    />
  );
}
