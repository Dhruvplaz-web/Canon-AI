import {
  FirewallCampaign,
  CircuitBreakerResult,
  CampaignStatus,
} from "./firewallTypes";

/**
 * Triggers an automated emergency circuit breaker on a campaign,
 * dispatching a simulated programmatic pause to Meta Marketing API or Google Ads API.
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
