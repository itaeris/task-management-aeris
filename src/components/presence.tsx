"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { listPresence, pingPresence, type PresencePerson } from "@/lib/actions/presence";
import { Avatar, Skeleton, surface } from "@/components/ui";
import { cn } from "@/lib/utils";

const PresenceTask = createContext<(id: string | null) => void>(() => {});

let cachedPresence: PresencePerson[] | null = null;

export function useSetActiveTask() {
  return useContext(PresenceTask);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const ping = () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      void pingPresence(pathname, taskId).finally(() => {
        inFlight = false;
      });
    };
    ping();
    const timer = window.setInterval(ping, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname, taskId]);

  return <PresenceTask.Provider value={setTaskId}>{children}</PresenceTask.Provider>;
}

function PresenceHoverChip({ person }: { person: PresencePerson }) {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>(0);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const href =
    person.taskId && person.projectId
      ? person.path
      : person.projectId
        ? `/projects/${person.projectId}`
        : person.path;
  const hasExtras = Boolean(person.projectName || person.taskTitle);

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = hasExtras ? 264 : 220;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    setPos({ top: rect.bottom + 8, left });
  }

  function show() {
    window.clearTimeout(hideTimer.current);
    place();
    setOpen(true);
  }

  function hide() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 90);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = hasExtras ? 264 : 220;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      setPos({ top: rect.bottom + 8, left });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, hasExtras]);

  useEffect(() => {
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  return (
    <>
      <Link
        ref={triggerRef}
        href={href}
        className="relative inline-flex rounded-full ring-2 ring-paper transition hover:z-10 hover:ring-terracotta/50"
        aria-label={`${person.name}, ${person.pageLabel}${person.projectName ? `, ${person.projectName}` : ""}${person.taskTitle ? `, working on ${person.taskTitle}` : ""}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (cardRef.current?.contains(event.relatedTarget as Node)) return;
          hide();
        }}
      >
        <Avatar {...person} size="sm" title={false} />
        <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-paper" />
      </Link>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={cardRef}
              role="tooltip"
              className="pointer-events-none fixed z-[200] w-64 rounded-2xl border border-line bg-paper p-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.22)]"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="flex items-start gap-2">
                <Avatar {...person} size="sm" title={false} />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-snug text-ink">{person.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">{person.pageLabel}</span>
                </span>
              </div>
              {hasExtras ? (
                <div className="mt-2 space-y-1.5 border-t border-line px-1 pt-2">
                  {person.projectName ? (
                    <p>
                      <span className="block text-[9px] font-semibold tracking-wide text-muted uppercase">Project</span>
                      <span className="block truncate text-[11px] font-medium text-ink">{person.projectName}</span>
                    </p>
                  ) : null}
                  {person.taskTitle ? (
                    <p>
                      <span className="block text-[9px] font-semibold tracking-wide text-muted uppercase">Task</span>
                      <span className="block truncate text-[11px] font-medium text-ink">{person.taskTitle}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function PresenceBoard({
  compact = false,
  variant = compact ? "sidebar" : "card",
}: {
  compact?: boolean;
  variant?: "card" | "sidebar" | "header";
}) {
  const [people, setPeople] = useState<PresencePerson[]>(() => cachedPresence ?? []);
  const [ready, setReady] = useState(() => cachedPresence !== null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const rows = await listPresence();
        if (!cancelled) {
          cachedPresence = rows;
          setPeople(rows);
        }
      } catch {
        if (!cancelled) setPeople(cachedPresence ?? []);
      } finally {
        inFlight = false;
        if (!cancelled) setReady(true);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const others = people.filter((person) => !person.isMe);
  const items = variant === "card" ? people : others;

  if (variant === "header") {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden shrink-0 select-none text-[13px] font-light text-muted/70 sm:inline" aria-hidden>
          |
        </span>
        <span className="hidden shrink-0 text-[11px] font-semibold tracking-wide text-muted uppercase sm:inline">
          Active now
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {!ready ? (
            <div className="flex items-center -space-x-1.5">
              <Skeleton className="h-7 w-7 !rounded-full ring-2 ring-paper" />
              <Skeleton className="h-7 w-7 !rounded-full ring-2 ring-paper" />
            </div>
          ) : items.length === 0 ? (
            <p className="truncate text-sm text-muted">Just you</p>
          ) : (
            <div className="flex items-center -space-x-1.5">
              {items.map((person) => (
                <PresenceHoverChip key={person.userId} person={person} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className={cn(variant !== "sidebar" && surface, variant !== "sidebar" && "rounded-3xl p-5")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={variant === "sidebar" ? "text-[11px] font-semibold tracking-wide text-muted uppercase" : "font-serif text-2xl"}>
          {variant === "sidebar" ? "Active now" : "Working now"}
        </h2>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      {variant === "card" ? (
        <p className="mt-1 text-sm text-muted">Everyone can see who has a project or task open.</p>
      ) : null}
      <ul className={cn("space-y-2", variant === "sidebar" ? "mt-3" : "mt-4")}>
        {!ready ? (
          Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 !rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
            </li>
          ))
        ) : items.length === 0 ? (
          <li className="text-sm text-muted">{variant === "sidebar" ? "Just you." : "No one else is active yet."}</li>
        ) : (
          items.map((person) => (
            <li key={person.userId} className="flex items-start gap-3">
              <Avatar name={person.name} initials={person.initials} color={person.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {person.name}
                  {person.isMe ? <span className="ml-1 text-xs font-medium text-muted">(you)</span> : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {person.taskTitle
                    ? `Task: ${person.taskTitle}`
                    : person.projectName
                      ? `${person.projectName} · ${person.pageLabel}`
                      : person.pageLabel}
                </p>
                {person.projectId ? (
                  <Link
                    href={person.taskId ? person.path : `/projects/${person.projectId}`}
                    className="text-[11px] font-semibold text-terracotta hover:underline"
                  >
                    View
                  </Link>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
