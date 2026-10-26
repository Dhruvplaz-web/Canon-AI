import type { Metadata } from "next";
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
    <html lang="en" className="h-full bg-[#F4F0EA] text-black" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans selection:bg-[#00C2CB] selection:text-black bg-[#F4F0EA] text-black"
      >
        <AuthProvider>
          {/* Working Title Trademark Disclaimer Banner (Checklist Sec 2.5) */}
          <aside
            aria-label="Trademark Notice"
            className="w-full bg-[#FFD700] border-b-[2.5px] border-black px-4 py-2 text-center text-xs text-black font-bold flex items-center justify-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-black border border-black inline-block animate-pulse" aria-hidden="true" />
            <span>
              <strong>WORKING TITLE NOTICE:</strong> Canon is a working title; formal trademark clearance search pending.
            </span>
          </aside>

          {/* Global Application Shell Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>

        {/* Legal Disclaimer Footer */}
        <footer className="border-t-[2.5px] border-black bg-white px-6 py-5 text-center text-xs font-bold text-black">
          <p>
            Canon provides automated pre-publication brand and editorial review assistance. It does not provide certified legal advice or guarantee statutory compliance.
          </p>
        </footer>
      </body>
    </html>
  );
}
