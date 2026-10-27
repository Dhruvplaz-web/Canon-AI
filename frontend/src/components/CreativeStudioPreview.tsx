"use client";

import React, { useState } from "react";
import {
  Globe,
  Mail,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface Finding {
  id: string;
  rule_code: string;
  severity: string;
  matched_text: string;
  start_offset: number;
  end_offset: number;
}

interface CreativeStudioPreviewProps {
  content: string;
  title: string;
  findings: Finding[];
  onLocateFinding?: (finding: Finding) => void;
}

export function CreativeStudioPreview({
  content,
  title,
  findings,
  onLocateFinding,
}: CreativeStudioPreviewProps) {
  const [activeChannel, setActiveChannel] = useState<"linkedin" | "google" | "instagram" | "email">("linkedin");

  const hasViolations = findings.length > 0;

  // Render text with highlighted violation spans inside the mockup
  const renderHighlightedText = (text: string) => {
    if (!findings || findings.length === 0) {
      return <span>{text || "Enter your draft copy in the editor to see live preview."}</span>;
    }

    const sorted = [...findings]
      .filter((f) => f.start_offset >= 0 && f.end_offset <= text.length && f.start_offset < f.end_offset)
      .sort((a, b) => a.start_offset - b.start_offset);

    if (sorted.length === 0) {
      return <span>{text}</span>;
    }

    const nodes: React.ReactNode[] = [];
    let last = 0;

    sorted.forEach((f, idx) => {
      if (f.start_offset > last) {
        nodes.push(<span key={`txt-${idx}`}>{text.slice(last, f.start_offset)}</span>);
      }
      const spanText = text.slice(Math.max(last, f.start_offset), f.end_offset);
      const isCritical = f.severity === "CRITICAL";
      nodes.push(
        <span
          key={`span-${f.id || idx}`}
          onClick={() => onLocateFinding && onLocateFinding(f)}
          className={`cursor-pointer px-1 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1 mx-0.5 transition-all ${
            isCritical
              ? "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
              : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
          }`}
          title={`Click to inspect ${f.rule_code}`}
        >
          <span>{spanText}</span>
          <span className="text-[9px] font-mono uppercase bg-white/80 px-1 rounded">
            {f.rule_code}
          </span>
        </span>
      );
      last = f.end_offset;
    });

    if (last < text.length) {
      nodes.push(<span key="txt-end">{text.slice(last)}</span>);
    }

    return <>{nodes}</>;
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Studio Header & Channel Tabs */}
      <div className="bg-[#F8F9FA] border-b border-[#E5E7EB] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#111827] font-mono">
            Multi-Channel Creative Simulator
          </span>
          {hasViolations ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
              <ShieldAlert className="w-3 h-3" />
              {findings.length} Violations in Ad
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              Creative Compliant
            </span>
          )}
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveChannel("linkedin")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeChannel === "linkedin"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA]"
            }`}
          >
            <LinkedInIcon className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("google")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeChannel === "google"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Ad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("instagram")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeChannel === "instagram"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA]"
            }`}
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel("email")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              activeChannel === "email"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FA]"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* Simulator Canvas Viewport */}
      <div className="p-6 bg-[#F8F9FA] flex items-center justify-center min-h-[340px]">
        {/* ================= LINKEDIN MOCKUP ================= */}
        {activeChannel === "linkedin" && (
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                A
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#111827]">Acme Wealth Management</span>
                  <span className="text-[10px] text-[#6B7280]">• 1st</span>
                </div>
                <span className="text-[11px] text-[#6B7280]">Promoted • Sponsored Investment Advisory</span>
              </div>
            </div>

            {/* Post Copy with in-situ highlights */}
            <div className="text-xs text-[#1F2937] leading-relaxed whitespace-pre-wrap">
              {renderHighlightedText(content)}
            </div>

            {/* Creative Card Banner */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#2563EB] font-bold">acmewealth.com</span>
                <h4 className="text-xs font-bold text-[#111827]">{title || "Institutional Asset Management"}</h4>
              </div>
              <button
                type="button"
                className="px-3 py-1 bg-[#2563EB] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#1D4ED8]"
              >
                Learn More
              </button>
            </div>

            {/* LinkedIn Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] text-[#6B7280] text-xs">
              <button type="button" className="flex items-center gap-1 hover:text-[#111827]">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Like</span>
              </button>
              <button type="button" className="flex items-center gap-1 hover:text-[#111827]">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>
              <button type="button" className="flex items-center gap-1 hover:text-[#111827]">
                <Repeat2 className="w-3.5 h-3.5" />
                <span>Repost</span>
              </button>
              <button type="button" className="flex items-center gap-1 hover:text-[#111827]">
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= GOOGLE AD MOCKUP ================= */}
        {activeChannel === "google" && (
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#111827] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                Sponsored
              </span>
              <span className="text-xs text-[#4B5563]">https://www.acmewealth.com/investments</span>
            </div>
            <h3 className="text-base font-bold text-[#1D4ED8] hover:underline cursor-pointer">
              {title || "Acme High Yield Wealth Advisory"} | Verified Performance
            </h3>
            <div className="text-xs text-[#374151] leading-relaxed">
              {renderHighlightedText(content)}
            </div>

            {/* Google Sitelinks */}
            <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-[#F3F4F6]">
              <div>
                <span className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer">
                  Explore Portfolios
                </span>
                <p className="text-[11px] text-[#6B7280]">Institutional grade asset allocation.</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer">
                  Historical Benchmarks
                </span>
                <p className="text-[11px] text-[#6B7280]">Audited returns across market cycles.</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= INSTAGRAM MOCKUP ================= */}
        {activeChannel === "instagram" && (
          <div className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-[10px] text-[#111827]">
                    A
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#111827]">acme_wealth</span>
                  <span className="text-[9px] text-[#6B7280]">Sponsored</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
            </div>

            {/* Instagram Graphic Mockup */}
            <div className="h-44 bg-gradient-to-br from-blue-600 to-indigo-800 p-4 flex flex-col justify-end text-white">
              <span className="text-[10px] uppercase font-mono tracking-wider text-blue-200">Growth Portfolio</span>
              <h3 className="text-sm font-extrabold">{title || "Secure Wealth Growth"}</h3>
            </div>

            {/* Instagram Caption */}
            <div className="p-4 flex flex-col gap-2">
              <div className="text-xs text-[#1F2937] leading-relaxed">
                <strong className="text-[#111827] mr-1.5">acme_wealth</strong>
                {renderHighlightedText(content)}
              </div>
              <span className="text-[10px] text-[#9CA3AF] uppercase">1 HOUR AGO</span>
            </div>
          </div>
        )}

        {/* ================= EMAIL MOCKUP ================= */}
        {activeChannel === "email" && (
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E5E7EB] flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">From: <strong className="text-[#111827]">Acme Wealth &lt;compliance@acme.com&gt;</strong></span>
                <span className="text-[10px] text-[#9CA3AF]">Today at 9:41 AM</span>
              </div>
              <div className="text-[#6B7280]">
                Subject: <strong className="text-[#111827]">{title || "Q4 Market Outlook & Wealth Allocation"}</strong>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs text-[#374151] leading-relaxed">
              <p>Dear Valued Client,</p>
              <div>{renderHighlightedText(content)}</div>
              <div className="pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg text-xs shadow-xs hover:bg-[#1D4ED8]"
                >
                  Review Investment Opportunities
                </button>
              </div>
              <p className="text-[11px] text-[#9CA3AF] pt-2 border-t border-[#F3F4F6]">
                Acme Wealth Advisory LLC. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
