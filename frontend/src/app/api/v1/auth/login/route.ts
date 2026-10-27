import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || "creator@acme.corp";
    const role = email.includes("brand") ? "brand_manager" : email.includes("reviewer") ? "reviewer" : "creator";
    const name = role === "brand_manager" ? "Alice Brand Manager" : role === "reviewer" ? "Rachel Reviewer" : "Charlie Creator";

    return NextResponse.json({
      access_token: "mock-jwt-token-hackathon-2026",
      token_type: "bearer",
      user: {
        id: `usr_${role}_001`,
        email,
        full_name: `${name} (Hackathon Evaluator)`,
        role,
        workspace_id: "wks_01j7acme0000000000000001",
      },
    });
  } catch {
    return NextResponse.json({
      access_token: "mock-jwt-token-hackathon-2026",
      token_type: "bearer",
      user: {
        id: "usr_creator_001",
        email: "creator@acme.corp",
        full_name: "Charlie Creator",
        role: "creator",
        workspace_id: "wks_01j7acme0000000000000001",
      },
    });
  }
}
