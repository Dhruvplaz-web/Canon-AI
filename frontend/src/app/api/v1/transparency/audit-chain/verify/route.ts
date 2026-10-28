import { NextRequest, NextResponse } from "next/server";
import {
  CANONICAL_AUDIT_LOGS,
  buildAuditChain,
  verifyAuditChain,
  AuditBlock,
} from "@/lib/audit-chain-engine";

export async function GET() {
  const chain = buildAuditChain(CANONICAL_AUDIT_LOGS);
  const report = verifyAuditChain(chain);
  return NextResponse.json(report);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let chain: AuditBlock[];

    if (Array.isArray(body.blocks)) {
      chain = body.blocks;
    } else {
      chain = buildAuditChain(CANONICAL_AUDIT_LOGS);
    }

    // Optional simulation hook for judges/testers to see tamper detection live:
    if (typeof body.tamper_index === "number" && body.tamper_index >= 0 && body.tamper_index < chain.length) {
      chain = JSON.parse(JSON.stringify(chain));
      chain[body.tamper_index].action = "MALICIOUS_UNAUTHORIZED_ALTERATION";
    }

    const report = verifyAuditChain(chain);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification pipeline failed";
    return NextResponse.json({ error: { message: msg } }, { status: 400 });
  }
}

