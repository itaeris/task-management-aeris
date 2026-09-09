"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import { updateProjectIcon } from "@/lib/actions/projects";
import { DEFAULT_PROJECT_ICON, FEATURED_PROJECT_ICONS, parseProjectMark } from "@/lib/project-icon";
import { ProjectIcon } from "@/components/project-icon";
import { field } from "@/components/ui";
import { cn } from "@/lib/utils";

type IconHit = { id: string; name: string; family: string };

const FEATURED: IconHit[] = FEATURED_PROJECT_ICONS.map((id) => ({
  id,
  name: id.replace(/^fi-(sr|brands)-/, ""),
  family: id.startsWith("fi-brands-") ? "brands" : "solid",
}));

function IconSearch({
  selected,
  onSelect,
  leading,
  compact = false,
}: {
  selected: string;
  onSelect: (id: string) => void;
  leading?: ReactNode;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState<IconHit[]>(FEATURED);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setIcons(FEATURED);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/icons/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { icons?: IconHit[] };
        if (!controller.signal.aborted) setIcons(data.icons ?? []);
      } catch {
        if (!controller.signal.aborted) setIcons([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      <div className="flex items-center gap-2">
        {leading}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={field}
          placeholder="Cari icon…"
          aria-label="Cari icon Flaticon"
        />
      </div>
      <div className={cn("mt-2 overflow-y-auto rounded-2xl border border-line bg-white p-2", compact ? "max-h-28" : "max-h-52")}>
        {icons.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted">
            {loading ? "Mencari…" : "Tidak ketemu. Coba kata lain."}
          </p>
        ) : (
          <div className={cn("grid gap-1", compact ? "grid-cols-8" : "grid-cols-8 sm:grid-cols-10")}>
            {icons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                title={icon.name.replace(/-/g, " ")}
                onClick={() => onSelect(icon.id)}
                className={cn(
                  "flex w-full items-center justify-center rounded-xl text-ink transition hover:bg-sand",
                  compact ? "h-8 text-base" : "h-10 text-lg",
                  selected === icon.id && "bg-paper-2 ring-2 ring-terracotta",
                )}
              >
                <i className={cn("fi leading-none", icon.id)} aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function IconPicker({
  name = "icon",
  defaultValue = DEFAULT_PROJECT_ICON,
  compact = false,
}: {
  name?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(!compact);
  const selectedName = useMemo(
    () => selected.replace(/^fi-(sr|brands)-/, "").replace(/-/g, " "),
    [selected],
  );

  return (
    <div>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5 text-left"
        >
          <ProjectIcon value={selected} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {open ? "Tutup icon" : "Pilih icon"}
            <span className="ml-1 text-muted">· {selectedName}</span>
          </span>
        </button>
      ) : (
        <>
          <div className="flex items-end justify-between gap-2">
            <p className="text-sm font-semibold">Icon project</p>
            <a
              href="https://www.flaticon.com/uicons"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-muted hover:underline"
            >
              UIcons by Flaticon
            </a>
          </div>
          <p className="mt-0.5 text-xs text-muted">Cari dari ribuan icon Flaticon. Ketik nama seperti whatsapp, shop, atau dashboard.</p>
        </>
      )}
      {open ? (
        <div className={cn(compact && "mt-2")}>
          <IconSearch
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              if (compact) setOpen(false);
            }}
            leading={compact ? undefined : <ProjectIcon value={selected} />}
            compact={compact}
          />
        </div>
      ) : null}
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}

export function ProjectIconEditor({
  projectId,
  value,
  canEdit,
  size = "md",
}: {
  projectId: string;
  value: string;
  canEdit: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const mark = parseProjectMark(value);
  const selected = mark.type === "flaticon" ? mark.id : DEFAULT_PROJECT_ICON;
  const legacyColor = mark.type === "color";

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = 340;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const top = Math.min(rect.bottom + 8, window.innerHeight - 280);
      setPos({ top, left });
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
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!canEdit) return <ProjectIcon value={value} size={size} />;

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        ref={triggerRef}
        type="button"
        disabled={pending}
        title="Ganti icon"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          "relative rounded-2xl transition hover:ring-2 hover:ring-terracotta/50",
          pending && "opacity-60",
        )}
      >
        <ProjectIcon value={value} size={size} />
        <span className="absolute -right-1 -bottom-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line bg-white text-terracotta shadow-sm">
          <Pencil size={10} />
        </span>
      </button>
      {legacyColor && size !== "sm" ? (
        <span className="text-[10px] font-semibold text-terracotta">Ganti icon</span>
      ) : null}
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[80] w-[340px] rounded-2xl border border-line bg-white p-3 shadow-[0_18px_40px_rgba(37,99,235,0.14)]"
              style={{ top: pos.top, left: pos.left }}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <p className="mb-2 text-sm font-semibold">Ganti icon project</p>
              <IconSearch
                selected={selected}
                onSelect={(id) => {
                  setOpen(false);
                  startTransition(() => {
                    void updateProjectIcon(projectId, id);
                  });
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
