"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { iconBtn } from "@/components/ui";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nara_theme";

function isDarkNow() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", dark ? "#0b1220" : "#3b82f6");
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkNow());
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue === "dark";
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <button
      type="button"
      className={cn(iconBtn, className)}
      onClick={() => {
        const next = !isDarkNow();
        applyTheme(next);
        setDark(next);
      }}
      aria-label={dark ? "Light mode" : "Dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
