"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatTaskWhen } from "@/lib/utils";
import type { TaskDTO } from "@/lib/types";

type HoverTip = {
  title: string;
  detail: string;
  top: number;
  left: number;
};

export function taskRangeLabel(task: TaskDTO) {
  const from = task.startDate ? formatTaskWhen(task.startDate, task.allDay) : null;
  const to = task.dueDate ? formatTaskWhen(task.dueDate, task.allDay) : null;
  if (from && to && from !== to) return `${from} – ${to}`;
  return from ?? to ?? "";
}

export function taskHoverDetail(task: TaskDTO) {
  const range = taskRangeLabel(task);
  const names = task.assignees?.map((member) => member.name).filter(Boolean) ?? [];
  return [range, names.length ? names.join(", ") : null].filter(Boolean).join(" · ");
}

export function useTaskHoverTip() {
  const [tip, setTip] = useState<HoverTip | null>(null);
  const hideTimer = useRef<number>(0);

  function showTip(node: HTMLElement, task: TaskDTO) {
    window.clearTimeout(hideTimer.current);
    const rect = node.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2));
    const top = Math.max(12, rect.top - 8);
    setTip({ title: task.title, detail: taskHoverDetail(task), top, left });
  }

  function hideTip() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setTip(null), 80);
  }

  useEffect(() => {
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip]);

  const tooltip =
    tip && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[200] max-w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-full rounded-2xl border border-line bg-paper px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.18)]"
            style={{ top: tip.top, left: tip.left }}
          >
            <p className="text-sm font-semibold leading-snug text-ink">{tip.title}</p>
            {tip.detail ? <p className="mt-0.5 text-[11px] leading-snug text-muted">{tip.detail}</p> : null}
          </div>,
          document.body,
        )
      : null;

  return { showTip, hideTip, tooltip };
}
