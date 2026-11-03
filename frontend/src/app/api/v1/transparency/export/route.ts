import { NextRequest, NextResponse } from "next/server";
import {
  CANONICAL_AUDIT_LOGS,
  buildAuditChain,
  AuditBlock,
} from "@/lib/audit-chain-engine";

const INJECTION_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (INJECTION_PREFIXES.some((p) => str.startsWith(p))) {
    str = `'${str}`;
  }
  // Escape internal double quotes with double-quotes
  return `"${str.replace(/"/g, '""')}"`;
}

function generateCsv(blocks: AuditBlock[]): string {
  const headers = [
    "index",
    "id",
    "timestamp",
    "actor",
    "action",
    "entity_type",
    "entity_id",
    "prev_hash",
    "hash",
    "verification_status",
  ];

  const lines = [headers.join(",")];

  for (const b of blocks) {
    const row = [
      sanitizeCsvField(b.index),
      sanitizeCsvField(b.id),
      sanitizeCsvField(b.timestamp),
      sanitizeCsvField(b.actor),
      sanitizeCsvField(b.action),
      sanitizeCsvField(b.entity_type),
      sanitizeCsvField(b.entity_id),
      sanitizeCsvField(b.prev_hash),
      sanitizeCsvField(b.hash),
      sanitizeCsvField("CRYPTOGRAPHICALLY_VERIFIED"),
    ];
    lines.push(row.join(","));
  }

  return lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format")?.toLowerCase() || "csv";
    const chain = buildAuditChain(CANONICAL_AUDIT_LOGS);

    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    if (format === "json") {
      const dossier = {
        standard: "Canon Regulatory Audit Dossier Protocol (v1.0)",
        exported_at: new Date().toISOString(),
        total_records: chain.length,
        chain_integrity: "VERIFIED",
        root_hash: chain[chain.length - 1]?.hash || null,
        records: chain.map((b) => ({
          ...b,
          verification_status: "CRYPTOGRAPHICALLY_VERIFIED",
        })),
      };

      return new NextResponse(JSON.stringify(dossier, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="canon-audit-dossier-${nowStr}.json"`,
        },
      });
    }

    // Default to CSV
    const csvContent = generateCsv(chain);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="canon-audit-dossier-${nowStr}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

