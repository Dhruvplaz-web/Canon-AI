"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={twMerge(
      clsx(
        "inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-surface-muted)] p-1 text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]",
        className
      )
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={twMerge(
      clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-xs cursor-pointer",
        className
      )
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={twMerge(
      clsx(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
        className
      )
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
