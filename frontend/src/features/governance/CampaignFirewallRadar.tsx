"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RotateCcw,
  Printer,
  CheckCircle2,
  ExternalLink,
  Flame,
  ArrowRight,
  Sparkles,
  Layers,
  Radio,
  FileText,
  X,
  Play,
  Pause,
  Terminal,
  Activity,
  Plus,
  Send,
  Sliders,
  DollarSign,
  TrendingDown,
  Building2,
  Download,
} from "lucide-react";
import {
  FirewallCampaign,
  FirewallTelemetrySummary,
  CircuitBreakerResult,
  WebhookLogEntry,
  AdNetwork,
} from "./firewall/firewallTypes";
import {
  INITIAL_FIREWALL_CAMPAIGNS,
  INITIAL_FIREWALL_TELEMETRY,
  INITIAL_WEBHOOK_LOGS,
} from "./firewall/firewallFixtures";
import {
  executeCircuitBreaker,
  resumeRemediatedCampaign,
  generateEmergencyAttestation,
} from "./firewall/firewallEngine";
import { auditVernacularCopy } from "@/features/submissions/vernacular/vernacularAuditEngine";

export function CampaignFirewallRadar() {
  const [campaigns, setCampaigns] = useState<FirewallCampaign[]>(INITIAL_FIREWALL_CAMPAIGNS);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogEntry[]>(INITIAL_WEBHOOK_LOGS);
  const [selectedAttestationCampaign, setSelectedAttestationCampaign] =
    useState<FirewallCampaign | null>(null);
  const [networkFilter, setNetworkFilter] = useState<"ALL" | AdNetwork | "PAUSED">("ALL");

  // Real-time ticking stream state
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [activeTabConsole, setActiveTabConsole] = useState<
    "ALL" | "META" | "GOOGLE" | "SLACK"
  >("ALL");
  const [isConsoleExpanded, setIsConsoleExpanded] = useState<boolean>(true);

  // Custom Ad Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("Weekend Festive Flash Sale");
  const [customNetwork, setCustomNetwork] = useState<AdNetwork>("META_ADS");
  const [customBudget, setCustomBudget] = useState<number>(350000);
  const [customHeadline, setCustomHeadline] = useState<string>(
    "Chutki Me 5 Lakh Cash! Bina Kisi Document Ke"
  );
  const [customBody, setCustomBody] = useState<string>(
    "Arey bhai! Sirf aadhaar card do aur 2 minute me chutki me 5 lakh instant loan lo! 100% pakka guarantee!"
  );

  // In-line remediation draft state per campaign
  const [remediationDrafts, setRemediationDrafts] = useState<Record<string, string>>({});
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Derive telemetry metrics directly from campaigns via useMemo
  const telemetry: FirewallTelemetrySummary = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "ACTIVE_RUNNING").length;
    const paused = campaigns.filter((c) => c.status === "PAUSED_BY_CANON_FIREWALL").length;
    const liveHourly = campaigns
      .filter((c) => c.status === "ACTIVE_RUNNING")
      .reduce((sum, c) => sum + c.hourlySpendInr, 0);
    const protectedMedia = campaigns.reduce(
      (sum, c) => sum + (c.protectedSpendInr || 0),
      0
    );
    const avoidedPenalties = paused * 1000000; // ₹10 Lakhs statutory fine per paused ad
    const totalAverted = protectedMedia + avoidedPenalties;

    return {
      connectedNetworksCount: 2,
      totalActiveCampaigns: active,
      totalPausedCampaigns: paused,
      currentLiveHourlySpendInr: liveHourly,
      totalProtectedAdSpendInr: protectedMedia,
      totalAvoidedStatutoryPenaltiesInr: avoidedPenalties,
      totalCorporateLiabilityAvertedInr: totalAverted,
      interceptionLatencyMs: 11.4,
    };
  }, [campaigns]);

  // Real-time spend ticker effect (ticking every 1.5 seconds)
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.status === "ACTIVE_RUNNING") {
            const addedSpend = Math.round((c.hourlySpendInr / 3600) * 1.5);
            const addedImpressions = Math.round(15 + Math.random() * 20);
            return {
              ...c,
              burnedSpendInr: c.burnedSpendInr + addedSpend,
              impressionsDelivered: c.impressionsDelivered + addedImpressions,
            };
          }
          return c;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  const handleTripCircuitBreaker = (campaignId: string) => {
    setIsProcessingId(campaignId);
    setTimeout(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            const { updatedCampaign, result } = executeCircuitBreaker(c);
            setWebhookLogs((logs) => [...result.webhookLogs, ...logs]);
            return updatedCampaign;
          }
          return c;
        })
      );
      setIsProcessingId(null);
    }, 200);
  };

  const handleResumeCampaign = (campaignId: string) => {
    setIsProcessingId(campaignId);
    setTimeout(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            const customDraft = remediationDrafts[campaignId];
            const campaignToResume = customDraft
              ? { ...c, remediatedCopy: customDraft }
              : c;
            const { updatedCampaign, result } = resumeRemediatedCampaign(campaignToResume);
            setWebhookLogs((logs) => [...result.webhookLogs, ...logs]);
            return updatedCampaign;
          }
          return c;
        })
      );
      setIsProcessingId(null);
    }, 200);
  };

  const handleSimulateSurrogateLaunch = () => {
    handleTripCircuitBreaker("camp_meta_royal_soda");
  };

  const handleSimulateFintechSurge = () => {
    handleTripCircuitBreaker("camp_meta_diwali_loans");
  };

  const handleTripAllViolations = () => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.detectedInfraction && c.status === "ACTIVE_RUNNING") {
          const { updatedCampaign, result } = executeCircuitBreaker(c);
          setWebhookLogs((logs) => [...result.webhookLogs, ...logs]);
          return updatedCampaign;
        }
        return c;
      })
    );
  };

  const handleResetBaseline = () => {
    setCampaigns(INITIAL_FIREWALL_CAMPAIGNS);
    setWebhookLogs(INITIAL_WEBHOOK_LOGS);
    setRemediationDrafts({});
  };

  const handleExportTelemetryJson = () => {
    const exportPayload = {
      standard: "RBI Master Direction / ASCI Guidelines / CCPA Misleading Ads Act",
      engine: "Canon Ad-Spend Risk Radar & Programmatic Campaign Firewall v3.2",
      generatedAt: new Date().toISOString(),
      telemetrySummary: telemetry,
      interceptionMetrics: {
        interceptionLatencyMs: telemetry.interceptionLatencyMs,
        totalAvoidedStatutoryPenaltiesInr: telemetry.totalAvoidedStatutoryPenaltiesInr,
        totalCorporateLiabilityAvertedInr: telemetry.totalCorporateLiabilityAvertedInr,
        protectedMediaSpendInr: telemetry.totalProtectedAdSpendInr,
      },
      activeIncidents: campaigns.map((c) => ({
        campaignId: c.id,
        name: c.name,
        network: c.network,
        status: c.status,
        hourlySpendInr: c.hourlySpendInr,
        burnedSpendInr: c.burnedSpendInr,
        protectedSpendInr: c.protectedSpendInr,
        statutoryFineExposureInr: c.detectedInfraction?.penaltyExposureInr || 0,
        infraction: c.detectedInfraction,
      })),
      auditLogs: webhookLogs,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canon-firewall-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add Custom Campaign Handler
  const handleAddCustomCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    // Audit the custom copy using our Vernacular/Statutory Audit Engine!
    const combinedCopy = `${customHeadline} ${customBody}`;
    const auditReport = auditVernacularCopy(combinedCopy);

    let infraction = null;
    if (auditReport.findings.length > 0) {
      const topFinding = auditReport.findings[0];
      infraction = {
        ruleCode: topFinding.ruleCode,
        ruleTitle: topFinding.ruleTitle,
        statutoryAct: topFinding.statutoryCitation,
        penaltyExposureInr: topFinding.statutoryPenaltyExposureInr,
        explanation: topFinding.detectedViolationExplanation,
        matchedText: topFinding.sourceTextSpan,
      };
    }

    const hourlySpend = Math.round(customBudget / 24);
    const newCamp: FirewallCampaign = {
      id: `camp_custom_${Date.now()}`,
      name: customName,
      network: customNetwork,
      networkAccountId:
        customNetwork === "META_ADS" ? "act_9381029410" : "841-291-0391",
      campaignIdExternal: `cust_camp_${Date.now().toString(36)}`,
      status: infraction ? "ACTIVE_RUNNING" : "COMPLIANT_VERIFIED",
      dailyBudgetInr: customBudget,
      hourlySpendInr: hourlySpend,
      burnedSpendInr: 12000,
      impressionsDelivered: 45000,
      liveHours: 1.0,
      creative: {
        headline: customHeadline,
        bodyCopy: customBody,
        cta: "Apply / Order Now",
        landingUrl: "https://acme-custom.in/campaign",
        channel: customNetwork === "META_ADS" ? "Instagram Reels" : "Google Search",
      },
      detectedInfraction: infraction,
      remediatedCopy: auditReport.remediatedText || "Compliant commercial copy approved.",
      protectedSpendInr: infraction ? customBudget - 12000 : 0,
      isCustomCampaign: true,
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setIsCustomModalOpen(false);

    // If it has an infraction, log an incident
    if (infraction) {
      const logEntry: WebhookLogEntry = {
        id: `log_cust_${Date.now()}`,
        timestamp: new Date().toISOString(),
        service: customNetwork === "META_ADS" ? "META_GRAPH_API" : "GOOGLE_ADS_API",
        endpoint: `https://${customNetwork === "META_ADS" ? "graph.facebook.com" : "googleads.googleapis.com"}/api/v1/ad_sets`,
        method: "POST",
        status: 200,
        latencyMs: 9.8,
        payloadSummary: `New campaign '${customName}' queued. Circuit breaker ARMED on [${infraction.ruleCode}].`,
        eventSignature: `SHA256:cust_${Date.now().toString(36)}`,
      };
      setWebhookLogs((logs) => [logEntry, ...logs]);
    }
  };

  const filteredCampaigns = useMemo(() => {
    if (networkFilter === "ALL") return campaigns;
    if (networkFilter === "PAUSED")
      return campaigns.filter((c) => c.status === "PAUSED_BY_CANON_FIREWALL");
    return campaigns.filter((c) => c.network === networkFilter);
  }, [campaigns, networkFilter]);

  const filteredLogs = useMemo(() => {
    if (activeTabConsole === "ALL") return webhookLogs;
    if (activeTabConsole === "META")
      return webhookLogs.filter((l) => l.service === "META_GRAPH_API");
    if (activeTabConsole === "GOOGLE")
      return webhookLogs.filter((l) => l.service === "GOOGLE_ADS_API");
    if (activeTabConsole === "SLACK")
      return webhookLogs.filter(
        (l) => l.service === "SLACK_INCIDENT" || l.service === "PAGERDUTY"
      );
    return webhookLogs;
  }, [webhookLogs, activeTabConsole]);

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header & Network Status Banner */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                Round 3 Feature 3
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Meta Marketing API v19.0 &amp; Google Ads v16
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Intercept Latency &lt;12ms
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Programmatic Ad-Spend Risk Radar &amp; Campaign Firewall
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Real-time webhook circuit breakers auto-pausing live campaigns across Meta Ads and Google Ads before statutory fines and brand damage escalate.
            </p>
          </div>

          {/* Quick Simulation Trigger Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
                isLiveStreamActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isLiveStreamActive ? "Live Stream: Active" : "Stream: Paused"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportTelemetryJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-blue-500 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Export Telemetry (JSON)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>Test Custom Ad</span>
            </button>
            <button
              type="button"
              onClick={handleResetBaseline}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleTripAllViolations}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white dark:bg-rose-500 transition-all shadow-2xs hover:bg-rose-700"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trip All Circuit Breakers</span>
            </button>
          </div>
        </div>

        {/* Connected Networks Status Bar */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[var(--color-text-primary)]">Meta Ads:</span>
              <span className="text-[var(--color-text-muted)]">act_9381029410 (LIVE)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[var(--color-text-primary)]">Google Ads:</span>
              <span className="text-[var(--color-text-muted)]">841-291-0391 (LIVE)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[var(--color-text-primary)]">Slack Alerts:</span>
              <span className="text-[var(--color-text-muted)]">#legal-brand-safety (ARMED)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Circuit Breaker Webhook: ARMED (Auto-Pause Enabled)</span>
          </div>
        </div>
      </div>

      {/* CMO Financial Risk Radar Matrix (4 High-Impact Pillars) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liability Averted */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] uppercase font-mono font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <span>Corporate Liability Averted</span>
            <Sparkles className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {formatInr(telemetry.totalCorporateLiabilityAvertedInr)}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
            {formatInr(telemetry.totalProtectedAdSpendInr)} media + {formatInr(telemetry.totalAvoidedStatutoryPenaltiesInr)} fines
          </div>
        </div>

        {/* Live Hourly Burn Rate */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="text-[10px] uppercase font-mono font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
            <span>Live Hourly Spend Pacing</span>
            <Flame className="w-3 h-3 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text-primary)]">
            {formatInr(telemetry.currentLiveHourlySpendInr)}/hr
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)]">
            Active burn across {telemetry.totalActiveCampaigns} ad sets
          </div>
        </div>

        {/* Circuit Breakers Tripped */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
          <div className="text-[10px] uppercase font-mono font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>Circuit Breakers Tripped</span>
            <Zap className="w-3 h-3 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">
            {telemetry.totalPausedCampaigns} Paused
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
            Sub-12ms programmatic halt
          </div>
        </div>

        {/* Interception Speed SLA */}
        <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="text-[10px] uppercase font-mono font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
            <span>Programmatic Latency</span>
            <Radio className="w-3 h-3 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {telemetry.interceptionLatencyMs} ms
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)]">
            Edge webhook SLA &lt;50ms
          </div>
        </div>
      </div>

      {/* 1-Click Regulatory Attack Simulation Bar */}
      <div className="p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-2">
        <div className="text-[11px] font-mono uppercase text-[var(--color-text-muted)] font-semibold flex items-center justify-between">
          <span>1-Click Live Regulatory Attack Simulations</span>
          <span className="text-[10px] text-blue-500 lowercase">Click any trigger to test instant halt</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSimulateSurrogateLaunch}
            className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                ⚡ Simulate Alcobev Surrogate Ad Launch (Meta Ads)
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                ASCI Ch. III
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Simulates live injection of Royal Challenge Club Soda ad on Instagram Stories. Tests immediate Meta Graph API pause dispatch.
            </p>
          </button>

          <button
            type="button"
            onClick={handleSimulateFintechSurge}
            className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                ⚡ Simulate Predatory FinTech Credit Surge (Instagram Reels)
              </span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                RBI-VERN-01
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Simulates live unvetted &ldquo;bina document loan chutki me&rdquo; campaign. Tests automated pause preserving ₹3,93,750 spend.
            </p>
          </button>
        </div>
      </div>

      {/* Expandable Live Webhook Console & Telemetry Stream */}
      <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white tracking-wide text-xs">
              Live Programmatic Webhook Telemetry Stream
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              HTTP 200 OK
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 bg-slate-900 rounded-lg text-[10px] border border-slate-800">
              {(["ALL", "META", "GOOGLE", "SLACK"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTabConsole(tab)}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    activeTabConsole === tab
                      ? "bg-emerald-500 text-black font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
              className="text-[10px] text-slate-400 hover:text-white underline decoration-dotted ml-2"
            >
              {isConsoleExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {isConsoleExpanded && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px]">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-1 rounded text-[10px] font-bold ${
                        log.service === "META_GRAPH_API"
                          ? "bg-blue-500/20 text-blue-400"
                          : log.service === "GOOGLE_ADS_API"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {log.service}
                    </span>
                    <span className="text-slate-400 text-[10px]">{log.timestamp.slice(11, 19)}</span>
                    <span className="text-emerald-400 font-bold">{log.method}</span>
                    <span className="text-slate-300 truncate max-w-xs">{log.endpoint}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] line-clamp-1">
                    {log.payloadSummary}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[10px]">
                  <span className="text-emerald-400 font-bold">{log.latencyMs}ms</span>
                  <span className="text-slate-500">{log.eventSignature}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs for Campaigns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-xl text-xs font-mono">
          <button
            type="button"
            onClick={() => setNetworkFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkFilter === "ALL"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black font-bold shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            All Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setNetworkFilter("META_ADS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkFilter === "META_ADS"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black font-bold shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Meta Ads ({campaigns.filter((c) => c.network === "META_ADS").length})
          </button>
          <button
            type="button"
            onClick={() => setNetworkFilter("GOOGLE_ADS")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkFilter === "GOOGLE_ADS"
                ? "bg-[#111111] text-white dark:bg-white dark:text-black font-bold shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Google Ads ({campaigns.filter((c) => c.network === "GOOGLE_ADS").length})
          </button>
          <button
            type="button"
            onClick={() => setNetworkFilter("PAUSED")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkFilter === "PAUSED"
                ? "bg-rose-600 text-white font-bold shadow-xs"
                : "text-rose-600 dark:text-rose-400 hover:text-rose-700"
            }`}
          >
            Paused Breaches ({campaigns.filter((c) => c.status === "PAUSED_BY_CANON_FIREWALL").length})
          </button>
        </div>

        <div className="text-xs font-mono text-[var(--color-text-muted)]">
          Live Run-Rate: {formatInr(telemetry.currentLiveHourlySpendInr)}/hr
        </div>
      </div>

      {/* Monitored Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCampaigns.map((camp) => {
          const isPaused = camp.status === "PAUSED_BY_CANON_FIREWALL";
          const isCompliant = camp.status === "COMPLIANT_VERIFIED";
          const isProcessing = isProcessingId === camp.id;
          const currentDraft =
            remediationDrafts[camp.id] !== undefined
              ? remediationDrafts[camp.id]
              : camp.remediatedCopy || "";

          return (
            <div
              key={camp.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isPaused
                  ? "bg-rose-500/5 border-rose-500/40 shadow-xs ring-1 ring-rose-500/20"
                  : isCompliant
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
              }`}
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      {camp.network === "META_ADS" ? "Meta Ads" : "Google Ads"}
                    </span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {camp.networkAccountId}
                    </span>
                    {camp.isCustomCampaign && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Custom User Ad
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {camp.name}
                  </h4>
                </div>

                {/* Status Pill */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-1.5 ${
                    isPaused
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      : isCompliant
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPaused
                        ? "bg-rose-500"
                        : isCompliant
                        ? "bg-emerald-500"
                        : "bg-blue-500 animate-pulse"
                    }`}
                  />
                  <span>
                    {isPaused
                      ? "PAUSED (CANON FIREWALL)"
                      : isCompliant
                      ? "COMPLIANT & RUNNING"
                      : "ACTIVE RUNNING"}
                  </span>
                </span>
              </div>

              {/* Spend & Impressions Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Daily Budget</div>
                  <div className="font-bold text-[var(--color-text-primary)]">
                    {formatInr(camp.dailyBudgetInr)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Hourly Spend</div>
                  <div className="font-bold text-[var(--color-text-primary)]">
                    {isPaused ? "₹0/hr (FROZEN)" : `${formatInr(camp.hourlySpendInr)}/hr`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Burned / Saved</div>
                  <div
                    className={`font-bold ${
                      isPaused
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {isPaused
                      ? `${formatInr(camp.protectedSpendInr || 0)} Saved`
                      : `${formatInr(camp.burnedSpendInr)} Spent`}
                  </div>
                </div>
              </div>

              {/* Creative Copy Box */}
              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1 text-xs">
                <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] flex items-center justify-between">
                  <span>Ad Creative ({camp.creative.channel})</span>
                  <span className="text-[10px] font-sans text-blue-500">{camp.creative.landingUrl}</span>
                </div>
                <div className="font-bold text-[var(--color-text-primary)]">
                  {camp.creative.headline}
                </div>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {camp.creative.bodyCopy}
                </p>
              </div>

              {/* Statutory Infraction Box if Flagged */}
              {camp.detectedInfraction && (
                <div
                  className={`p-3 rounded-xl border space-y-2 text-xs ${
                    isPaused
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      [{camp.detectedInfraction.ruleCode}] {camp.detectedInfraction.ruleTitle}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatInr(camp.detectedInfraction.penaltyExposureInr)} Fine
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {camp.detectedInfraction.explanation}
                  </p>
                  <div className="p-1.5 rounded bg-black/10 text-[10px] font-mono">
                    <span className="opacity-70">Flagged Substring:</span> &ldquo;
                    {camp.detectedInfraction.matchedText}&rdquo;
                  </div>
                </div>
              )}

              {/* In-Line Remediation Studio when Paused */}
              {isPaused && (
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      Canon Automated Legal Remediation
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Statutory Clearance
                    </span>
                  </div>

                  <textarea
                    value={currentDraft}
                    onChange={(e) =>
                      setRemediationDrafts((prev) => ({
                        ...prev,
                        [camp.id]: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] font-sans text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    placeholder="Refine compliant copy before re-activation..."
                  />
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    Pushes updated creative directly to {camp.network === "META_ADS" ? "Meta Graph API" : "Google Ads API"} upon resumption.
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                {isPaused ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedAttestationCampaign(camp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-500" />
                      <span>Cease &amp; Desist Attestation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResumeCampaign(camp.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 hover:bg-emerald-700 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Re-Activating..." : "Approve & Re-Activate"}</span>
                    </button>
                  </>
                ) : isCompliant ? (
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Statutory Disclaimers Cleared • Zero Risk Running</span>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Pending Statutory Audit Intercept
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTripCircuitBreaker(camp.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Pausing API..." : "Trip Circuit Breaker"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Ad Campaign Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Add Custom Ad Campaign to Live Radar
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Test your own creative text against Canon&apos;s live programmatic circuit breaker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomCampaign} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="custom-camp-name" className="font-semibold text-[var(--color-text-secondary)]">Campaign Name</label>
                <input
                  id="custom-camp-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="custom-ad-network" className="font-semibold text-[var(--color-text-secondary)]">Ad Network</label>
                  <select
                    id="custom-ad-network"
                    value={customNetwork}
                    onChange={(e) => setCustomNetwork(e.target.value as AdNetwork)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="META_ADS">Meta Ads (Instagram / FB)</option>
                    <option value="GOOGLE_ADS">Google Ads (Search / YouTube)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="custom-daily-budget" className="font-semibold text-[var(--color-text-secondary)]">Daily Budget (₹ INR)</label>
                  <input
                    id="custom-daily-budget"
                    type="number"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="custom-ad-headline" className="font-semibold text-[var(--color-text-secondary)]">Ad Headline</label>
                <input
                  id="custom-ad-headline"
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="custom-ad-body" className="font-semibold text-[var(--color-text-secondary)]">
                  Ad Body Copy (Hinglish or English)
                </label>
                <textarea
                  id="custom-ad-body"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-black text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Queue in Live Radar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Cease & Desist Attestation Modal */}
      {selectedAttestationCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    EMERGENCY CEASE &amp; DESIST INTERCEPT
                  </span>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    SHA-256 Ledger Signature
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                  Programmatic Ad-Spend Freeze &amp; Legal Attestation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttestationCampaign(null)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
              {generateEmergencyAttestation(selectedAttestationCampaign)}
            </pre>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Programmatic legal receipt logged into Canon Immutable Audit Ledger
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAttestationCampaign(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-black text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
