const DEFAULT_SITE = "https://pipeline.aerisbeaute.com";

export function siteUrl() {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return DEFAULT_SITE;
  return "";
}

export function publicOrigin(requestUrl?: URL, headers?: Headers) {
  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return requestUrl.origin;
  }
  const configured = siteUrl();
  if (configured) return configured;
  if (headers) {
    const host = headers.get("x-forwarded-host") ?? headers.get("host");
    const proto = headers.get("x-forwarded-proto") ?? requestUrl?.protocol.replace(":", "") ?? "https";
    if (host) return `${proto}://${host}`;
  }
  if (requestUrl) return requestUrl.origin;
  return DEFAULT_SITE;
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}
