"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BreadcrumbItemProps {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItemProps[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={twMerge(clsx("flex text-xs", className))}>
      <ol className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        <li>
          <Link
            href="/"
            className="hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-border-focus)] rounded"
          >
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.isCurrent;
          return (
            <React.Fragment key={item.label}>
              <li aria-hidden="true" className="text-[var(--color-text-muted)]">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li>
                {isLast || !item.href ? (
                  <span
                    aria-current="page"
                    className="font-medium text-[var(--color-text-primary)]"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-border-focus)] rounded"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
