"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { field, iconBtn } from "@/components/ui";
import { addDays, addMonths, cn, formatDay, formatMonthYear, startOfMonth, todayKey } from "@/lib/utils";

type Option = { value: string; label: string };

type MenuPos = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

function useMenuPosition(open: boolean, minWidth = 0) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<MenuPos | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(rect.width, minWidth);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      setPos({
        left,
        width,
        maxHeight: Math.max(180, openUp ? spaceAbove : spaceBelow),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, minWidth]);

  return { triggerRef, pos };
}

function MenuPortal({
  open,
  onClose,
  triggerRef,
  pos,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  pos: MenuPos | null;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, triggerRef]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[80] overflow-auto rounded-2xl border border-line bg-paper p-1 shadow-[0_18px_40px_rgba(37,99,235,0.14)]",
        className,
      )}
      style={{
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function Select({
  name,
  value,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Select",
  className,
  required,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value ?? uncontrolled;
  const { triggerRef, pos } = useMenuPosition(open);
  const label = options.find((option) => option.value === selected)?.label;

  function choose(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      {name ? (
        <input
          name={name}
          value={selected}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(field, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-muted")}>{label ?? placeholder}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      <MenuPortal open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} pos={pos}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <button
              key={option.value || "__empty"}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => choose(option.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm",
                active ? "bg-sand text-brown" : "text-ink hover:bg-paper",
              )}
            >
              {option.label}
              {active ? <Check size={14} /> : null}
            </button>
          );
        })}
      </MenuPortal>
    </div>
  );
}

export function MultiSelect({
  name,
  defaultValue = [],
  options,
  placeholder = "Select",
  className,
}: {
  name?: string;
  defaultValue?: string[];
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValue.filter(Boolean));
  const { triggerRef, pos } = useMenuPosition(open);
  const labels = selected
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  const summary =
    labels.length === 0 ? placeholder : labels.length <= 2 ? labels.join(", ") : `${labels[0]} +${labels.length - 1}`;

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      {name
        ? selected.map((value) => <input key={value} type="hidden" name={name} value={value} />)
        : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(field, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={cn("truncate", selected.length ? "text-ink" : "text-muted")}>{summary}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      <MenuPortal open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} pos={pos}>
        <button
          type="button"
          role="option"
          aria-selected={selected.length === 0}
          onClick={() => setSelected([])}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm",
            selected.length === 0 ? "bg-sand text-brown" : "text-ink hover:bg-paper",
          )}
        >
          Unassigned
          {selected.length === 0 ? <Check size={14} /> : null}
        </button>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => toggle(option.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm",
                active ? "bg-sand text-brown" : "text-ink hover:bg-paper",
              )}
            >
              {option.label}
              {active ? <Check size={14} /> : null}
            </button>
          );
        })}
      </MenuPortal>
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatKeyLabel(value: string) {
  const date = parseKey(value);
  return date ? formatDay(date) : value;
}

function monthCells(cursor: Date) {
  const start = startOfMonth(cursor);
  const weekday = (start.getDay() + 6) % 7;
  const gridStart = addDays(start, -weekday);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function DatePicker({
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Pick a date",
  className,
  required,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value ?? uncontrolled;
  const selectedDate = selected ? parseKey(selected) : null;
  const [cursor, setCursor] = useState(() => selectedDate ?? new Date());
  const { triggerRef, pos } = useMenuPosition(open, 292);

  function choose(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  function clear() {
    choose("");
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      {name ? (
        <input
          name={name}
          value={selected}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setCursor(selected ? (parseKey(selected) ?? new Date()) : new Date());
          setOpen((current) => !current);
        }}
        className={cn(field, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-muted")}>
          {selected ? formatKeyLabel(selected) : placeholder}
        </span>
        <CalendarDays size={16} className="shrink-0 text-muted" />
      </button>
      <MenuPortal
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        pos={pos}
        className="p-3"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className={iconBtn}
            onClick={() => setCursor((current) => addMonths(current, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="text-sm font-semibold capitalize text-brown">{formatMonthYear(cursor)}</p>
          <button
            type="button"
            className={iconBtn}
            onClick={() => setCursor((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-wide text-muted uppercase">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthCells(cursor).map((day) => {
            const key = todayKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = key === todayKey();
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => choose(key)}
                className={cn(
                  "grid h-9 place-items-center rounded-xl text-sm",
                  !inMonth && "text-muted/40",
                  inMonth && !isSelected && "text-ink hover:bg-paper",
                  isToday && !isSelected && "ring-1 ring-terracotta/40",
                  isSelected && "bg-brown font-semibold text-white",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
        {!required ? (
          <button
            type="button"
            onClick={clear}
            className="mt-3 w-full rounded-xl px-2 py-1.5 text-xs font-semibold text-muted hover:bg-paper hover:text-ink"
          >
            Clear date
          </button>
        ) : null}
      </MenuPortal>
    </div>
  );
}
