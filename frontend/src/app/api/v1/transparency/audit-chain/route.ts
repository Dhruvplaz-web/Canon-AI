import { NextResponse } from "next/server";
import {
  CANONICAL_AUDIT_LOGS,
  buildAuditChain,
} from "@/lib/audit-chain-engine";

export async function GET() {
  const chain = buildAuditChain(CANONICAL_AUDIT_LOGS);
  return NextResponse.json({
    chain,
    total: chain.length,
    root_hash: chain[chain.length - 1]?.hash || null,
  });
}

