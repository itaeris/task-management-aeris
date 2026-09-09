import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { USER_COOKIE, safeNextPath } from "@/lib/auth";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/google-calendar";
import { cookieOptions, publicOrigin } from "@/lib/site";

const INTENT_COOKIE = "google_oauth_intent";
const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";

export async function GET(request: NextRequest) {
  const origin = publicOrigin(request.nextUrl, request.headers);
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const userId = request.cookies.get(USER_COOKIE)?.value;
  if (!userId) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, `${origin}/`));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const url = new URL(next, `${origin}/`);
    url.searchParams.set("error", "gcal_config");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  const cookie = cookieOptions(60 * 10);
  response.cookies.set(STATE_COOKIE, state, cookie);
  response.cookies.set(NEXT_COOKIE, next, cookie);
  response.cookies.set(INTENT_COOKIE, "calendar", cookie);
  return response;
}
