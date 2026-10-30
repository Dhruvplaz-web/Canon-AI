import { NextRequest, NextResponse } from "next/server";
import {
  INITIAL_FIREWALL_CAMPAIGNS,
} from "@/features/governance/firewall/firewallFixtures";
import {
  executeCircuitBreaker,
  resumeRemediatedCampaign,
} from "@/features/governance/firewall/firewallEngine";
import { CircuitBreakerWebhookPayload } from "@/features/governance/firewall/firewallTypes";

// In-memory campaign store for runtime simulation
let dynamicCampaigns = [...INITIAL_FIREWALL_CAMPAIGNS];

export async function GET() {
  return NextResponse.json({
    success: true,
    campaigns: dynamicCampaigns,
    telemetry: {
      connectedNetworks: ["Meta Marketing API v19.0", "Google Ads API v16"],
      activeCount: dynamicCampaigns.filter((c) => c.status === "ACTIVE_RUNNING").length,
      pausedCount: dynamicCampaigns.filter(
        (c) => c.status === "PAUSED_BY_CANON_FIREWALL"
      ).length,
      totalProtectedSpendInr: dynamicCampaigns.reduce(
        (acc, c) => acc + (c.protectedSpendInr || 0),
        0
      ),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: CircuitBreakerWebhookPayload = await req.json();
    const { campaignId, action, customReason } = body;

    const targetIdx = dynamicCampaigns.findIndex((c) => c.id === campaignId);
    if (targetIdx === -1) {
      return NextResponse.json(
        { error: `Campaign with id '${campaignId}' not found.` },
        { status: 404 }
      );
    }

    const currentCampaign = dynamicCampaigns[targetIdx];

    if (action === "PAUSE" || action === "INJECT_VIOLATION") {
      const { updatedCampaign, result } = executeCircuitBreaker(
        currentCampaign,
        customReason || "CRITICAL_STATUTORY_VIOLATION_INTERCEPT"
      );
      dynamicCampaigns[targetIdx] = updatedCampaign;

      return NextResponse.json({
        success: true,
        action: "PAUSE",
        campaign: updatedCampaign,
        circuitBreakerResult: result,
      });
    } else if (action === "RESUME") {
      const { updatedCampaign, result } = resumeRemediatedCampaign(currentCampaign);
      dynamicCampaigns[targetIdx] = updatedCampaign;

      return NextResponse.json({
        success: true,
        action: "RESUME",
        campaign: updatedCampaign,
        circuitBreakerResult: result,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Circuit breaker error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Reset endpoint for demo repeatability
export async function DELETE() {
  dynamicCampaigns = [...INITIAL_FIREWALL_CAMPAIGNS];
  return NextResponse.json({ success: true, message: "Campaigns reset to baseline." });
}

