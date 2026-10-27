import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    message: "Logged out successfully",
  });

  // Clear session cookie
  response.cookies.delete("canon_session_token");

  return response;
}
