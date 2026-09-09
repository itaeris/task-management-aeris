"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { listPresence, pingPresence, type PresencePerson } from "@/lib/actions/presence";
import { Avatar, surface } from "@/components/ui";
import { cn } from "@/lib/utils";

const PresenceTask = createContext<(id: string | null) => void>(() => {});

export function useSetActiveTask() {
  return useContext(PresenceTask);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      if (!cancelled) void pingPresence(pathname, taskId);
    };
    ping();
    const timer = window.setInterval(ping, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname, taskId]);

  return <PresenceTask.Provider value={setTaskId}>{children}</PresenceTask.Provider>;
}

export function PresenceBoard({
  compact = false,
  variant = compact ? "sidebar" : "card",
}: {
  compact?: boolean;
  variant?: "card" | "sidebar" | "header";
}) {
  const [people, setPeople] = useState<PresencePerson[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await listPresence();
        if (!cancelled) setPeople(rows);
      } catch {
        if (!cancelled) setPeople([]);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 8000);
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
        <span className="hidden shrink-0 text-[11px] font-semibold tracking-wide text-muted uppercase sm:inline">
          Sedang aktif
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {items.length === 0 ? (
            <p className="truncate text-sm text-muted">Hanya kamu</p>
          ) : (
            items.map((person) => (
              <Link
                key={person.userId}
                href={person.projectId ? `/projects/${person.projectId}` : person.path}
                className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-2 py-1 pr-3"
                title={
                  person.taskTitle
                    ? `${person.name} · ${person.taskTitle}`
                    : `${person.name} · ${person.projectName ?? person.pageLabel}`
                }
              >
                <Avatar name={person.name} initials={person.initials} color={person.color} size="sm" />
                <span className="max-w-[9rem]">
                  <span className="block truncate text-xs font-semibold leading-tight">{person.name.split(" ")[0]}</span>
                  <span className="block truncate text-[10px] text-muted">
                    {person.taskTitle ?? person.projectName ?? person.pageLabel}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <section className={cn(variant !== "sidebar" && surface, variant !== "sidebar" && "rounded-3xl p-5")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={variant === "sidebar" ? "text-[11px] font-semibold tracking-wide text-muted uppercase" : "font-serif text-2xl"}>
          {variant === "sidebar" ? "Sedang aktif" : "Sedang dikerjakan"}
        </h2>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      {variant === "card" ? (
        <p className="mt-1 text-sm text-muted">Semua user bisa lihat siapa yang sedang buka project atau task.</p>
      ) : null}
      <ul className={cn("space-y-2", variant === "sidebar" ? "mt-3" : "mt-4")}>
        {items.length === 0 ? (
          <li className="text-sm text-muted">{variant === "sidebar" ? "Hanya kamu." : "Belum ada user lain yang aktif."}</li>
        ) : (
          items.map((person) => (
            <li key={person.userId} className="flex items-start gap-3">
              <Avatar name={person.name} initials={person.initials} color={person.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {person.name}
                  {person.isMe ? <span className="ml-1 text-xs font-medium text-muted">(kamu)</span> : null}
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
                    Lihat
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
