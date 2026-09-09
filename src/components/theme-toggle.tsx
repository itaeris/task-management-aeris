"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { iconBtn } from "@/components/ui";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nara_theme";

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", dark ? "#0b1220" : "#3b82f6");
}

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    document.documentElement.classList.toggle("dark", event.newValue === "dark");
    onStoreChange();
  }
  window.addEventListener("storage", onStorage);
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => {
    window.removeEventListener("storage", onStorage);
    observer.disconnect();
  };
}

export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  return (
    <button
      type="button"
      className={cn(iconBtn, className)}
      onClick={() => applyTheme(!isDarkNow())}
      aria-label={dark ? "Light mode" : "Dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
