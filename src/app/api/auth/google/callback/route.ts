import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, safeNextPath } from "@/lib/auth";
import { findOrCreateGoogleUser } from "@/lib/google-user";
import { cookieOptions, publicOrigin } from "@/lib/site";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";

function fail(request: NextRequest, code: string) {
  const origin = publicOrigin(request.nextUrl, request.headers);
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, `${origin}/`));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NEXT_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(request, "google_config");

  const error = request.nextUrl.searchParams.get("error");
  if (error) return fail(request, "google_denied");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  const next = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value);
  if (!code || !state || !expected || state !== expected) return fail(request, "google_state");

  const redirectUri = `${publicOrigin(request.nextUrl, request.headers)}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail(request, "google_token");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return fail(request, "google_token");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return fail(request, "google_profile");
  const profile = (await profileRes.json()) as { email?: string; name?: string; given_name?: string };
  if (!profile.email) return fail(request, "google_email");

  let userId: string;
  try {
    userId = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name || profile.given_name || profile.email,
    });
  } catch {
    return fail(request, "google_user");
  }

  const response = NextResponse.redirect(new URL(next, `${publicOrigin(request.nextUrl, request.headers)}/`));
  response.cookies.set(USER_COOKIE, userId, cookieOptions(60 * 60 * 24 * 365));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NEXT_COOKIE);
  return response;
}
