import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Canon Brand Governance Gateway",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    engine: "Deterministic AST + Multi-Provider AI",
  });
}
