"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Shield, CheckCircle2, Send, Building, Lock } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    topic: "enterprise_demo",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSubmitted(true);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#111827]">
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold mb-4">
          <Mail className="w-3.5 h-3.5" />
          <span>Contact & Inquiries</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#111827]">
          Get in Touch with Canon Engineering
        </h1>
        <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
          Have questions about the Dual Grounding architecture, SOC-2 compliance integrations, or vulnerability disclosures? Reach our team directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
        {/* Contact Information & Security Channels */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827] mb-1">Enterprise Licensing</h3>
            <p className="text-xs text-[#4B5563] mb-3 leading-relaxed">
              Inquiries regarding dedicated private VPC deployment, custom AST parser compilation, and SSO integrations.
            </p>
            <span className="font-mono text-xs text-[#2563EB] font-semibold">enterprise@acme.corp</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827] mb-1">Vulnerability Reporting</h3>
            <p className="text-xs text-[#4B5563] mb-3 leading-relaxed">
              We operate under RFC 9116 responsible disclosure. For encrypted submissions, see our security policy.
            </p>
            <Link href="/security.txt" className="font-mono text-xs text-[#2563EB] hover:underline font-semibold block mb-1">
              /.well-known/security.txt
            </Link>
            <span className="font-mono text-xs text-[#6B7280]">security@acme.corp</span>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl p-6 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2 font-semibold text-[#111827] mb-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Zero-Retention Promise</span>
            </div>
            Messages sent via this form are encrypted in transit and never utilized to train public artificial intelligence models.
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Inquiry Transmitted Successfully</h2>
              <p className="text-sm text-[#4B5563] max-w-md mb-6 leading-relaxed">
                Thank you, <strong>{formData.name}</strong>. Your message regarding <em>{formData.topic.replace("_", " ")}</em> has been recorded in the compliance dispatch queue.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                type="button"
                className="neo-btn neo-btn-teal px-4 py-2 text-xs font-semibold"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-bold text-[#111827] mb-1">Direct Communication Dispatch</h2>
              <p className="text-xs text-[#6B7280] mb-6">Complete all fields below for priority review routing.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-input" className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rachel Reviewer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F9FAFB] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Corporate Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rachel@acmefinancial.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F9FAFB] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="org-input" className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Organization / Entity
                  </label>
                  <input
                    id="org-input"
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Acme Financial Corp."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F9FAFB] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label htmlFor="topic-select" className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Inquiry Category
                  </label>
                  <select
                    id="topic-select"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F9FAFB] focus:bg-white transition"
                  >
                    <option value="enterprise_demo">Enterprise Product Demonstration</option>
                    <option value="compliance_advisory">Regulatory / Verification Architecture Inquiry</option>
                    <option value="security_disclosure">Vulnerability Disclosure (Security Team)</option>
                    <option value="product_evaluation">Product Evaluation &amp; Enterprise Pilot</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message-input" className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Message / Context
                </label>
                <textarea
                  id="message-input"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide context on your brand compliance requirements, custom rule compilation needs, or enterprise evaluation inquiries..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F9FAFB] focus:bg-white transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="neo-btn neo-btn-teal flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-xs font-semibold shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Inquiry</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
