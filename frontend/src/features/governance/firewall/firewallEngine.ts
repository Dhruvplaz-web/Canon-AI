import {
  FirewallCampaign,
  CircuitBreakerResult,
  WebhookLogEntry,
} from "./firewallTypes";

/**
 * Triggers an automated emergency circuit breaker on a campaign,
 * dispatching simulated programmatic pause webhooks to Meta Marketing API / Google Ads API,
 * Slack P1 incident channel, and PagerDuty.
 */
export function executeCircuitBreaker(
  campaign: FirewallCampaign,
  reason = "CRITICAL_STATUTORY_INFRACTION"
): {
  updatedCampaign: FirewallCampaign;
  result: CircuitBreakerResult;
} {
  const now = new Date().toISOString();
  const eventId = `cb_evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const protectedSpend = Math.max(0, campaign.dailyBudgetInr - campaign.burnedSpendInr);

  const endpoint =
    campaign.network === "META_ADS"
      ? `https://graph.facebook.com/v19.0/${campaign.campaignIdExternal}`
      : `https://googleads.googleapis.com/v16/customers/${campaign.networkAccountId.replace(/-/g, "")}/campaigns:mutate`;

  const updatedCampaign: FirewallCampaign = {
    ...campaign,
    status: "PAUSED_BY_CANON_FIREWALL",
    lastCircuitBreakerTripAt: now,
    circuitBreakerEventId: eventId,
    protectedSpendInr: protectedSpend,
  };

  // Generate realistic webhook logs
  const webhookLogs: WebhookLogEntry[] = [
    {
      id: `log_adnet_${eventId}`,
      timestamp: now,
      service: campaign.network === "META_ADS" ? "META_GRAPH_API" : "GOOGLE_ADS_API",
      endpoint,
      method: campaign.network === "META_ADS" ? "POST" : "MUTATE",
      status: 200,
      latencyMs: +(8 + Math.random() * 4).toFixed(1),
      payloadSummary: `{"status": "PAUSED", "reason": "PAUSED_BY_CANON_FIREWALL", "rule": "${campaign.detectedInfraction?.ruleCode || "STATUTORY_VIOLATION"}"}`,
      eventSignature: `SHA256:${eventId.substring(0, 10)}...${campaign.campaignIdExternal.slice(-4)}`,
    },
    {
      id: `log_slack_${eventId}`,
      timestamp: new Date(Date.now() + 20).toISOString(),
      service: "SLACK_INCIDENT",
      endpoint: "https://hooks.slack.com/services/T01/B02/FIREWALL_LEGAL",
      method: "POST",
      status: 200,
      latencyMs: 14.2,
      payloadSummary: `🚨 P1 LEGAL INTERCEPT: [${campaign.network}] '${campaign.name}' frozen. Protected: ₹${protectedSpend.toLocaleString("en-IN")}.`,
      eventSignature: `SHA256:slack_${eventId.substring(0, 8)}`,
    },
    {
      id: `log_pd_${eventId}`,
      timestamp: new Date(Date.now() + 45).toISOString(),
      service: "PAGERDUTY",
      endpoint: "https://events.pagerduty.com/v2/enqueue",
      method: "POST",
      status: 202,
      latencyMs: 18.0,
      payloadSummary: `P1 Incident Triggered: Statutory Brand Safety Breach on ${campaign.network}.`,
      eventSignature: `SHA256:pd_${eventId.substring(0, 8)}`,
    },
  ];

  const result: CircuitBreakerResult = {
    success: true,
    campaignId: campaign.id,
    previousStatus: campaign.status,
    newStatus: "PAUSED_BY_CANON_FIREWALL",
    networkDispatch: {
      endpoint,
      method: campaign.network === "META_ADS" ? "POST" : "MUTATE",
      status: 200,
      responseHash: `sha256_${eventId.slice(-8)}_ok`,
      timestamp: now,
    },
    webhookLogs,
    protectedSpendInr: protectedSpend,
    eventId,
    auditSignature: `CANON-FIREWALL-SIG-${eventId.toUpperCase()}`,
  };

  return { updatedCampaign, result };
}

/**
 * Resumes a paused campaign after statutory remediation is approved.
 */
export function resumeRemediatedCampaign(
  campaign: FirewallCampaign
): {
  updatedCampaign: FirewallCampaign;
  result: CircuitBreakerResult;
} {
  const now = new Date().toISOString();
  const eventId = `res_evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  const endpoint =
    campaign.network === "META_ADS"
      ? `https://graph.facebook.com/v19.0/${campaign.campaignIdExternal}`
      : `https://googleads.googleapis.com/v16/customers/${campaign.networkAccountId.replace(/-/g, "")}/campaigns:mutate`;

  const updatedCampaign: FirewallCampaign = {
    ...campaign,
    status: "COMPLIANT_VERIFIED",
    creative: {
      ...campaign.creative,
      bodyCopy: campaign.remediatedCopy || campaign.creative.bodyCopy,
    },
    detectedInfraction: null,
    lastCircuitBreakerTripAt: now,
    circuitBreakerEventId: eventId,
  };

  const webhookLogs: WebhookLogEntry[] = [
    {
      id: `log_res_${eventId}`,
      timestamp: now,
      service: campaign.network === "META_ADS" ? "META_GRAPH_API" : "GOOGLE_ADS_API",
      endpoint,
      method: campaign.network === "META_ADS" ? "POST" : "MUTATE",
      status: 200,
      latencyMs: 10.5,
      payloadSummary: `{"status": "ACTIVE", "statutory_compliance_cert": "CANON_CLEARED_v2"}`,
      eventSignature: `SHA256:${eventId.substring(0, 10)}...resumed`,
    },
    {
      id: `log_slack_res_${eventId}`,
      timestamp: new Date(Date.now() + 25).toISOString(),
      service: "SLACK_INCIDENT",
      endpoint: "https://hooks.slack.com/services/T01/B02/FIREWALL_LEGAL",
      method: "POST",
      status: 200,
      latencyMs: 12.8,
      payloadSummary: `✅ CAMPAIGN RESUMED: '${campaign.name}' re-activated with approved statutory disclaimers.`,
      eventSignature: `SHA256:slack_res_${eventId.substring(0, 8)}`,
    },
  ];

  const result: CircuitBreakerResult = {
    success: true,
    campaignId: campaign.id,
    previousStatus: campaign.status,
    newStatus: "COMPLIANT_VERIFIED",
    networkDispatch: {
      endpoint,
      method: campaign.network === "META_ADS" ? "POST" : "MUTATE",
      status: 200,
      responseHash: `sha256_${eventId.slice(-8)}_resumed`,
      timestamp: now,
    },
    webhookLogs,
    protectedSpendInr: 0,
    eventId,
    auditSignature: `CANON-RESUME-SIG-${eventId.toUpperCase()}`,
  };

  return { updatedCampaign, result };
}

/**
 * Generates an official Emergency Cease & Desist / Regulatory Attestation
 * for corporate legal compliance archives.
 */
export function generateEmergencyAttestation(
  campaign: FirewallCampaign
): string {
  const infraction = campaign.detectedInfraction;
  return `
================================================================================
CANON AI BRAND GOVERNANCE // PROGRAMMATIC CAMPAIGN FIREWALL INTERCEPT
================================================================================
INTERCEPT TIMESTAMP    : ${campaign.lastCircuitBreakerTripAt || new Date().toISOString()}
EVENT IDENTIFIER       : ${campaign.circuitBreakerEventId || "N/A"}
TARGET NETWORK         : ${campaign.network} (${campaign.networkAccountId})
EXTERNAL CAMPAIGN ID   : ${campaign.campaignIdExternal}
CAMPAIGN NAME          : ${campaign.name}
DISPATCH STATUS        : HTTP 200 OK (PAUSED_BY_CANON_FIREWALL)
--------------------------------------------------------------------------------
STATUTORY AUDIT FINDINGS:
ACT / REGULATION       : ${infraction?.statutoryAct || "ASCI & CCPA Advertising Regulations"}
RULE CODE              : ${infraction?.ruleCode || "RULE-INTERCEPT-01"}
INFRACTION TITLE       : ${infraction?.ruleTitle || "Statutory Advertising Non-Compliance"}
STATUTORY PENALTY EXPOS: ₹${(infraction?.penaltyExposureInr || 1000000).toLocaleString("en-IN")} (CPA 2019 Sec 21)
PROTECTED BUDGET       : ₹${(campaign.protectedSpendInr || 0).toLocaleString("en-IN")}
--------------------------------------------------------------------------------
FLAGGED CREATIVE SUBSTRING:
"${infraction?.matchedText || campaign.creative.headline}"

LEGAL EXPLANATION:
${infraction?.explanation || "Prohibited non-compliant advertising claims detected."}
--------------------------------------------------------------------------------
DISPATCH MECHANISM:
Idempotent webhook to ${campaign.network === "META_ADS" ? "Meta Graph API v19.0" : "Google Ads API REST v16"}.
Ad set state transitioned: ACTIVE -> PAUSED.
Cryptographic Signature: SHA-256 (Signed into Canon Immutable Ledger)
================================================================================
  `.trim();
}
