import { NextResponse } from "next/server";

export async function GET() {
  const healthData = [
    {
      id: "hlth_01",
      rule_code: "TERM-001",
      snapshot_date: "2026-10-27",
      total_evaluations: 1420,
      total_flags: 184,
      total_overrides: 4,
      override_rate: 0.02,
      diagnostic_status: "HEALTHY",
      primary_override_reason: "Legal safe harbor review on co-branded PR",
    },
    {
      id: "hlth_02",
      rule_code: "CLAIM-001",
      snapshot_date: "2026-10-27",
      total_evaluations: 1420,
      total_flags: 92,
      total_overrides: 38,
      override_rate: 0.41,
      diagnostic_status: "HIGH_OVERRIDE_DRIFT",
      primary_override_reason: "Uptime SLA 2025 substantiation pending ledger renewal",
    },
    {
      id: "hlth_03",
      rule_code: "TERM-005",
      snapshot_date: "2026-10-27",
      total_evaluations: 1420,
      total_flags: 312,
      total_overrides: 18,
      override_rate: 0.05,
      diagnostic_status: "HEALTHY",
      primary_override_reason: "Social handle styling exception",
    },
    {
      id: "hlth_04",
      rule_code: "INJECT-001",
      snapshot_date: "2026-10-27",
      total_evaluations: 1420,
      total_flags: 19,
      total_overrides: 0,
      override_rate: 0.0,
      diagnostic_status: "HEALTHY",
      primary_override_reason: "Zero overrides permitted on adversarial payloads",
    },
  ];

  return NextResponse.json(healthData);
}
