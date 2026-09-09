"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, CircleHelp, LogOut, Settings } from "lucide-react";
import { logout } from "@/lib/actions/identity";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

type UserLite = {
  name: string;
  initials: string;
  color: string;
};

const itemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand";

export function UserMenu({ user }: { user: UserLite }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstName = user.name.split(" ")[0];

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = buttonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="flex max-w-full items-center gap-2 rounded-full border border-line bg-paper py-1 pr-2 pl-2.5 text-ink transition hover:bg-paper-2 sm:pl-3"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="font-serif hidden max-w-[8rem] truncate text-base leading-tight sm:inline sm:max-w-[10rem] sm:text-[15px]">
          Hi, {firstName}
        </span>
        <Avatar {...user} size="sm" />
        <ChevronDown size={14} className={cn("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[200] w-48 rounded-2xl border border-line bg-paper p-1 shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
              style={{ top: pos.top, right: pos.right }}
            >
              <Link href="/guide" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <CircleHelp size={16} />
                How to use
              </Link>
              <Link href="/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <Settings size={16} />
                Settings
              </Link>
              <form action={logout}>
                <button type="submit" role="menuitem" className={cn(itemClass, "text-red-700 dark:text-red-400")}>
                  <LogOut size={16} />
                  Log out
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
