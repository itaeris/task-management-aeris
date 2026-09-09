"use client";

import { useEffect } from "react";
import { useOffline } from "next/offline";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";

export function PwaRoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (isLocal) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
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
