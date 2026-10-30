export type AdNetwork = "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS" | "X_ADS";

export type CampaignStatus =
  | "ACTIVE_RUNNING"
  | "PAUSED_BY_CANON_FIREWALL"
  | "FLAGGED_WARNING"
  | "COMPLIANT_VERIFIED";

export interface AdCreativePayload {
  headline: string;
  bodyCopy: string;
  cta: string;
  landingUrl: string;
  channel: string;
}

export interface StatutoryInfractionDetail {
  ruleCode: string;
  ruleTitle: string;
  statutoryAct: string;
  penaltyExposureInr: number;
  explanation: string;
  matchedText: string;
}

export interface FirewallCampaign {
  id: string;
  name: string;
  network: AdNetwork;
  networkAccountId: string;
  campaignIdExternal: string;
  status: CampaignStatus;
  dailyBudgetInr: number;
  hourlySpendInr: number;
  burnedSpendInr: number;
  impressionsDelivered: number;
  liveHours: number;
  creative: AdCreativePayload;
  detectedInfraction?: StatutoryInfractionDetail | null;
  lastCircuitBreakerTripAt?: string;
  circuitBreakerEventId?: string;
  remediatedCopy?: string;
  protectedSpendInr?: number;
  isCustomCampaign?: boolean;
}

export interface CircuitBreakerWebhookPayload {
  campaignId: string;
  action: "PAUSE" | "RESUME" | "INJECT_VIOLATION";
  violationCode?: string;
  customReason?: string;
  operator?: string;
}

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  service: "META_GRAPH_API" | "GOOGLE_ADS_API" | "SLACK_INCIDENT" | "PAGERDUTY";
  endpoint: string;
  method: "POST" | "MUTATE";
  status: number;
  latencyMs: number;
  payloadSummary: string;
  eventSignature: string;
}

export interface CircuitBreakerResult {
  success: boolean;
  campaignId: string;
  previousStatus: CampaignStatus;
  newStatus: CampaignStatus;
  networkDispatch: {
    endpoint: string;
    method: "POST" | "MUTATE";
    status: number;
    responseHash: string;
    timestamp: string;
  };
  webhookLogs: WebhookLogEntry[];
  protectedSpendInr: number;
  eventId: string;
  auditSignature: string;
}

export interface FirewallTelemetrySummary {
  connectedNetworksCount: number;
  totalActiveCampaigns: number;
  totalPausedCampaigns: number;
  currentLiveHourlySpendInr: number;
  totalProtectedAdSpendInr: number;
  totalAvoidedStatutoryPenaltiesInr: number;
  totalCorporateLiabilityAvertedInr: number;
  interceptionLatencyMs: number;
}
