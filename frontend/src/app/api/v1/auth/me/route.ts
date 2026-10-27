import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("canon_session_token");

  if (sessionCookie?.value) {
    try {
      const user = JSON.parse(sessionCookie.value);
      if (user && user.id && user.role) {
        return NextResponse.json(user);
      }
    } catch {
      // Invalid cookie payload
    }
  }

  // Check Authorization header fallback
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.includes("reviewer")) {
      return NextResponse.json({
        id: "usr_reviewer_001",
        email: "reviewer@acme.corp",
        full_name: "Rachel Reviewer",
        role: "reviewer",
        workspace_id: "wks_01j7acme0000000000000001",
      });
    }
    if (token.includes("brand")) {
      return NextResponse.json({
        id: "usr_brand_manager_001",
        email: "brand@acme.corp",
        full_name: "Alice Brand Manager",
        role: "brand_manager",
        workspace_id: "wks_01j7acme0000000000000001",
      });
    }
    return NextResponse.json({
      id: "usr_creator_001",
      email: "creator@acme.corp",
      full_name: "Charlie Creator",
      role: "creator",
      workspace_id: "wks_01j7acme0000000000000001",
    });
  }

  return NextResponse.json(
    { detail: "Authentication required" },
    { status: 401 }
  );
}
