"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Pin, Search } from "lucide-react";
import { ProjectIcon } from "@/components/project-icon";
import { field } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProjectSwitcherItem } from "@/lib/types";

function projectHref(projectId: string, pathname: string) {
  const suffix = pathname.match(/^\/projects\/[^/]+(.*)$/)?.[1] ?? "";
  return `/projects/${projectId}${suffix}`;
}

export function ProjectSwitcher({
  currentId,
  currentName,
  currentColor,
  projects,
}: {
  currentId: string;
  currentName: string;
  currentColor: string;
  projects: ProjectSwitcherItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    if (projects.some((project) => project.id === currentId)) return projects;
    return [{ id: currentId, name: currentName, color: currentColor, pinned: false }, ...projects];
  }, [currentColor, currentId, currentName, projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((project) => project.name.toLowerCase().includes(q));
  }, [items, query]);

  const showSearch = items.length > 6;

  function close() {
    setOpen(false);
    setQuery("");
  }

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = buttonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 24);
      let left = rect.left;
      if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
      if (left < 12) left = 12;
      setPos({ top: rect.bottom + 8, left, width });
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
      close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
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
        className="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-line bg-paper py-1 pr-2 pl-1.5 text-left text-ink transition hover:bg-paper-2"
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch project"
      >
        <ProjectIcon value={currentColor} size="sm" className="h-7 w-7 rounded-xl text-base" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">{currentName}</span>
        <ChevronDown size={14} className={cn("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label="Projects"
              className="fixed z-[200] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {showSearch ? (
                <div className="border-b border-line p-2">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className={cn(field, "h-9 py-1.5 pl-8 text-sm")}
                      placeholder="Search projects"
                      aria-label="Search projects"
                      autoFocus
                    />
                  </label>
                </div>
              ) : null}
              <div className="max-h-72 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted">No matches</p>
                ) : (
                  filtered.map((project) => {
                    const active = project.id === currentId;
                    return (
                      <Link
                        key={project.id}
                        href={projectHref(project.id, pathname)}
                        prefetch
                        role="option"
                        aria-selected={active}
                        onClick={close}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition",
                          active ? "bg-sand text-ink" : "text-ink hover:bg-sand",
                        )}
                      >
                        <ProjectIcon value={project.color} size="sm" className="h-7 w-7 rounded-xl text-base" />
                        <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                        {project.pinned ? (
                          <Pin size={12} className="shrink-0 fill-current text-terracotta" aria-hidden />
                        ) : null}
                        {active ? <Check size={14} className="shrink-0 text-terracotta" /> : null}
                      </Link>
                    );
                  })
                )}
              </div>
              <div className="border-t border-line p-1">
                <Link
                  href="/"
                  prefetch
                  onClick={close}
                  className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-sand hover:text-ink"
                >
                  All projects
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
