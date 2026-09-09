"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, formatMonthYear, startOfMonth } from "@/lib/utils";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { TaskDrawer } from "@/components/task-drawer";
import { iconBtn } from "@/components/ui";

export function CalendarView({
  tasks,
  members,
  sprints,
}: {
  tasks: TaskDTO[];
  members: MemberDTO[];
  sprints: SprintDTO[];
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Calendar</h1>
          <p className="text-sm text-muted">Deadline task per tanggal. Klik item untuk detail.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={iconBtn} onClick={() => setCursor(addMonths(cursor, -1))} aria-label="Bulan sebelumnya">
            ‹
          </button>
          <p className="min-w-40 text-center font-semibold capitalize">{formatMonthYear(cursor)}</p>
          <button type="button" className={iconBtn} onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Bulan berikutnya">
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold tracking-wide text-muted uppercase">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-28 rounded-2xl border border-line p-2 ${cell.inMonth ? "bg-white/80" : "bg-paper-2/50 opacity-70"}`}
          >
            <p className="text-xs font-semibold text-muted">{cell.date.getDate()}</p>
            <div className="mt-1 space-y-1">
              {cell.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setOpenId(task.id)}
                  className="block w-full truncate rounded-lg bg-white px-1.5 py-1 text-left text-[11px] font-medium hover:bg-terracotta hover:text-white"
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>
        ))}
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
