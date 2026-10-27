import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Canon Governance Platform",
  description: "Transparent cookie and local storage disclosures: strictly essential cookies, zero third-party advertising trackers.",
};

export default function CookiePage() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#111827]">
      <div className="mb-10 pb-6 border-b border-[#E5E7EB]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-800 text-xs font-semibold mb-3">
          <Cookie className="w-3.5 h-3.5" />
          <span>Storage &amp; Telemetry Notice</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Cookie &amp; Local Storage Policy
        </h1>
        <p className="text-xs text-[#6B7280] font-mono">
          Last Updated: January 1, 2026 · Zero Third-Party Advertising Trackers
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-sm text-[#374151] space-y-8 leading-relaxed">
        <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-purple-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Strictly Essential Storage Architecture</span>
          </h2>
          <p className="text-xs text-purple-800 leading-relaxed m-0">
            Canon does not use third-party advertising trackers, social network beacons, or cross-site fingerprinting technologies. <strong>We store only strictly necessary first-party cookies and local state</strong> required to authenticate compliance sessions and persist your active review queue filters.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">1. Inventory of Active Cookies and Storage Keys</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#111827]">
                <tr>
                  <th className="p-3 font-semibold">Identifier</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Duration</th>
                  <th className="p-3 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#4B5563]">
                <tr>
                  <td className="p-3 font-mono text-[#2563EB]">canon_session_id</td>
                  <td className="p-3">Strictly Essential</td>
                  <td className="p-3">Session (HTTP-only)</td>
                  <td className="p-3">Authenticates the reviewer or creator role against the session gateway.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#2563EB]">canon_role</td>
                  <td className="p-3">Functional</td>
                  <td className="p-3">Session</td>
                  <td className="p-3">Stores current active persona (Creator, Reviewer, Brand Manager).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[#2563EB]">localStorage.theme</td>
                  <td className="p-3">Preference</td>
                  <td className="p-3">Persistent</td>
                  <td className="p-3">Remembers user contrast and dashboard layout preferences.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">2. Management and Disabling</h2>
          <p>
            Because these cookies are strictly essential for the platform’s security and role-based access control, they cannot be individually disabled within the dashboard without logging out. You may block all cookies via your browser settings; however, authentication sessions will cease to persist.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#111827] mb-3">3. Related Governance Disclosures</h2>
          <p>
            For information regarding how Canon handles text payloads and ensures EU AI Act compliance, review our <Link href="/privacy" className="text-[#2563EB] hover:underline font-semibold">Privacy Policy</Link> and <Link href="/transparency" className="text-[#2563EB] hover:underline font-semibold">AI Transparency Ledger</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
