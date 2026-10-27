import Link from "next/link";
import { Shield, Sparkles, Scale, Lock, CheckCircle2, FileCode, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Canon — Pre-Publication Brand Governance Platform",
  description: "Learn about Canon's mission, the Double-Receipt Invariant, and deterministic compliance verification architecture.",
};

export default function AboutPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#111827]">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>About Canon Governance</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#111827]">
          Eliminating Brand & Legal Liability in Generative Marketing Copy
        </h1>
        <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
          Canon is the industry’s first deterministic, pre-publication brand governance platform. We replace probabilistic AI promises with provable, character-exact compliance receipts and cryptographic release seals.
        </p>
      </div>

      {/* The Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-[#111827]">The Generative Copy Crisis</h2>
          <p className="text-sm text-[#4B5563] leading-relaxed mb-4">
            Modern marketing teams generate thousands of collateral variants weekly using LLMs. However, unconstrained language models routinely hallucinate prohibited promises:
          </p>
          <ul className="space-y-2 text-xs text-[#4B5563]">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Unqualified Banking Verbs:</strong> Claiming &quot;bank on us&quot; without bank charter disclosure triggers immediate statutory penalties.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Deceptive Performance Guarantees:</strong> Promising &quot;guaranteed returns&quot; or &quot;risk-free yields&quot; breaches SEC and FTC rules.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Adversarial Injection Vulnerabilities:</strong> Raw LLM copilots are easily tricked by delimiter escapes into approving illegal copy.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-[#111827]">The Canon Architecture</h2>
          <p className="text-sm text-[#4B5563] leading-relaxed mb-4">
            Canon decouples verification from generation. Instead of asking an LLM to &quot;check itself&quot;, Canon introduces a deterministic compiler pipeline:
          </p>
          <ul className="space-y-2 text-xs text-[#4B5563]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>The Double-Receipt Invariant:</strong> Every flag links character-span Receipt A (draft text) with statutory Receipt B (verbatim policy quote).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Sub-Millisecond Deterministic AST:</strong> Exact lexical tokenization runs in &lt;4ms with zero probabilistic drift or hallucinations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Cryptographic HMAC-SHA256 Seals:</strong> Released collateral is digitally signed, creating an immutable audit trail.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Core Principles */}
      <div className="border-t border-[#E5E7EB] pt-12 mb-16">
        <h2 className="text-2xl font-bold mb-8 text-[#111827]">Core Engineering Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center mb-3 text-[#2563EB]">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold mb-2">Zero Customer Data Retention</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              In full accordance with EU AI Act Article 50/52 and GDPR, zero customer copy or PII is ever retained or used for external model training.
            </p>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center mb-3 text-purple-600">
              <FileCode className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold mb-2">Audit-Grade Traceability</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Every reviewer override requires a statutory reason code (`RC-01` through `RC-04`) and written justification preserved in the claims ledger.
            </p>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center mb-3 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold mb-2">Multi-Provider AI Fallback</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Waterfall integration across Groq, Google Gemini, and algorithmic NLP guarantees 100% uptime without vendor lock-in.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <h2 className="text-2xl font-bold mb-2">Ready to Test the Platform?</h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Explore the Creator Studio, review live compliance checks, or run our automated 30-case benchmark harness.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/submissions"
            className="neo-btn neo-btn-teal flex items-center gap-2 px-5 py-3 text-xs font-semibold"
          >
            <span>Open Creator Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="neo-btn neo-btn-white flex items-center gap-2 px-5 py-3 text-xs font-semibold"
          >
            <span>Guided Tour</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
