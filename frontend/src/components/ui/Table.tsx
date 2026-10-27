"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }
>(({ className, wrapperClassName, ...props }, ref) => (
  <div className={twMerge(clsx("relative w-full overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs", wrapperClassName))}>
    <table
      ref={ref}
      className={twMerge(clsx("w-full caption-bottom text-xs text-left", className))}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={twMerge(clsx("bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] font-medium", className))}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={twMerge(clsx("[&_tr:last-child]:border-0 divide-y divide-[var(--color-border-subtle)]", className))}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      clsx(
        "transition-colors hover:bg-[var(--color-surface-hover)] data-[state=selected]:bg-[var(--color-primary-subtle)]",
        className
      )
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, scope = "col", ...props }, ref) => (
  <th
    ref={ref}
    scope={scope}
    className={twMerge(
      clsx(
        "h-10 px-3.5 text-left align-middle font-semibold text-[var(--color-text-primary)] text-xs tracking-tight select-none",
        className
      )
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { isNumeric?: boolean }
>(({ className, isNumeric = false, ...props }, ref) => (
  <td
    ref={ref}
    className={twMerge(
      clsx(
        "p-3.5 align-middle text-xs text-[var(--color-text-primary)]",
        isNumeric && "tabular-nums font-mono text-right",
        className
      )
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={twMerge(clsx("mt-3 text-[11px] text-[var(--color-text-muted)] italic text-center", className))}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
