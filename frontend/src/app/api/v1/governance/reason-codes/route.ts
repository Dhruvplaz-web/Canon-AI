import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      code: "RC-01",
      title: "Legal Counsel Safe Harbor Approval",
      description: "Formally approved by in-house legal counsel for specific partner release.",
    },
    {
      code: "RC-02",
      title: "Substantiated Third-Party Benchmark",
      description: "Backed by verified external audit documentation in approved claims ledger.",
    },
    {
      code: "RC-03",
      title: "Partner Co-Branding Exemption",
      description: "Approved FDIC or sponsor institution contractual co-branding requirement.",
    },
    {
      code: "RC-04",
      title: "Historical Citation in Editorial Context",
      description: "Term used in non-promotional educational or press release citation.",
    },
  ]);
}
