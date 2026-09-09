"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, cn, startOfDay } from "@/lib/utils";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { TaskDrawer } from "@/components/task-drawer";
import { Avatar, surface } from "@/components/ui";

export function TimelineView({
  tasks,
  members,
  sprints,
}: {
  tasks: TaskDTO[];
  members: MemberDTO[];
  sprints: SprintDTO[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const ranged = tasks.filter((task) => task.startDate || task.dueDate);

  const { start, days } = useMemo(() => {
    const dates = ranged.flatMap((task) => [task.startDate, task.dueDate]).filter(Boolean) as string[];
    const min = dates.length
      ? startOfDay(new Date(Math.min(...dates.map((value) => new Date(value).getTime()))))
      : startOfDay(new Date());
    const max = dates.length
      ? startOfDay(new Date(Math.max(...dates.map((value) => new Date(value).getTime()))))
      : addDays(min, 21);
    const paddedStart = addDays(min, -2);
    const paddedEnd = addDays(max, 3);
    const total = Math.max(14, Math.round((paddedEnd.getTime() - paddedStart.getTime()) / 86400000));
    return { start: paddedStart, days: total };
  }, [ranged]);

  const dayWidth = 36;
  const width = days * dayWidth;
  const today = startOfDay(new Date());
  const weekdayLetters = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl">Timeline</h1>
        <p className="text-sm text-muted">Simple Gantt from start date to due date.</p>
      </div>
      <div className={cn(surface, "overflow-x-auto rounded-3xl")}>
        <div className="min-w-full" style={{ width: width + 240 }}>
          <div className="sticky top-0 z-10 flex border-b border-line bg-paper-2/90">
            <div className="w-60 shrink-0 px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">
              Task
            </div>
            <div className="flex">
              {Array.from({ length: days }, (_, index) => {
                const date = addDays(start, index);
                const isToday = date.getTime() === today.getTime();
                const isFirstOfMonth = date.getDate() === 1;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col items-center justify-end gap-0.5 border-l border-line px-0.5 py-2",
                      weekend && "bg-sand/40",
                    )}
                    style={{ width: dayWidth }}
                  >
                    <span className="text-[9px] font-semibold tracking-wide text-muted uppercase">
                      {isFirstOfMonth || index === 0
                        ? date.toLocaleString("en-US", { month: "short" })
                        : weekdayLetters[date.getDay()]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                        isToday ? "bg-terracotta text-white" : "text-ink",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {ranged.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">No tasks with a start or due date yet.</p>
          ) : (
            ranged.map((task) => {
              const from = startOfDay(new Date(task.startDate ?? task.dueDate ?? start));
              const to = startOfDay(new Date(task.dueDate ?? task.startDate ?? start));
              const offset = Math.max(0, Math.round((from.getTime() - start.getTime()) / 86400000));
              const span = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
              const barWidth = span * dayWidth;
              return (
                <div key={task.id} className="flex items-center border-t border-line">
                  <button
                    className="w-60 shrink-0 truncate px-4 py-3.5 text-left text-sm font-medium hover:text-terracotta"
                    onClick={() => setOpenId(task.id)}
                  >
                    {task.title}
                  </button>
                  <div className="relative h-14" style={{ width }}>
                    <button
                      onClick={() => setOpenId(task.id)}
                      title={task.title}
                      className="absolute top-1/2 h-8 -translate-y-1/2 overflow-hidden rounded-full bg-terracotta/90 text-left text-[11px] leading-none font-semibold text-white"
                      style={{ left: offset * dayWidth, width: barWidth }}
                    >
                      <span className="flex h-full min-w-0 items-center gap-1.5 overflow-hidden px-2">
                        {barWidth >= 64 && task.assignee ? <Avatar {...task.assignee} size="xs" /> : null}
                        <span className="min-w-0 truncate whitespace-nowrap">{task.title}</span>
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <TaskDrawer
        taskId={openId}
        members={members}
        sprints={sprints}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}
