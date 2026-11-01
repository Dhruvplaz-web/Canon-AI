"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { WebhookLogEntry } from "./firewallTypes";

interface WebhookPayloadModalProps {
  log: WebhookLogEntry | null;
  onClose: () => void;
}

export function WebhookPayloadModal({ log, onClose }: WebhookPayloadModalProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CURL" | "REQUEST_JSON" | "RESPONSE_JSON">("CURL");

  if (!log) return null;

  const isMeta = log.service === "META_GRAPH_API";
  const isGoogle = log.service === "GOOGLE_ADS_API";

  // Generate realistic API bodies
  const curlCommand = isMeta
    ? `curl -X POST "${log.endpoint}" \\
  -H "Authorization: Bearer EAAX_CANON_ENTERPRISE_TOKEN_2026" \\
  -H "Content-Type: application/json" \\
  -H "X-Canon-Event-Signature: ${log.eventSignature}" \\
  -d '{
    "status": "PAUSED",
    "pause_reason": "CANON_STATUTORY_CIRCUIT_BREAKER_INTERCEPT",
    "regulatory_code": "CCPA-DARK-URGENCY-01",
    "intercept_timestamp": "${log.timestamp}"
  }'`
    : isGoogle
    ? `curl -X POST "${log.endpoint}" \\
  -H "Authorization: Bearer ya29.a0AfH6_CANON_GCP_TOKEN" \\
  -H "developer-token: CANON_PROD_DEV_TOKEN_v16" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operations": [
      {
        "update": {
          "resourceName": "customers/8412910391/campaigns/camp_google_festive_loans",
          "status": "PAUSED"
        },
        "updateMask": "status"
      }
    ]
  }'`
    : `curl -X POST "${log.endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "#legal-brand-safety",
    "username": "Canon Firewall Bot",
    "text": "🚨 EMERGENCY CIRCUIT BREAKER TRIPPED: Ad spend halted for regulatory breach.",
    "attachments": [
      {
        "color": "#EF4444",
        "title": "${log.payloadSummary}",
        "footer": "Canon AI Governance Engine",
        "ts": 1793539200
      }
    ]
  }'`;

  const requestJson = isMeta
    ? JSON.stringify(
        {
          campaign_id: "2385194820194",
          status: "PAUSED",
          pause_reason: "CANON_STATUTORY_CIRCUIT_BREAKER_INTERCEPT",
          rule_code: "CCPA-DARK-URGENCY-01",
          regulatory_act: "Consumer Protection Act 2019 Section 2(28)",
          penalties_averted_inr: 1000000,
          operator: "Canon Autonomous Firewall Engine",
          signature: log.eventSignature,
        },
        null,
        2
      )
    : isGoogle
    ? JSON.stringify(
        {
          customerId: "8412910391",
          operations: [
            {
              update: {
                resourceName: "customers/8412910391/campaigns/94820194",
                status: "PAUSED",
              },
              updateMask: "status",
            },
          ],
          partialFailure: false,
          validateOnly: false,
        },
        null,
        2
      )
    : JSON.stringify(
        {
          channel: "#legal-brand-safety",
          event: "CIRCUIT_BREAKER_DISPATCH",
          summary: log.payloadSummary,
          timestamp: log.timestamp,
        },
        null,
        2
      );

  const responseJson = JSON.stringify(
    {
      success: true,
      statusCode: log.status,
      latencyMs: log.latencyMs,
      upstreamService: log.service,
      result: {
        campaignStatus: "PAUSED",
        mutationApplied: true,
        adDeliveryState: "MUTED",
        auditTraceId: `tr_${log.id}`,
      },
    },
    null,
    2
  );

  const handleCopy = (content: string, type: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopiedTab(type);
      setTimeout(() => setCopiedTab(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-slate-800 text-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {log.service} Intercept Telemetry
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                  HTTP {log.status} OK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {log.method} {log.endpoint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Latency & Event Metrics Row */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">API Latency:</span>
            <span className="text-emerald-400 font-bold">{log.latencyMs} ms</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Event Signature:</span>
            <span className="text-slate-300 font-bold truncate block">{log.eventSignature}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Execution Timestamp:</span>
            <span className="text-slate-300 font-bold">{log.timestamp.slice(11, 23)}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("CURL")}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                activeTab === "CURL"
                  ? "bg-emerald-500 text-black font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              cURL Command
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REQUEST_JSON")}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                activeTab === "REQUEST_JSON"
                  ? "bg-emerald-500 text-black font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Request JSON
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RESPONSE_JSON")}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                activeTab === "RESPONSE_JSON"
                  ? "bg-emerald-500 text-black font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Response JSON
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const text =
                activeTab === "CURL"
                  ? curlCommand
                  : activeTab === "REQUEST_JSON"
                  ? requestJson
                  : responseJson;
              handleCopy(text, activeTab);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Payload Terminal Viewer */}
        <div className="p-3.5 rounded-xl bg-black border border-slate-800/80 max-h-56 overflow-y-auto text-slate-300 leading-relaxed text-[11px] select-all">
          <pre className="whitespace-pre-wrap font-mono">
            {activeTab === "CURL"
              ? curlCommand
              : activeTab === "REQUEST_JSON"
              ? requestJson
              : responseJson}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Official API Mutate payload delivered via Canon Webhook Dispatcher</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
