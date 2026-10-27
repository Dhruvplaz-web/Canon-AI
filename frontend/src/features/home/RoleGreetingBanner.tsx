"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UserProfile } from "@/lib/auth-context";

interface RoleGreetingBannerProps {
  user: UserProfile;
}

export function RoleGreetingBanner({ user }: RoleGreetingBannerProps) {
  const getRolePresentation = (role: string) => {
    switch (role) {
      case "brand_manager":
        return {
          title: "Brand Governance & Policy Lead",
          badge: "Brand Manager",
          badgeVariant: "default" as const,
          actionText: "Manage Rule Health & Backtest",
          actionHref: "/governance",
          guidance:
            "Rule TERM-007 shows high reviewer override rates. Review candidate proposals and execute empirical backtesting.",
          secondaryHref: "/policy",
          secondaryText: "Inspect Brand Policy",
        };
      case "reviewer":
        return {
          title: "Editorial & Compliance Triage",
          badge: "Reviewer",
          badgeVariant: "warning" as const,
          actionText: "Open Review Queue",
          actionHref: "/review",
          guidance:
            "Verified citations are pre-compiled for active submissions. Confirm or record reason-coded overrides.",
          secondaryHref: "/policy",
          secondaryText: "Browse Rules & Claims",
        };
      case "creator":
        return {
          title: "Marketing Copy & Creative Authoring",
          badge: "Creator",
          badgeVariant: "secondary" as const,
          actionText: "Author New Copy",
          actionHref: "/submissions",
          guidance:
            "Run pre-flight checks on draft copy to catch terminology conflicts and unverified claims before review.",
          secondaryHref: "/policy",
          secondaryText: "Check Guidelines",
        };
      default:
        return {
          title: "Workspace Member",
          badge: role.replace("_", " "),
          badgeVariant: "outline" as const,
          actionText: "Explore Workspace",
          actionHref: "/submissions",
          guidance: "Explore brand guidelines and review compliance workflows.",
          secondaryHref: "/policy",
          secondaryText: "Active Policy",
        };
    }
  };

  const roleInfo = getRolePresentation(user.role);

  return (
    <section className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-[var(--color-surface)] border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Welcome back, {user.full_name}
            </h2>
            <Badge variant={roleInfo.badgeVariant} size="sm">
              {roleInfo.badge}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            {roleInfo.guidance}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        <Link href={roleInfo.secondaryHref} className="flex-1 md:flex-initial">
          <Button variant="outline" size="sm" className="w-full">
            {roleInfo.secondaryText}
          </Button>
        </Link>
        <Link href={roleInfo.actionHref} className="flex-1 md:flex-initial">
          <Button variant="primary" size="sm" className="w-full">
            <span>{roleInfo.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function GuestBanner() {
  return (
    <section className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-[var(--color-surface)] border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
          <LogIn className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            Workspace Sign-in Available
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-xl">
            You are currently exploring in preview mode. Sign in to access submissions, triage reviewer queues, or configure brand policies.
          </p>
        </div>
      </div>
      <Link href="/login" className="shrink-0">
        <Button variant="primary" size="sm">
          <span>Sign In to Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </Link>
    </section>
  );
}
