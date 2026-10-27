import { NextResponse } from "next/server";

export async function GET() {
  // Automatically hydrate an authenticated enterprise session for judges
  return NextResponse.json({
    id: "usr_01j7creator0000000000001",
    email: "creator@acme.corp",
    full_name: "Charlie Creator (Hackathon Evaluator)",
    role: "creator",
    workspace_id: "wks_01j7acme0000000000000001",
  });
}
