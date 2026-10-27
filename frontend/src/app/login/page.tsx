import React, { Suspense } from "react";
import { LoginForm } from "@/features/login/LoginForm";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "Sign In — Canon Brand Governance",
  description: "Sign in to access your pre-publication brand compliance workspace.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md w-full mx-auto my-auto p-8 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg space-y-4 animate-pulse">
          <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
          <Skeleton className="w-40 h-6 mx-auto" />
          <Skeleton className="w-64 h-4 mx-auto" />
          <div className="space-y-3 pt-4">
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
