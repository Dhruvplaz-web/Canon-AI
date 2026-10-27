"use client";

import * as React from "react";
import { Breadcrumb, BreadcrumbItemProps } from "@/components/ui/Breadcrumb";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItemProps[];
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={twMerge(
        clsx(
          "w-full pb-6 mb-8 border-b border-[var(--color-border-subtle)] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          className
        )
      )}
    >
      <div className="space-y-1.5 max-w-3xl">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} className="mb-2" />
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </header>
  );
}
