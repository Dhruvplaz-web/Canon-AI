import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Canon Governance Platform",
  description: "Enterprise privacy policy, EU AI Act Article 50/52 disclosures, and zero-retention data safeguards.",
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#111827]">
      <div className="mb-10 pb-6 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory Compliance Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Enterprise Privacy &amp; Data Safeguards
        </h1>
        <p className="text-xs text-[#6B7280] font-mono">
          Effective Date: January 1, 2026 · Compliant with EU AI Act (Art. 50 &amp; 52), GDPR (Regulation EU 2016/679), and ISO/IEC 42001
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-sm text-[#374151] space-y-8 leading-relaxed">
        {/* Section 1: Core Guarantee */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>Article 1: Zero Customer Data Retention for LLM Training</span>
          </h2>
          <p className="text-xs text-emerald-800 leading-relaxed m-0">
            Canon operates on a strict zero-retention foundation. <strong>No marketing copy, draft text, policy documents, or proprietary brand rules submitted to Canon are ever retained, stored for model refinement, or used to train third-party foundation models</strong> (including Groq, Google Gemini, or OpenAI). All downstream inference calls enforce zero-data-retention headers (`no-store, zero-retention`).
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">1. Information Architecture &amp; Data Collection</h2>
          <p>
            When utilizing the Canon Brand Governance Platform, the following telemetry and execution artifacts are processed:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li><strong>Session Identifiers:</strong> Ephemeral role identifiers (Creator, Reviewer, Brand Manager) stored in client memory or secure HTTP-only session cookies.</li>
            <li><strong>Cryptographic Digests:</strong> SHA-256 one-way cryptographic hashes generated over draft content to verify the Double-Receipt Invariant without exposing raw plaintext.</li>
            <li><strong>Audit Logs:</strong> Reviewer override reason codes (`RC-01` through `RC-04`) and justification notes retained strictly in the tenant’s private PostgreSQL database.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">2. EU AI Act Articles 50 &amp; 52 Transparency Compliance</h2>
          <p>
            In accordance with Title IV (Transparency Obligations) of the European Union Artificial Intelligence Act (Regulation EU 2024/1689):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li><strong>AI Interaction Disclosure (Article 50):</strong> Users are explicitly informed whenever content is synthesized or modified by artificial intelligence. Every rewrite output is flagged with the exact foundation model and version utilized.</li>
            <li><strong>Synthetic Content Watermarking (Article 52):</strong> All approved campaigns generated with AI copilot assistance include machine-readable provenance metadata embedded in the cryptographic release certificate.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">3. Deterministic AST Privacy Safeguards</h2>
          <p>
            Unlike opaque LLM screening tools, Canon’s primary compliance engine executes as a local, deterministic Abstract Syntax Tree (AST) parser in volatile serverless memory. Text verification occurs on-the-fly without copying data to disk, external caches, or unmonitored logging streams.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">4. Cryptographic Proof &amp; Verification</h2>
          <p>
            When a formal sign-off is granted by an authorized reviewer, Canon computes an immutable HMAC-SHA256 digital certificate. This certificate records:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li>Content SHA-256 hash digest (preserving integrity without storing plaintext in public ledgers).</li>
            <li>Exact governing policy version and compiled rules count.</li>
            <li>Reviewer digital signature and timestamp.</li>
          </ul>
          <p className="mt-2 text-xs">
            Certificates can be validated by third parties at any time via the public <Link href="/transparency" className="text-[#2563EB] hover:underline font-semibold">AI Transparency Ledger</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">5. Data Subject Rights &amp; Regulatory Inquiries</h2>
          <p>
            Under GDPR Articles 15–22, users maintain the right to inspect, rectify, or purge their audit traces. For data subject access requests (DSAR) or formal compliance inquiries, contact:
          </p>
          <p className="font-mono text-xs text-[#2563EB] bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] mt-2">
            Data Protection Officer: dpo@acme.corp · Canon Governance Security Desk
          </p>
        </section>
      </div>
    </div>
  );
}
