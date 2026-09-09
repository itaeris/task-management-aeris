import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { safeNextPath } from "@/lib/auth";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";

function redirectUri(request: NextRequest) {
  return new URL("/api/auth/google/callback", request.nextUrl.origin).toString();
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_config", request.url));
  }

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  const cookie = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 10 };
  response.cookies.set(STATE_COOKIE, state, cookie);
  response.cookies.set(NEXT_COOKIE, next, cookie);
  return response;
}
