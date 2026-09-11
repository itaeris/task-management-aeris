"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "compact" | "flexible";
      appearance?: "always" | "execute" | "interaction-only";
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      "response-field"?: boolean;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function subscribeTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function TurnstileField({ siteKey }: { siteKey: string }) {
  const hostId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const dark = useSyncExternalStore(subscribeTheme, isDarkNow, () => false);

  useEffect(() => {
    const api = window.turnstile;
    const host = hostRef.current;
    if (!ready || !api || !host || !siteKey) return;

    const widgetId = api.render(host, {
      sitekey: siteKey,
      theme: dark ? "dark" : "light",
      size: "flexible",
      appearance: "always",
      "response-field": false,
      callback: (value) => setToken(value),
      "error-callback": () => setToken(""),
      "expired-callback": () => setToken(""),
      "timeout-callback": () => setToken(""),
    });

    return () => {
      api.remove(widgetId);
    };
  }, [dark, ready, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="overflow-visible">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div id={hostId} ref={hostRef} className="w-full overflow-visible [&_iframe]:max-w-full" />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </div>
  );
}
