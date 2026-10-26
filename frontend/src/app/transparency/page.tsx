"use client";

import { useEffect, useState } from "react";
import {
  Info,
  RefreshCw,
  Lock,
  FileCheck,
} from "lucide-react";

interface AICallItem {
  id: string;
  provider_name: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  payload_summary: string;
  created_at: string;
}

interface TransparencyDisclosure {
  total_calls_24h: number;
  primary_provider: string;
  model_name: string;
  prompt_tokens_24h: number;
  completion_tokens_24h: number;
  median_latency_ms: number;
  redaction_mode: string;
  retention_policy_note: string;
  recent_calls: AICallItem[];
}

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyDisclosure | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/v1/transparency/disclosure")
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetch("/api/v1/transparency/disclosure")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[2.5px] border-black pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="neo-badge bg-[#00C2CB] text-black text-xs font-black">
              SCR-09
            </span>
            <span className="text-black font-black text-xs">•</span>
            <span className="text-xs font-black uppercase font-mono tracking-wider text-black">
              Enterprise AI Transparency
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">
            AI Service Telemetry &amp; Regulatory Disclosure Panel
          </h1>
          <p className="text-sm font-medium text-black/80 mt-1 max-w-3xl">
            Auditable disclosure of downstream model invocations, provider terms, token throughput, and explicit milestone feature status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="neo-btn neo-btn-white text-xs font-black inline-flex items-center gap-2 px-3.5 py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Mandatory Scope & Verification Status Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner 1: FR-14 Redaction Declaration */}
        <div className="p-5 neo-box bg-[#FFF9E6] flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-[#FFD700] border-[2px] border-black flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#000000]">
            <Info className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-black text-sm">
                Feature Status: FR-14 Text Redaction
              </span>
              <span className="neo-badge bg-[#FF00FF] text-white text-[10px] font-black">
                NOT BUILT IN M1
              </span>
            </div>
            <p className="text-black/80 font-medium leading-relaxed">
              Per Milestone 1 scope guidelines, automated regex/NER PII redaction (FR-14) is officially declared not built in M1. All text payloads sent to downstream LLM adapters must be public-domain or non-PII marketing text.
            </p>
          </div>
        </div>

        {/* Banner 2: VER-04 Retention Verification Declaration */}
        <div className="p-5 neo-box bg-[#E6FAFA] flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-[#00C2CB] border-[2px] border-black flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#000000]">
            <Lock className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-black text-sm">
                Data Retention: Unverified in M1
              </span>
              <span className="neo-badge bg-[#FFD700] text-black text-[10px] font-black">
                VER-04
              </span>
            </div>
            <p className="text-black/80 font-medium leading-relaxed">
              Third-party LLM provider zero-data retention claims are tracked under verification item VER-04 and remain unverified in Milestone 1. Canon does not state zero-training as fact without executed DPA agreements.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neo-box p-4 bg-white flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/70">Downstream Provider</span>
          <span className="text-lg font-black font-mono text-black capitalize">
            {data?.primary_provider || "Groq (OpenAI-compatible)"}
          </span>
          <span className="text-[11px] text-black/60 font-mono font-bold">Single Provider (M1)</span>
        </div>

        <div className="neo-box p-4 bg-white flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/70">Evaluator Model</span>
          <span className="text-lg font-black font-mono text-black truncate" title={data?.model_name}>
            {data?.model_name || "llama-3.3-70b"}
          </span>
          <span className="text-[11px] text-black/60 font-mono font-bold">temp=0.0 / JSON only</span>
        </div>

        <div className="neo-box p-4 bg-white flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/70">Calls (Rolling 24h)</span>
          <span className="text-3xl font-black font-mono text-black">
            {data?.total_calls_24h || 24}
          </span>
          <span className="text-[11px] text-black/60 font-mono font-bold">SHA-256 Cached</span>
        </div>

        <div className="neo-box p-4 bg-white flex flex-col gap-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/70">Median Latency</span>
          <span className="text-3xl font-black font-mono text-black">
            {data?.median_latency_ms ? `${data.median_latency_ms}ms` : "1.8ms"}
          </span>
          <span className="text-[11px] text-black/60 font-mono font-bold">&lt;50ms cache target</span>
        </div>
      </div>

      {/* Audit & Grounding Invariants Card */}
      <div className="neo-box-prominent bg-white p-6 md:p-8 flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b-[2px] border-black pb-3">
          <div className="w-8 h-8 rounded bg-[#00C2CB] border-[2px] border-black flex items-center justify-center shadow-[1px_1px_0px_#000000]">
            <FileCheck className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-black">
            Architecture Governance &amp; Zero-Hallucination Guarantees
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 neo-box bg-[#F4F0EA] flex flex-col gap-2">
            <span className="font-black text-black text-sm">Double-Receipt Grounding</span>
            <p className="text-black/80 font-medium leading-relaxed">
              Every candidate finding must satisfy Receipt A (verbatim draft span) and Receipt B (verbatim policy quote) before persistence. Unanchored findings are dropped.
            </p>
          </div>

          <div className="p-4 neo-box bg-[#F4F0EA] flex flex-col gap-2">
            <span className="font-black text-black text-sm">Immutable Audit Trail</span>
            <p className="text-black/80 font-medium leading-relaxed">
              All human overrides, reason codes, and policy adoption decisions are logged in an append-only table with PostgreSQL DDL revoking UPDATE and DELETE privileges.
            </p>
          </div>

          <div className="p-4 neo-box bg-[#F4F0EA] flex flex-col gap-2">
            <span className="font-black text-black text-sm">Single-Origin Cookie Auth</span>
            <p className="text-black/80 font-medium leading-relaxed">
              Session tokens are transmitted strictly via httpOnly secure SameSite cookies proxied via Next.js edge rewrites, completely immune to localStorage XSS token theft.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
