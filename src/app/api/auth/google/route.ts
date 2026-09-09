import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { safeNextPath } from "@/lib/auth";
import { cookieOptions, publicOrigin } from "@/lib/site";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";

function redirectUri(request: NextRequest) {
  return `${publicOrigin(request.nextUrl, request.headers)}/api/auth/google/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_config", `${publicOrigin(request.nextUrl, request.headers)}/`));
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
  const cookie = cookieOptions(60 * 10);
  response.cookies.set(STATE_COOKIE, state, cookie);
  response.cookies.set(NEXT_COOKIE, next, cookie);
  return response;
}
