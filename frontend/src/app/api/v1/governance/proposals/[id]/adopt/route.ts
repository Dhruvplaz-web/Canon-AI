import { NextRequest, NextResponse } from "next/server";
import { proposalsStore } from "@/app/api/v1/governance/proposals/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = proposalsStore.find((p) => p.id === id);
    if (found) {
      found.status = "ADOPTED";
      found.adopted_at = new Date().toISOString();
    }

    return NextResponse.json({
      version_number: "1.1",
      approved_by: "Alice Brand (Brand Manager)",
      approved_at: new Date().toISOString(),
      message: `Proposal ${found ? found.proposal_code : id} successfully approved by Brand Manager and activated as Policy v1.1.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Adoption failed";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
