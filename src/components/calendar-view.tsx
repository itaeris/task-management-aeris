"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, formatMonthYear, startOfMonth } from "@/lib/utils";
import type { ProjectAccess } from "@/lib/access";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { TaskDrawer } from "@/components/task-drawer";
import { iconBtn } from "@/components/ui";
import { GoogleCalendarConnect } from "@/components/google-calendar-connect";
import type { CalendarConnectionPublic } from "@/lib/types";

export function CalendarView({
  projectId,
  access,
  tasks,
  members,
  sprints,
  connection,
  calendarNotice,
  calendarError,
}: {
  projectId: string;
  access: ProjectAccess;
  tasks: TaskDTO[];
  members: MemberDTO[];
  sprints: SprintDTO[];
  connection: CalendarConnectionPublic;
  calendarNotice?: string;
  calendarError?: string;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);

  const cells = useMemo(() => {
    const start = startOfMonth(cursor);
    const weekday = (start.getDay() + 6) % 7;
    const first = new Date(start);
    first.setDate(start.getDate() - weekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayTasks = tasks.filter((task) => task.dueDate?.slice(0, 10) === key);
      return { date, key, inMonth: date.getMonth() === cursor.getMonth(), tasks: dayTasks };
    });
  }, [cursor, tasks]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Calendar</h1>
          <p className="text-sm text-muted">Task deadlines by date. Click an item for details.</p>
        </div>
        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:items-end">
          <GoogleCalendarConnect
            projectId={projectId}
            access={access}
            connection={connection}
            notice={calendarNotice}
            error={calendarError}
          />
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button type="button" className={iconBtn} onClick={() => setCursor(addMonths(cursor, -1))} aria-label="Previous month">
              ‹
            </button>
            <p className="min-w-0 flex-1 text-center font-semibold capitalize sm:min-w-40 sm:flex-none">{formatMonthYear(cursor)}</p>
            <button type="button" className={iconBtn} onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
              ›
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[36rem] sm:min-w-0">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wide text-muted uppercase sm:gap-2 sm:text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-1">
            <span className="sm:hidden">{day.slice(0, 1)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-20 rounded-xl border border-line p-1.5 sm:min-h-28 sm:rounded-2xl sm:p-2 ${cell.inMonth ? "bg-paper/80" : "bg-paper-2/50 opacity-70"}`}
          >
            <p className="text-xs font-semibold text-muted">{cell.date.getDate()}</p>
            <div className="mt-1 space-y-1">
              {cell.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setOpenId(task.id)}
                  className="block w-full truncate rounded-lg bg-paper px-1.5 py-1 text-left text-[11px] font-medium hover:bg-terracotta hover:text-white"
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
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
