import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "./Navbar";
import { StatusFooter } from "@/components/StatusFooter";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Canon — Pre-Publication Brand Governance Platform",
  description: "Deterministic brand compliance and policy governance platform.",
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
        className="min-h-full flex flex-col font-sans selection:bg-[var(--color-primary)] selection:text-white bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <ToastProvider>
              <AuthProvider>
                {/* Working Title Trademark Disclaimer Banner */}
                <aside
                  aria-label="Trademark Notice"
                  className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] px-4 py-1.5 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-[var(--color-text-primary)]">Working Title Notice:</strong> Canon is a working title; formal trademark clearance search pending.
                  </span>
                </aside>

                {/* Global Application Shell Header */}
                <Navbar />

                {/* Main Content Area */}
                <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
                  {children}
                </main>

                {/* Status-Enabled Footer with Live Health Probe */}
                <StatusFooter />
              </AuthProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
