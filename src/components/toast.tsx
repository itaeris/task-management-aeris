"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

const FLASH_KEY = "nara_toast";
const MAX_VISIBLE = 3;
const HOLD_MS = 2800;
const EMPTY_TOASTS: ToastItem[] = [];

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persistFlash(message: string, tone: ToastTone) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, tone }));
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(FLASH_KEY);
      } catch {
        // ignore
      }
    }, HOLD_MS);
  } catch {
    // private mode
  }
}

function pushToast(message: string, tone: ToastTone) {
  const last = toasts[toasts.length - 1];
  if (last && last.message === message && last.tone === tone) return last.id;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  toasts = [...toasts, { id, message, tone }].slice(-MAX_VISIBLE);
  emit();
  window.setTimeout(() => dismissToast(id), HOLD_MS);
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export const toast = {
  success(message: string) {
    return pushToast(message, "success");
  },
  error(message: string) {
    return pushToast(message, "error");
  },
};

function isNextBypass(error: unknown) {
  const digest =
    typeof error === "object" && error && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}

export async function notifyChange<T>(work: Promise<T>, success: string): Promise<T> {
  try {
    const result = await work;
    toast.success(success);
    return result;
  } catch (error) {
    if (isNextBypass(error)) {
      persistFlash(success, "success");
      toast.success(success);
      throw error;
    }
    toast.error(error instanceof Error ? error.message : "Something went wrong.");
    throw error;
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function useToastMessage(state: { success?: string; error?: string } | null | undefined) {
  const success = state?.success;
  const error = state?.error;
  useEffect(() => {
    if (success) toast.success(success);
    if (error) toast.error(error);
  }, [error, success]);
}

export function ToastHost() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => EMPTY_TOASTS);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      if (!raw) return;
      sessionStorage.removeItem(FLASH_KEY);
      const parsed = JSON.parse(raw) as { message?: string; tone?: ToastTone };
      if (parsed.message) pushToast(parsed.message, parsed.tone === "error" ? "error" : "success");
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[220] flex flex-col items-center gap-2 px-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.p
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex max-w-[min(100%,24rem)] items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-[0_10px_28px_rgba(15,23,42,0.14)]",
              item.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/80 dark:text-red-200"
                : "border-line bg-paper text-ink",
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOutSoft }}
          >
            {item.tone === "error" ? (
              <X size={14} className="shrink-0" />
            ) : (
              <Check size={14} className="shrink-0 text-terracotta" />
            )}
            <span className="min-w-0 leading-snug">{item.message}</span>
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
