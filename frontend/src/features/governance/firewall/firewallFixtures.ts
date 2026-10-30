import {
  FirewallCampaign,
  FirewallTelemetrySummary,
  WebhookLogEntry,
} from "./firewallTypes";

export const INITIAL_FIREWALL_CAMPAIGNS: FirewallCampaign[] = [
  {
    id: "camp_meta_diwali_loans",
    name: "Diwali Dhamaka Instant Credit Blitz",
    network: "META_ADS",
    networkAccountId: "act_9381029410",
    campaignIdExternal: "meta_camp_diwali_2026",
    status: "ACTIVE_RUNNING",
    dailyBudgetInr: 450000,
    hourlySpendInr: 18750,
    burnedSpendInr: 56250,
    impressionsDelivered: 482000,
    liveHours: 3.0,
    creative: {
      headline: "5 Lakh Chutki Me Loan! Bina Document Instant Transfer",
      bodyCopy:
        "Arey boss! Bina kisi document, cibil score ya salary slip ke 5 lakh chutki me lo fatafat! Sirf aadhaar card do aur turant paisa account me double pao bina kisi risk ke!",
      cta: "Apply Now",
      landingUrl: "https://acmefintech.in/instant-credit",
      channel: "Instagram Reels & Feed",
    },
    detectedInfraction: {
      ruleCode: "RBI-VERN-01",
      ruleTitle: "Deceptive 'Bina Document' Unregulated Credit Promise",
      statutoryAct: "RBI Digital Lending Guidelines (2022) & CCPA 2022 Section 4",
      penaltyExposureInr: 1000000,
      explanation:
        "Unsubstantiated promise of unconditional loans without statutory KYC, underwriting, or credit bureau checks.",
      matchedText: "Bina kisi document, cibil score ya salary slip ke 5 lakh chutki me lo fatafat",
    },
    remediatedCopy:
      "Digital personal pre-qualification via our RBI-regulated NBFC banking partners. Subject to credit bureau checks and transparent APR disclosure.",
    protectedSpendInr: 393750,
  },
  {
    id: "camp_meta_royal_soda",
    name: "Royal Challenge Festive Hydration",
    network: "META_ADS",
    networkAccountId: "act_9381029410",
    campaignIdExternal: "meta_camp_royal_soda_01",
    status: "ACTIVE_RUNNING",
    dailyBudgetInr: 750000,
    hourlySpendInr: 31250,
    burnedSpendInr: 125000,
    impressionsDelivered: 1240000,
    liveHours: 4.0,
    creative: {
      headline: "Celebrate Every Victory with Royal Challenge Club Soda",
      bodyCopy:
        "Bhai shaam ko doston ke saath Royal Challenge club soda chilled mangwao aur celebrate karo har shaandar lamha! Jaldi order karo party shuru hone wali hai!",
      cta: "Order Now",
      landingUrl: "https://drinks.in/royal-challenge-soda",
      channel: "Instagram Stories & Meta Audience Network",
    },
    detectedInfraction: {
      ruleCode: "ASCI-SURR-ALCO",
      ruleTitle: "Prohibited Surrogate Alcobev Marketing",
      statutoryAct: "ASCI Code Chapter III & CCPA Guidelines (2022) Guideline 9(1)",
      penaltyExposureInr: 1000000,
      explanation:
        "Indirect promotion of restricted alcoholic beverage disguised under an innocuous brand extension (Club Soda) with 94% brand equity recall transfer.",
      matchedText: "Royal Challenge club soda",
    },
    remediatedCopy:
      "Celebrate this festive season with your family and loved ones! Enjoy chilled non-alcoholic refreshments.",
    protectedSpendInr: 625000,
  },
  {
    id: "camp_google_1xbet_news",
    name: "1xBet Sports News Portal Push",
    network: "GOOGLE_ADS",
    networkAccountId: "841-291-0391",
    campaignIdExternal: "gads_camp_betting_news_77",
    status: "ACTIVE_RUNNING",
    dailyBudgetInr: 500000,
    hourlySpendInr: 20833,
    burnedSpendInr: 41666,
    impressionsDelivered: 310000,
    liveHours: 2.0,
    creative: {
      headline: "1xBet Sports News App - Match Predictions & Double Kamai",
      bodyCopy:
        "India vs Australia maha muqabala! 1xBet sports news app download karo aur pao live cricket score aur expert predictions! 100% pakka double kamai!",
      cta: "Download App",
      landingUrl: "https://sportsnewsportal.org/download",
      channel: "Google Search & Discovery",
    },
    detectedInfraction: {
      ruleCode: "MEITY-BETTING-01",
      ruleTitle: "Illegal Offshore Betting Surrogate Promotion",
      statutoryAct: "MeitY Advisory on Online Betting (2023) & Public Gambling Act",
      penaltyExposureInr: 1000000,
      explanation:
        "Offshore illegal sports betting platform promoted via surrogate 'News' brand extension in direct violation of Ministry of Information & Broadcasting (MIB) orders.",
      matchedText: "1xBet sports news app",
    },
    remediatedCopy:
      "Follow verified national cricket analysis and official sporting tournament schedules through authorized sports broadcast channels.",
    protectedSpendInr: 458334,
  },
  {
    id: "camp_google_institutional",
    name: "Corporate Treasury Digital Solutions",
    network: "GOOGLE_ADS",
    networkAccountId: "841-291-0391",
    campaignIdExternal: "gads_camp_treasury_compliant_09",
    status: "COMPLIANT_VERIFIED",
    dailyBudgetInr: 300000,
    hourlySpendInr: 12500,
    burnedSpendInr: 150000,
    impressionsDelivered: 920000,
    liveHours: 12.0,
    creative: {
      headline: "Enterprise Working Capital & Treasury Platform",
      bodyCopy:
        "Partner with Acme Financial Technologies, an RBI-regulated banking infrastructure partner, to access competitive rates and digital cash management solutions. Terms apply.",
      cta: "Request Demo",
      landingUrl: "https://acmefintech.in/treasury",
      channel: "YouTube Pre-Roll & Google Display Network",
    },
    detectedInfraction: null,
    remediatedCopy: undefined,
    protectedSpendInr: 0,
  },
];

export const INITIAL_WEBHOOK_LOGS: WebhookLogEntry[] = [
  {
    id: "log_init_01",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    service: "META_GRAPH_API",
    endpoint: "https://graph.facebook.com/v19.0/act_9381029410/delivery_status",
    method: "POST",
    status: 200,
    latencyMs: 9.2,
    payloadSummary: "Telemetry handshake: 2 active ad sets verified.",
    eventSignature: "SHA256:7f9a2c...881a",
  },
  {
    id: "log_init_02",
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    service: "GOOGLE_ADS_API",
    endpoint: "https://googleads.googleapis.com/v16/customers/8412910391/campaigns:check",
    method: "POST",
    status: 200,
    latencyMs: 11.5,
    payloadSummary: "Telemetry handshake: 2 active campaigns monitored.",
    eventSignature: "SHA256:3d1e8b...902f",
  },
  {
    id: "log_init_03",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    service: "SLACK_INCIDENT",
    endpoint: "https://hooks.slack.com/services/T01/B02/FIREWALL_LEGAL",
    method: "POST",
    status: 200,
    latencyMs: 14.1,
    payloadSummary: "Circuit Breaker Daemon armed on channels: Meta Ads & Google Ads.",
    eventSignature: "SHA256:a1c43d...55e2",
  },
];

export const INITIAL_FIREWALL_TELEMETRY: FirewallTelemetrySummary = {
  connectedNetworksCount: 2,
  totalActiveCampaigns: 3,
  totalPausedCampaigns: 0,
  currentLiveHourlySpendInr: 83333,
  totalProtectedAdSpendInr: 1477084,
  totalAvoidedStatutoryPenaltiesInr: 3000000, // ₹30 Lakhs (3 infractions @ ₹10L each)
  totalCorporateLiabilityAvertedInr: 4477084, // ₹14.77L ad spend + ₹30L statutory fine = ₹44.77 Lakhs
  interceptionLatencyMs: 11.4,
};
