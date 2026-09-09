"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { useOffline } from "next/offline";
import { btnPrimary, surface } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft, FadeIn } from "@/components/motion";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const subscribers = new Set<() => void>();

function notify() {
  for (const subscriber of subscribers) subscriber();
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosSafari() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PwaRoot() {
  useEffect(() => {
    installed = isStandaloneDisplay();
    notify();

    if ("serviceWorker" in navigator) {
      const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      if (!isLocal) {
        navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
      }
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      notify();
    };
    const onInstalled = () => {
      installed = true;
      deferredPrompt = null;
      notify();
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return <OfflineBanner />;
}

function OfflineBanner() {
  const offline = useOffline();

  return (
    <AnimatePresence>
      {offline ? (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: easeOutSoft }}
        >
          <p
            role="status"
            className="pointer-events-auto rounded-full bg-ink px-4 py-2 text-center text-sm font-medium text-white shadow-lg"
          >
            Kamu sedang offline. Beberapa aksi mungkin tertunda.
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function InstallAppCard() {
  const [, setTick] = useState(0);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIosSafari());
    const onChange = () => setTick((value) => value + 1);
    subscribers.add(onChange);
    onChange();
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") installed = true;
    deferredPrompt = null;
    notify();
  }

  return (
    <FadeIn delay={0.08}>
    <section className={cn(surface, "rounded-3xl p-6")}>
      <h2 className="font-serif text-2xl">Aplikasi</h2>
      <p className="mt-1 text-sm text-muted">Pasang di HP atau desktop supaya buka seperti app native.</p>
      {installed ? (
        <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Task Management sudah terpasang di perangkat ini.
        </p>
      ) : deferredPrompt ? (
        <button type="button" className={cn(btnPrimary, "mt-5")} onClick={install}>
          <Download size={16} />
          Pasang aplikasi
        </button>
      ) : ios ? (
        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-ink">
          <Share size={16} className="mt-0.5 shrink-0 text-terracotta" />
          Di Safari, tap Share lalu pilih <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Kalau browser mendukung, tombol pasang akan muncul di sini. Chrome/Edge: menu ⋮ → Install app.
        </p>
      )}
    </section>
    </FadeIn>
  );
}
