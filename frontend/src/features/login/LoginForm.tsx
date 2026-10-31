"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Building2,
  Sparkles,
  Fingerprint,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { validateReturnUrl } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RbacPermissionsModal } from "@/components/RbacPermissionsModal";

const DEMO_PERSONAS = [
  {
    role: "creator" as const,
    label: "Charlie Creator",
    email: "creator@acme.corp",
    description: "Copywriter creating marketing copy & running pre-flight AST checks",
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
  {
    role: "legal_counsel" as const,
    label: "Vikram Legal",
    email: "legal_counsel@acme.corp",
    description: "Statutory counsel managing Section 65B audit certs & regulatory freeze",
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
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRbacModal, setShowRbacModal] = useState(false);

  // 2FA / TOTP challenge state
  const [mfaStep, setMfaStep] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);

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

    // If logging into high-privilege account (brand manager or legal counsel), prompt 2FA TOTP verification
    if ((email.includes("brand") || email.includes("legal")) && !mfaStep) {
      setTimeout(() => {
        setIsSubmitting(false);
        setMfaStep(true);
      }, 350);
      return;
    }

    const success = await login(email.trim(), password);
    setIsSubmitting(false);

    if (success) {
      router.push(returnUrl);
    } else {
      setErrorMessage("Authentication failed. Please verify your credentials and try again.");
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.replace(/\D/g, "").length !== 6 && totpCode !== "842190" && totpCode !== "842-190") {
      setMfaError("Invalid 6-digit TOTP token. Please enter 842-190 or your authenticator code.");
      return;
    }

    setIsSubmitting(true);
    setMfaError(null);
    const success = await login(email.trim(), password || "DemoSessionActive2026!");
    setIsSubmitting(false);

    if (success) {
      router.push(returnUrl);
    } else {
      setMfaError("MFA Verification failed. Session token expired.");
    }
  };

  const handleSsoLogin = async (provider: "okta" | "google") => {
    setSsoProvider(provider);
    setErrorMessage(null);
    const targetEmail =
      provider === "okta" ? "brand_manager@enterprise.corp" : "creator@work.corp";
    const success = await login(targetEmail, "SSO_FEDERATED_SAML_2026");
    setSsoProvider(null);
    if (success) {
      router.push(returnUrl);
    } else {
      setErrorMessage(`Federated SSO with ${provider.toUpperCase()} failed.`);
    }
  };

  const handleSelectPersona = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("DemoSessionActive2026!");
    setErrorMessage(null);
    setMfaStep(false);
  };

  return (
    <div className="max-w-md w-full mx-auto my-auto px-4 py-8">
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto text-[var(--color-primary)] shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Sign in to Canon
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Enterprise Pre-Publication Governance &amp; Regulatory Gatekeeper
          </p>
        </div>

        {/* SSO Quick Launchers */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isSubmitting || !!ssoProvider}
            onClick={() => handleSsoLogin("okta")}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] text-xs font-semibold text-[var(--color-text-primary)] transition flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {ssoProvider === "okta" ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
            ) : (
              <Building2 className="w-4 h-4 text-[#007dc1]" />
            )}
            <span>Sign in with Okta SAML 2.0</span>
            <Badge variant="outline" size="sm" className="ml-auto text-[10px] py-0">
              Enterprise
            </Badge>
          </button>

          <button
            type="button"
            disabled={isSubmitting || !!ssoProvider}
            onClick={() => handleSsoLogin("google")}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] text-xs font-semibold text-[var(--color-text-primary)] transition flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {ssoProvider === "google" ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign in with Google Workspace</span>
            <Badge variant="outline" size="sm" className="ml-auto text-[10px] py-0">
              OAuth 2.0
            </Badge>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border-subtle)]" />
          </div>
          <span className="relative bg-[var(--color-surface)] px-3 text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
            Or Work Credentials
          </span>
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

        {/* 2FA / TOTP Challenge View */}
        {mfaStep ? (
          <form onSubmit={handleVerifyMfa} className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-3.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
                <Fingerprint className="w-4 h-4" />
                <span>Enterprise TOTP Verification Required</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                Elevated privileges detected for{" "}
                <strong className="text-[var(--color-text-primary)]">{email}</strong>. Enter the
                6-digit rotating token from your authenticator app (e.g. 1Password, Google Authenticator).
              </p>
            </div>

            {mfaError && (
              <div
                role="alert"
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{mfaError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="totp-code"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)]"
                >
                  Authenticator Security Code
                </label>
                <button
                  type="button"
                  onClick={() => setTotpCode("842190")}
                  className="text-[11px] text-[var(--color-primary)] hover:underline font-mono"
                >
                  Paste Sample (842-190)
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <Input
                  id="totp-code"
                  type="text"
                  maxLength={7}
                  required
                  autoFocus
                  placeholder="842-190"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="pl-9 font-mono tracking-widest text-center text-base"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                className="w-1/3 justify-center text-xs"
                onClick={() => setMfaStep(false)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-2/3 justify-center text-xs"
              >
                {isSubmitting ? "Verifying..." : "Confirm & Sign In"}
              </Button>
            </div>
          </form>
        ) : (
          /* Standard Login Credentials Form */
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
        )}

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
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                      {persona.label}
                    </span>
                    <Badge variant="secondary" size="sm" className="shrink-0 text-[10px]">
                      {persona.role}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition truncate block">
                    {persona.email}
                  </span>
                </div>
                <span className="text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-0.5 transition flex items-center gap-1 shrink-0">
                  Fill &rarr;
                </span>
              </button>
            ))}
          </div>

          {/* RBAC Modal Launcher */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowRbacModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition underline underline-offset-4 decoration-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Explore Enterprise RBAC Matrix &amp; Permission Tiers</span>
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Modal */}
      <RbacPermissionsModal
        isOpen={showRbacModal}
        onClose={() => setShowRbacModal(false)}
      />
    </div>
  );
}
