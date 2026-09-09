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

  const dayWidth = 28;
  const width = days * dayWidth;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl">Timeline</h1>
        <p className="text-sm text-muted">Gantt sederhana dari start date ke due date.</p>
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
                const isMonday = date.getDay() === 1;
                return (
                  <div
                    key={index}
                    className="border-l border-line px-1 py-3 text-[10px] text-muted"
                    style={{ width: dayWidth }}
                  >
                    {isMonday || index === 0 ? date.getDate() : ""}
                  </div>
                );
              })}
            </div>
          </div>
          {ranged.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">Belum ada task dengan tanggal mulai/selesai.</p>
          ) : (
            ranged.map((task) => {
              const from = startOfDay(new Date(task.startDate ?? task.dueDate ?? start));
              const to = startOfDay(new Date(task.dueDate ?? task.startDate ?? start));
              const offset = Math.max(0, Math.round((from.getTime() - start.getTime()) / 86400000));
              const span = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
              return (
                <div key={task.id} className="flex items-center border-t border-line">
                  <button
                    className="w-60 shrink-0 truncate px-4 py-3 text-left text-sm font-medium hover:text-terracotta"
                    onClick={() => setOpenId(task.id)}
                  >
                    {task.title}
                  </button>
                  <div className="relative h-12" style={{ width }}>
                    <button
                      onClick={() => setOpenId(task.id)}
                      className="absolute top-3 h-6 rounded-full bg-terracotta/90 text-left text-[10px] font-semibold text-white"
                      style={{ left: offset * dayWidth, width: span * dayWidth }}
                    >
                      <span className="flex h-full items-center gap-1 overflow-hidden px-2">
                        {task.assignee ? <Avatar {...task.assignee} size="sm" /> : null}
                        <span className="truncate">{task.title}</span>
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
