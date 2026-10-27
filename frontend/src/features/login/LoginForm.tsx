"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { validateReturnUrl } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const DEMO_PERSONAS = [
  {
    role: "creator" as const,
    label: "Charlie Creator",
    email: "creator@acme.corp",
    description: "Copywriter creating marketing copy & running pre-flight checks",
  },
  {
    role: "reviewer" as const,
    label: "Rachel Reviewer",
    email: "reviewer@acme.corp",
    description: "Compliance officer triaging flagged copy & adjudicating findings",
  },
  {
    role: "brand_manager" as const,
    label: "Alice Brand",
    email: "brand_manager@acme.corp",
    description: "Policy authority approving proposals & managing brand rules",
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = validateReturnUrl(rawReturnUrl);

  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, display session card with continue button
  if (user) {
    return (
      <div className="max-w-md w-full mx-auto my-auto p-8 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Already Signed In
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)]">
          You are currently signed in as{" "}
          <strong className="text-[var(--color-text-primary)] font-semibold">{user.email}</strong>{" "}
          ({user.role}).
        </p>
        <Button
          onClick={() => router.push(returnUrl)}
          variant="primary"
          className="w-full justify-center"
        >
          <span>Continue to Application</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const success = await login(email.trim(), password);
    setIsSubmitting(false);

    if (success) {
      router.push(returnUrl);
    } else {
      setErrorMessage("Authentication failed. Please verify your credentials and try again.");
    }
  };

  const handleSelectPersona = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("DemoSessionActive2026!");
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md w-full mx-auto my-auto px-4 py-12">
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto text-[var(--color-primary)]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Sign in to Canon
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Pre-publication brand compliance &amp; policy governance workspace
          </p>
        </div>

        {/* Accessible Error Banner with aria-live */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[var(--color-text-secondary)]"
            >
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                <Mail className="w-4 h-4" />
              </div>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@acme.corp"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-r-lg"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="w-full justify-center py-2.5"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Demo Persona Quick-Select */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Evaluation Personas
            </span>
            <Badge variant="outline" size="sm">
              Quick Fill
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Select a verified persona to test role-specific brand governance workflows:
          </p>
          <div className="space-y-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                onClick={() => handleSelectPersona(persona.email)}
                className="w-full p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] text-left transition flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {persona.label}
                    </span>
                    <Badge variant="secondary" size="sm">
                      {persona.role}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition block">
                    {persona.email}
                  </span>
                </div>
                <span className="text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition flex items-center gap-1">
                  Fill &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
