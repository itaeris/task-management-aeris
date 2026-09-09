import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, safeNextPath } from "@/lib/auth";
import { findOrCreateGoogleUser } from "@/lib/google-user";
import {
  isMissingCalendarTable,
  saveCalendarConnection,
  syncProjectToGoogleCalendar,
} from "@/lib/google-calendar";
import { cookieOptions, publicOrigin } from "@/lib/site";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";
const INTENT_COOKIE = "google_oauth_intent";

function originOf(request: NextRequest) {
  return publicOrigin(request.nextUrl, request.headers);
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NEXT_COOKIE);
  response.cookies.delete(INTENT_COOKIE);
}

function failLogin(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, `${originOf(request)}/`));
  clearOauthCookies(response);
  return response;
}

function failCalendar(request: NextRequest, next: string, code: string) {
  const url = new URL(next, `${originOf(request)}/`);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  clearOauthCookies(response);
  return response;
}

function projectIdFromPath(path: string) {
  const match = path.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const intent = request.cookies.get(INTENT_COOKIE)?.value;
  const next = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value);

  if (!clientId || !clientSecret) {
    return intent === "calendar" ? failCalendar(request, next, "gcal_config") : failLogin(request, "google_config");
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return intent === "calendar" ? failCalendar(request, next, "gcal_denied") : failLogin(request, "google_denied");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) {
    return intent === "calendar" ? failCalendar(request, next, "gcal_state") : failLogin(request, "google_state");
  }

  const redirectUri = `${originOf(request)}/api/auth/google/callback`;
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
  if (!tokenRes.ok) {
    return intent === "calendar" ? failCalendar(request, next, "gcal_token") : failLogin(request, "google_token");
  }
  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!tokens.access_token) {
    return intent === "calendar" ? failCalendar(request, next, "gcal_token") : failLogin(request, "google_token");
  }

  if (intent === "calendar") {
    const userId = request.cookies.get(USER_COOKIE)?.value;
    if (!userId) {
      const login = new URL("/login", `${originOf(request)}/`);
      login.searchParams.set("next", next);
      const response = NextResponse.redirect(login);
      clearOauthCookies(response);
      return response;
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return failCalendar(request, next, "gcal_profile");
    const profile = (await profileRes.json()) as { email?: string };
    if (!profile.email) return failCalendar(request, next, "gcal_email");

    try {
      await saveCalendarConnection({
        userId,
        googleEmail: profile.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });
      const projectId = projectIdFromPath(next);
      if (projectId) {
        await syncProjectToGoogleCalendar(userId, projectId).catch(() => undefined);
      }
    } catch (err) {
      if (isMissingCalendarTable(err)) return failCalendar(request, next, "gcal_migrate");
      return failCalendar(request, next, "gcal_save");
    }

    const url = new URL(next, `${originOf(request)}/`);
    url.searchParams.set("calendar", "connected");
    const response = NextResponse.redirect(url);
    clearOauthCookies(response);
    return response;
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return failLogin(request, "google_profile");
  const profile = (await profileRes.json()) as { email?: string; name?: string; given_name?: string };
  if (!profile.email) return failLogin(request, "google_email");

  let userId: string;
  try {
    userId = await findOrCreateGoogleUser({
      email: profile.email,
      name: profile.name || profile.given_name || profile.email,
    });
  } catch {
    return failLogin(request, "google_user");
  }

  const response = NextResponse.redirect(new URL(next, `${originOf(request)}/`));
  response.cookies.set(USER_COOKIE, userId, cookieOptions(60 * 60 * 24 * 365));
  clearOauthCookies(response);
  return response;
}
