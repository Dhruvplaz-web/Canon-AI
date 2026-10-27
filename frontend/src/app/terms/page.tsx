import Link from "next/link";
import { FileText, AlertCircle, Scale, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Canon Governance Platform",
  description: "Enterprise software license terms, regulatory disclaimers, and working title trademark notice.",
};

export default function TermsPage() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#111827]">
      <div className="mb-10 pb-6 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Enterprise License Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Terms of Service &amp; Regulatory Disclaimers
        </h1>
        <p className="text-xs text-[#6B7280] font-mono">
          Last Revised: January 1, 2026 · Standard Enterprise B2B SaaS Agreement
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-sm text-[#374151] space-y-8 leading-relaxed">
        {/* Important Disclaimer Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Important Statutory &amp; Legal Notice</span>
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed m-0">
            Canon provides automated pre-publication brand, terminology, and claims governance assistance. <strong>Canon does not provide formal legal advice, fiduciary warranty, or guarantee of immunity from statutory enforcement by regulatory authorities</strong> (such as the SEC, FTC, CFPB, or FCA). All release certificates must be countersigned by an authorized corporate compliance officer.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">1. Working Title &amp; Trademark Notice</h2>
          <p>
            &quot;Canon&quot; is an internal engineering working title for this software platform. Formal trademark clearance and registration are pending. All third-party trademarks, service marks, and brand names referenced in sample policies (including &quot;Acme Corp&quot; and &quot;Acme Financial&quot;) are used purely for illustrative and demonstration purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">2. Permitted Use &amp; License Grant</h2>
          <p>
            Subject to adherence to these Terms, Canon grants your organization a non-exclusive, non-transferable license to access and utilize the brand governance compiler, AST check runner, AI copilot rewriter, and cryptographic certification APIs for legitimate internal marketing and compliance workflows.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">3. Acceptable Use Policy</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li>Attempt to bypass, defeat, or manipulate Canon’s adversarial injection defenses (INJECT-001) in production environments without authorization.</li>
            <li>Submit fraudulent evidence into the verified claims ledger or forge cryptographic HMAC-SHA256 release certificates.</li>
            <li>Utilize the copilot rewrite engine to synthesize intentionally deceptive, fraudulent, or predatory financial marketing collateral.</li>
            <li>Reverse-engineer, decompile, or extract the proprietary AST rule compilation pipelines without an enterprise license.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">4. The Double-Receipt Invariant &amp; Reviewer Liability</h2>
          <p>
            Canon enforces the Double-Receipt Invariant: every flagged issue must link Draft Span (Receipt A) to an exact statutory document citation (Receipt B). While Canon facilitates automated compliance checks, final release decisions and override authorizations reside solely with designated human compliance reviewers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall Canon or Acme Corp be liable for any indirect, punitive, incidental, or consequential damages resulting from the use or inability to use this platform, including regulatory fines, advertising suspensions, or loss of commercial goodwill.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">6. Contact &amp; Governance Council</h2>
          <p>
            Questions regarding enterprise contracts, custom rule compilers, or license terms should be submitted via our <Link href="/contact" className="text-[#2563EB] hover:underline font-semibold">Contact Page</Link> or directed to `legal@acme.corp`.
          </p>
        </section>
      </div>
    </div>
  );
}
