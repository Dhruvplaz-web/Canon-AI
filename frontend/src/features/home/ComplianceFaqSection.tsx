"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Shield, FileCheck, Lock, Globe, Scale } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface FaqItem {
  id: string;
  icon: React.ElementType;
  question: string;
  category: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "double-receipt",
    icon: Shield,
    category: "Architecture",
    question: "What is the Double-Receipt Invariant and how does it prevent AI hallucinations?",
    answer:
      "Unlike generic LLM wrappers that guess violations probabilistically, Canon enforces a mathematical Double-Receipt Invariant: every single flagged violation MUST provide two immutable cryptographic receipts — (1) the exact character slice [start_idx, end_idx] of the submitted draft, and (2) the verbatim statutory text and clause number from the active policy corpus. If either receipt is missing or fails hash verification, the finding is automatically suppressed before reaching the user.",
  },
  {
    id: "sec-65b",
    icon: Scale,
    category: "Legal Admissibility",
    question: "How are Canon audit certificates legally admissible under Section 65B of the Indian Evidence Act?",
    answer:
      "Under Section 65B of the Indian Evidence Act, 1872 (and Section 63 of Bharatiya Sakshya Adhiniyam, 2023), electronic records require proof of system integrity. Canon logs every draft ingestion, OCR bounding box, rule evaluation, and human sign-off into an append-only SHA-256 Merkle chain. The platform generates one-click Section 65B Compliance Certificates signed with cryptographic timestamps, ready for immediate submission to ASCI, CCPA, or High Court arbitration.",
  },
  {
    id: "circuit-breaker",
    icon: Lock,
    category: "Enforcement",
    question: "How does the real-time Ad-Server Circuit Breaker prevent rogue campaign launches?",
    answer:
      "Canon connects directly to Meta Ads Graph API and Google Ads API via secure enterprise webhooks. When a creative is submitted to ad networks, our pre-flight proxy intercepts the creative payload. If a CRITICAL violation (such as surrogate alcohol cues or unauthorized financial return guarantees) is detected, Canon trips the circuit breaker, pausing the ad-set in < 15 seconds and preserving enterprise media budgets.",
  },
  {
    id: "agency-portal",
    icon: FileCheck,
    category: "Access Control",
    question: "Can external creative agencies submit drafts without viewing internal policy IP?",
    answer:
      "Yes. Canon provides an isolated 'Agency / Creator' tenant role. External agency partners can upload PSDs, PDFs, and Figma assets to run pre-flight scans and receive actionable remediation guidance. However, internal brand strategy documents, legal risk scores, and executive exception notes remain cryptographically masked behind Role-Based Access Controls (RBAC).",
  },
  {
    id: "vernacular-nlp",
    icon: Globe,
    category: "Localization",
    question: "How does the Vernacular NLP Radar detect surrogate marketing in Indic languages and Hinglish?",
    answer:
      "Surrogate brands frequently hide illicit liquor, tobacco, or gambling promotions behind colloquial Hindi and Hinglish phrases (e.g. 'Zindagi ka asli swad', 'Jeeto bina rukawat'). Canon features a specialized Indic Vernacular Radar trained on code-mixed phonetics, transliterations, and regional slang across 12 Indian languages to detect surrogate brand recall where traditional English-only models fail.",
  },
  {
    id: "backtesting",
    icon: HelpCircle,
    category: "Governance",
    question: "How does Policy Backtesting prevent new brand rules from breaking existing campaigns?",
    answer:
      "When a Brand Manager or General Counsel proposes a new rule (e.g., restricting medical terminology in cosmetic copy), Canon automatically backtests the rule against the enterprise's entire historical corpus of 5,000+ past approved creatives. The system produces an instant 'Blast Radius Report' detailing exactly how many live ads would be invalidated, preventing unexpected campaign freezes.",
  },
];

export function ComplianceFaqSection() {
  const [openIds, setOpenIds] = useState<string[]>(["double-receipt", "sec-65b"]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-md overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ENTERPRISE GOVERNANCE FAQ</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Statutory Architecture &amp; Enterprise Admissibility
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
            Detailed answers regarding our mathematical invariants, Section 65B evidence chains, and ad-server firewalls.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs self-start md:self-auto py-1">
          Indian Evidence Act • CPA 2019
        </Badge>
      </div>

      {/* Accordion List */}
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {FAQ_DATA.map((item) => {
          const isOpen = openIds.includes(item.id);
          const IconComponent = item.icon;

          return (
            <div key={item.id} className="transition-colors hover:bg-[var(--color-surface-muted)]/20">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                className="w-full p-5 md:p-6 text-left flex items-start md:items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-[var(--color-primary)]">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm md:text-base font-bold text-[var(--color-text-primary)] leading-snug">
                        {item.question}
                      </span>
                      <Badge variant="secondary" size="sm" className="text-[10px] font-mono py-0">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-[var(--color-primary)]" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 md:pl-[68px] md:pr-10 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface-muted)]/40 p-4 rounded-xl border border-[var(--color-border-subtle)]">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

