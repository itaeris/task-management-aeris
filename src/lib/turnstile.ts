import { headers } from "next/headers";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare dummy keys — always pass. Safe for localhost; never use in production. */
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

function hostIsLocal(host: string) {
  const hostname = host.split(",")[0]?.split(":")[0]?.replace(/^\[|\]$/g, "").toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function appUrlIsLocal() {
  const raw = process.env.APP_URL?.trim();
  if (!raw) return null;
  try {
    return hostIsLocal(new URL(raw).hostname);
  } catch {
    return null;
  }
}

export async function isLocalTurnstile() {
  const fromAppUrl = appUrlIsLocal();
  if (fromAppUrl === false) return false;
  if (fromAppUrl === true) return true;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    if (host) return hostIsLocal(host);
  } catch {
    /* headers() is unavailable outside a request */
  }
  return process.env.NODE_ENV !== "production";
}

export async function turnstileSiteKey() {
  if (await isLocalTurnstile()) return TEST_SITE_KEY;
  return (
    process.env.TURNSTILE_SITE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    ""
  );
}

async function turnstileSecret() {
  if (await isLocalTurnstile()) return TEST_SECRET_KEY;
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
}

export async function isTurnstileEnabled() {
  return Boolean((await turnstileSiteKey()) && (await turnstileSecret()));
}

async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
}

export async function verifyTurnstileToken(token: string) {
  const secret = await turnstileSecret();
  if (!secret || !(await turnstileSiteKey())) {
    return { ok: false, error: "Turnstile is not configured." };
  }
  if (!token) {
    return { ok: false, error: "Complete the verification check." };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (!(await isLocalTurnstile())) {
    const ip = await clientIp();
    if (ip) body.set("remoteip", ip);
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; "error-codes"?: string[] }
      | null;
    if (!payload?.success) {
      return { ok: false, error: "Verification failed. Try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Verification failed. Try again." };
  }
}
