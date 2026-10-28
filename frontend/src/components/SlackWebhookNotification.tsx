"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  ArrowRight,
  Code2,
  ShieldCheck,
  Hash,
  Info,
  Layers,
  FileText,
  User,
  Radio,
  Key,
  Calendar,
  ExternalLink,
} from "lucide-react";

export interface WebhookPayloadData {
  event_id?: string;
  event_type?: string;
  created_at?: string;
  workspace?: {
    id: string;
    name: string;
    domain: string;
  };
  data?: {
    submission?: {
      id: string;
      title: string;
      channel: string;
      status: string;
    };
    decision?: string;
    reviewer?: {
      name: string;
      email: string;
      role: string;
    };
    justification?: string;
    certificate_reference?: string | null;
    verification_url?: string | null;
  };
  simulation_metadata?: {
    is_simulated: boolean;
    dispatched_by: string;
    destination_channel: string;
    target_endpoint: string;
  };
}

export interface WebhookDispatchResult {
  success: boolean;
  simulated: boolean;
  channel: string;
  headline: string;
  delivery_id: string;
  timestamp: string;
  headers: Record<string, string>;
  payload: WebhookPayloadData | Record<string, unknown>;
}

interface SlackWebhookNotificationProps {
  dispatchResult: WebhookDispatchResult | null;
  onDismiss: () => void;
}

type TabType = "payload" | "headers" | "metadata";

// Lightweight, zero-dependency JSON syntax highlighter with line numbers
function renderHighlightedJson(jsonStr: string) {
  const tokenRegex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  return jsonStr.split("\n").map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regex = new RegExp(tokenRegex);
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (/^"/.test(token)) {
        if (/:$/.test(token)) {
          // Key name
          parts.push(
            <span key={`${lineIndex}-${match.index}`} className="text-sky-400 font-semibold">
              {token.slice(0, -1)}
            </span>
          );
          parts.push(":");
        } else {
          // String value
          parts.push(
            <span key={`${lineIndex}-${match.index}`} className="text-emerald-400">
              {token}
            </span>
          );
        }
      } else if (/true|false/.test(token)) {
        // Boolean
        parts.push(
          <span key={`${lineIndex}-${match.index}`} className="text-purple-400 font-semibold">
            {token}
          </span>
        );
      } else if (/null/.test(token)) {
        // Null
        parts.push(
          <span key={`${lineIndex}-${match.index}`} className="text-slate-400 italic">
            {token}
          </span>
        );
      } else {
        // Number
        parts.push(
          <span key={`${lineIndex}-${match.index}`} className="text-amber-400">
            {token}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <div key={lineIndex} className="table-row">
        <span className="table-cell pr-4 text-slate-500 text-right select-none text-[11px] opacity-60">
          {lineIndex + 1}
        </span>
        <span className="table-cell whitespace-pre">{parts}</span>
      </div>
    );
  });
}

export function SlackWebhookNotification({
  dispatchResult,
  onDismiss,
}: SlackWebhookNotificationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("payload");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close drawer on Escape
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  if (!dispatchResult) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const payloadData = dispatchResult.payload as WebhookPayloadData;
  const isApproved =
    payloadData?.event_type === "submission.approved" ||
    payloadData?.data?.decision === "APPROVED";

  const campaignTitle =
    payloadData?.data?.submission?.title ||
    dispatchResult.headline ||
    "Marketing Submission";

  const reviewerName = payloadData?.data?.reviewer?.name;
  const certificateRef = payloadData?.data?.certificate_reference;
  const jsonString = JSON.stringify(dispatchResult.payload, null, 2);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SLACK-STYLE NOTIFICATION TOAST (TOP-RIGHT CORNER) */}
      {/* ========================================================================= */}
      <aside
        id="slack-notification-toast"
        aria-label="Simulated Slack Notification"
        className="fixed top-20 right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsDrawerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsDrawerOpen(true);
            }
          }}
          className={`relative bg-white text-slate-900 border rounded-2xl p-4 shadow-xl transition-all duration-200 cursor-pointer group hover:shadow-2xl hover:translate-y-[-1px] ${
            isApproved
              ? "border-emerald-200/90 shadow-emerald-950/5 hover:border-emerald-300"
              : "border-amber-200/90 shadow-amber-950/5 hover:border-amber-300"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#4A154B] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Hash className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold text-slate-800 tracking-tight">
                {dispatchResult.channel || "#brand-governance"}
              </span>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full">
                Simulated Slack
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">
                {new Date(dispatchResult.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                type="button"
                id="dismiss-toast-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex items-start gap-3 pt-3">
            <div className="mt-0.5 shrink-0">
              {isApproved ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {isApproved ? "Approved" : "Sent Back"}
                </span>

                {/* Show genuine certificate reference only if available */}
                {certificateRef && (
                  <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {certificateRef}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                {campaignTitle}
              </h4>

              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-slate-500">
                {reviewerName ? (
                  <span className="truncate">Reviewed by {reviewerName}</span>
                ) : (
                  <span>Review sign-off dispatched</span>
                )}

                <button
                  type="button"
                  id="slack-view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 cursor-pointer"
                >
                  <span>View details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. WEBHOOK PAYLOAD PANEL (PROFESSIONAL RIGHT-SIDE DRAWER) */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="webhook-drawer-title"
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="relative w-full max-w-full sm:max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300 ease-out text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Radio className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="webhook-drawer-title"
                      className="text-base font-bold text-slate-900"
                    >
                      Webhook Payload Panel
                    </h2>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Simulated 200 OK
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {dispatchResult.channel || "#brand-governance"} &bull; ID:{" "}
                    <span className="font-mono">{dispatchResult.delivery_id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-drawer-btn"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Notice Banner */}
            <div className="mx-6 mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">Simulated enterprise notification</span> — no real Slack message was sent.
                Event payload and HMAC-SHA256 signature were computed server-side to simulate enterprise pipelines.
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 mt-4 border-b border-slate-200 flex items-center gap-6">
              <button
                type="button"
                id="tab-json-payload"
                onClick={() => setActiveTab("payload")}
                className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === "payload"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>JSON Payload</span>
              </button>

              <button
                type="button"
                id="tab-headers"
                onClick={() => setActiveTab("headers")}
                className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === "headers"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Headers</span>
              </button>

              <button
                type="button"
                id="tab-metadata"
                onClick={() => setActiveTab("metadata")}
                className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeTab === "metadata"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Metadata</span>
              </button>
            </div>

            {/* Tab Contents (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* TAB 1: JSON PAYLOAD */}
              {activeTab === "payload" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Outbound Event Body
                    </span>
                    <button
                      type="button"
                      id="copy-json-btn"
                      onClick={() => handleCopy(jsonString, "json")}
                      className="text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedField === "json" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#0B1120] border border-slate-800 p-4 font-mono text-xs overflow-auto max-h-[calc(100vh-320px)] shadow-inner leading-relaxed text-slate-200">
                    <div className="table w-full">
                      {renderHighlightedJson(jsonString)}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HEADERS */}
              {activeTab === "headers" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      HTTP Request Headers
                    </span>
                    <button
                      type="button"
                      id="copy-signature-btn"
                      onClick={() =>
                        handleCopy(
                          dispatchResult.headers["X-Canon-Signature"] || "",
                          "signature"
                        )
                      }
                      className="text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedField === "signature" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied Signature</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Signature</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3.5">Header Name</th>
                          <th className="py-2.5 px-3.5">Header Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {Object.entries(dispatchResult.headers).map(([k, v]) => {
                          const isSig = k.toLowerCase() === "x-canon-signature";
                          return (
                            <tr
                              key={k}
                              className={`transition-colors ${
                                isSig ? "bg-blue-50/40" : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap align-top">
                                {k}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600 break-all select-all align-top">
                                <span className={isSig ? "text-blue-700 font-semibold" : ""}>
                                  {v}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      The <span className="font-mono font-semibold">X-Canon-Signature</span> header
                      was generated using server-side HMAC-SHA256 signing with the enterprise secret.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: METADATA */}
              {activeTab === "metadata" && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-semibold text-slate-700">
                    Dispatch Event Metadata
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Event Type
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {payloadData?.event_type || "submission.notification"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Delivery Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-emerald-700">
                          Delivered (Simulated 200 OK)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Timestamp (ISO / Local)
                      </span>
                      <span className="font-medium text-slate-800">
                        {new Date(dispatchResult.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {dispatchResult.timestamp}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Submission ID
                      </span>
                      <span className="font-mono font-semibold text-slate-900 truncate">
                        {payloadData?.data?.submission?.id || "N/A"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Campaign Title
                      </span>
                      <span className="font-medium text-slate-900 truncate">
                        {campaignTitle}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Reviewer
                      </span>
                      <span className="font-medium text-slate-900">
                        {reviewerName || "Rachel Reviewer"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {payloadData?.data?.reviewer?.email || "rachel@acmefinancial.com"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Compliance Certificate
                      </span>
                      {certificateRef ? (
                        <span className="font-mono font-semibold text-emerald-700">
                          {certificateRef}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None issued</span>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Destination Channel
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {dispatchResult.channel || "#brand-governance"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                id="footer-copy-json-btn"
                onClick={() => handleCopy(jsonString, "footer_json")}
                className="text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedField === "footer_json" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="footer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
