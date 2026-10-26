"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Public demo account hints for local evaluation
const DEMO_ACCOUNTS = [
  {
    role: "creator",
    label: "Charlie Creator",
    email: "creator@acme.corp",
    passwordHint: "Creator2026!",
    description: "Marketing copywriter authoring draft submissions",
  },
  {
    role: "reviewer",
    label: "Rachel Reviewer",
    email: "reviewer@acme.corp",
    passwordHint: "Reviewer2026!",
    description: "Brand compliance reviewer adjudicating findings",
  },
  {
    role: "brand_manager",
    label: "Alice Brand",
    email: "brand_manager@acme.corp",
    passwordHint: "BrandManager2026!",
    description: "Policy authority approving proposals and activating v1.1",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NODE_ENV === "development";

  // If already authenticated, redirect
  if (user) {
    return (
      <div className="max-w-md w-full mx-auto my-auto p-8 neo-box-prominent bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#00C2CB] border-2 border-black text-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000]">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-black">Already Signed In</h2>
        <p className="text-xs text-black/80 font-medium">
          You are currently signed in as <strong className="text-black">{user.email}</strong> ({user.role}).
        </p>
        <button
          onClick={() => router.push(returnUrl)}
          type="button"
          className="neo-btn neo-btn-teal w-full text-xs font-black py-2.5"
        >
          <span>Continue to Application</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      router.push(returnUrl);
    } else {
      setErrorMessage("Authentication failed. Please verify your credentials and try again.");
    }
  };

  const handleSelectDemoEmail = (demoEmail: string, demoPassword?: string) => {
    setEmail(demoEmail);
    if (demoPassword) {
      setPassword(demoPassword);
    }
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md w-full mx-auto my-auto px-4 py-12 text-black">
      <div className="neo-box-prominent bg-white p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#00C2CB] border-2 border-black flex items-center justify-center mx-auto text-black font-black text-base shadow-[2px_2px_0px_#000]">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-black">Sign in to Canon</h1>
          <p className="text-xs text-black/80 font-medium">
            Pre-publication brand compliance &amp; policy governance workspace
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg border-2 border-black bg-[#FFE6E6] text-red-950 text-xs font-bold flex items-start gap-2.5 shadow-[2px_2px_0px_#000]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 stroke-[2.5]" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-black uppercase text-black font-mono">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/60">
                <Mail className="w-4 h-4 stroke-[2]" />
              </div>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@acme.corp"
                className="neo-input pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-black uppercase text-black font-mono">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black/60">
                <Lock className="w-4 h-4 stroke-[2]" />
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="neo-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="neo-btn neo-btn-teal w-full py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts List (Rendered ONLY when DEMO_MODE=true) */}
        {isDemoMode && (
          <div className="pt-5 border-t-[2px] border-black/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-black uppercase tracking-wider font-mono">
                Demo Personas
              </span>
              <span className="neo-badge bg-[#FFD700] text-black text-[9px] font-black">
                1-Click Quick Fill
              </span>
            </div>
            <p className="text-[11px] text-black/75 font-medium leading-relaxed">
              Select a persona to populate credentials for testing role-based brand governance workflows:
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemoEmail(acc.email, acc.passwordHint)}
                  className="w-full p-3 rounded-xl border-[2px] border-black bg-[#F4F0EA] hover:bg-white text-left transition flex items-center justify-between group shadow-[2px_2px_0px_#000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-black">{acc.label}</span>
                      <span className="neo-badge bg-[#00C2CB] text-black text-[9px] font-black">
                        {acc.role}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-black/70 group-hover:text-black transition block">
                      {acc.email}
                    </span>
                  </div>
                  <span className="text-xs font-black text-black group-hover:translate-x-1 transition flex items-center gap-1">
                    Fill &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md w-full mx-auto my-auto p-8 neo-box-prominent bg-white animate-pulse space-y-4">
          <div className="w-10 h-10 border-2 border-black bg-[#E2DDD5] mx-auto" />
          <div className="w-32 h-4 border border-black bg-[#E2DDD5] mx-auto" />
          <div className="w-48 h-3 border border-black bg-[#E2DDD5] mx-auto" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
