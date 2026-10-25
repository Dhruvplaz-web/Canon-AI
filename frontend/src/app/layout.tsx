import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full bg-[#09090B] text-[#FAFAFA]">
      <body className="min-h-full flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Working Title Trademark Disclaimer Banner (Checklist Sec 2.5) */}
        <aside
          aria-label="Trademark Notice"
          className="w-full bg-[#18181B] border-b border-[#27272A] px-4 py-1.5 text-center text-xs text-[#A1A1AA] flex items-center justify-center gap-2"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          <span>
            <strong>Working Title Notice:</strong> Canon is a working title; formal trademark clearance search pending.
          </span>
        </aside>

        {/* Global Application Shell Header */}
        <header className="border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-white hover:opacity-90 transition">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                C
              </div>
              <span>CANON</span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-[#27272A] text-[#A1A1AA]">
                v1.0 M1
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-[#A1A1AA]" aria-label="Main Navigation">
              <a href="/submissions" className="hover:text-white transition px-2 py-1 rounded">
                Submissions
              </a>
              <a href="/review" className="hover:text-white transition px-2 py-1 rounded">
                Review Queue
              </a>
              <a href="/policy" className="hover:text-white transition px-2 py-1 rounded">
                Brand Policy
              </a>
              <a href="/governance" className="hover:text-white transition px-2 py-1 rounded">
                Rule Health & Backtest
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API: ONLINE
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Legal Disclaimer Footer */}
        <footer className="border-t border-[#27272A] bg-[#09090B] px-6 py-4 text-center text-xs text-[#71717A]">
          <p>
            Canon provides automated pre-publication brand and editorial review assistance. It does not provide certified legal advice or guarantee statutory compliance.
          </p>
        </footer>
      </body>
    </html>
  );
}
