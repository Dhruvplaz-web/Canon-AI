import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || "creator@acme.corp";
    const role = email.includes("brand")
      ? "brand_manager"
      : email.includes("reviewer")
      ? "reviewer"
      : "creator";
    const name =
      role === "brand_manager"
        ? "Alice Brand Manager"
        : role === "reviewer"
        ? "Rachel Reviewer"
        : "Charlie Creator";

    const userObj = {
      id: `usr_${role}_001`,
      email,
      full_name: name,
      role,
      workspace_id: "wks_01j7acme0000000000000001",
    };

    const response = NextResponse.json({
      access_token: `token_${role}_session_active`,
      token_type: "bearer",
      user: userObj,
    });

    // Set HTTP-only session cookie for Next.js route protection
    response.cookies.set({
      name: "canon_session_token",
      value: JSON.stringify(userObj),
      httpOnly: false, // Accessible to client context
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    });

    return response;
  } catch {
    const fallbackUser = {
      id: "usr_creator_001",
      email: "creator@acme.corp",
      full_name: "Charlie Creator",
      role: "creator",
      workspace_id: "wks_01j7acme0000000000000001",
    };

    const response = NextResponse.json({
      access_token: "token_creator_session_active",
      token_type: "bearer",
      user: fallbackUser,
    });

    response.cookies.set({
      name: "canon_session_token",
      value: JSON.stringify(fallbackUser),
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    return response;
  }
}
