import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "Canon — Pre-Publication Brand Governance Platform",
  description: "Deterministic double-receipt brand compliance and policy governance platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans selection:bg-[#2563EB] selection:text-white bg-[#F8F9FA] text-[#111827]"
      >
        <AuthProvider>
          {/* Working Title Trademark Disclaimer Banner */}
          <aside
            aria-label="Trademark Notice"
            className="w-full bg-white border-b border-[#E5E7EB] px-4 py-1.5 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-[#111827]">Working Title Notice:</strong> Canon is a working title; formal trademark clearance search pending.
            </span>
          </aside>

          {/* Global Application Shell Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>

        {/* Multi-Column Enterprise Footer (Markup.ai Reference Architecture) */}
        <footer className="border-t border-[#E5E7EB] bg-white text-[#4B5563] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Column */}
              <div className="md:col-span-2 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    C
                  </div>
                  <span className="font-extrabold tracking-tight text-[#111827] text-base">CANON</span>
                </div>
                <p className="text-xs text-[#4B5563] max-w-md leading-relaxed">
                  Enterprise pre-publication brand governance platform providing deterministic compliance verification refereed by provable evidence and the Double-Receipt Invariant.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280] font-mono text-[11px]">
                    Milestone 1 Release · Architecture Verified
                  </span>
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-semibold text-[#111827] uppercase tracking-wider text-[11px]">Platform</span>
                <Link href="/submissions" className="hover:text-[#2563EB] transition">Author & Submit Copy</Link>
                <Link href="/review" className="hover:text-[#2563EB] transition">Human Reviewer Queue</Link>
                <Link href="/policy" className="hover:text-[#2563EB] transition">Brand Policy Explorer</Link>
                <Link href="/governance" className="hover:text-[#2563EB] transition">Rule Health Intelligence</Link>
                <Link href="/evaluation" className="hover:text-[#2563EB] transition">AI Evaluation & Benchmark</Link>
                <Link href="/transparency" className="hover:text-[#2563EB] transition">AI Service Telemetry</Link>
                <Link href="/demo" className="hover:text-[#2563EB] transition font-semibold text-[#2563EB]">Evaluator Demo Tour</Link>
              </div>

              {/* Core Invariants */}
              <div className="flex flex-col gap-2.5 text-xs">
                <span className="font-semibold text-[#111827] uppercase tracking-wider text-[11px]">Guarantees</span>
                <span className="text-[#6B7280]">Receipt A: Draft Character Span</span>
                <span className="text-[#6B7280]">Receipt B: Statutory Excerpt</span>
                <span className="text-[#6B7280]">SHA-256 HMAC Digital Certificates</span>
                <span className="text-[#6B7280]">Postgres Row Level Security (RLS)</span>
                <span className="text-[#6B7280]">Zero-Leak Single-Origin Gateway</span>
              </div>
            </div>

            {/* Bottom Disclaimer Row */}
            <div className="border-t border-[#E5E7EB] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] text-center sm:text-left">
              <p className="max-w-3xl leading-relaxed">
                Canon provides automated pre-publication brand and editorial review assistance. It does not provide certified legal advice or guarantee statutory compliance.
              </p>
              <p className="shrink-0 font-mono text-[11px]">
                © 2026 Acme Corp. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
