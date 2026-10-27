import { NextRequest, NextResponse } from "next/server";
import { generateCryptographicCertificate } from "@/lib/compliance-engine";
import { submissionsStore } from "@/app/api/v1/submissions/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = submissionsStore[id];
    const title = existing ? existing.title : "Acme Digital Asset Campaign 2026";
    const content = existing ? existing.content : "Acme Financial delivers certified digital asset custody solutions with verified enterprise SLAs.";

    const cert = generateCryptographicCertificate(id, title, content);
    return NextResponse.json(cert);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate certificate";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
