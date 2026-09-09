"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSprint, updateSprintStatus } from "@/lib/actions/sprints";
import { cn, formatDay } from "@/lib/utils";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { StatusBadge, chip, field, surface } from "@/components/ui";
import { PendingSubmit } from "@/components/pending-submit";
import { DatePicker } from "@/components/fields";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskDrawer } from "@/components/task-drawer";

export function ScrumView({
  projectId,
  sprints,
  tasks,
  members,
}: {
  projectId: string;
  sprints: SprintDTO[];
  tasks: TaskDTO[];
  members: MemberDTO[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Scrum log</h1>
          <p className="text-sm text-muted">Sprint planning, goals, and items in this iteration.</p>
        </div>
        <CreateTaskButton
          projectId={projectId}
          members={members}
          sprints={sprints}
          defaultSprintId={sprints.find((sprint) => sprint.status === "active")?.id}
        />
      </div>

      <form
        className={cn(surface, "grid gap-3 rounded-3xl p-5 md:grid-cols-4")}
        action={(formData) => createSprint(projectId, formData)}
      >
        <input name="name" className={cn(field, "md:col-span-2")} placeholder="Sprint name" required />
        <DatePicker name="startDate" placeholder="Start date" required />
        <DatePicker name="endDate" placeholder="End date" required />
        <input name="goal" className={cn(field, "md:col-span-3")} placeholder="Sprint goal" />
        <PendingSubmit idle="Create sprint" busy="Creating…" />
      </form>

      <div className="grid gap-4">
        {sprints.map((sprint) => {
          const items = tasks.filter((task) => task.sprintId === sprint.id);
          const progress = sprint.taskCount === 0 ? 0 : Math.round((sprint.doneCount / sprint.taskCount) * 100);
          return (
            <section key={sprint.id} className={cn(surface, "rounded-3xl p-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl">{sprint.name}</h2>
                    <span className={cn(chip, "bg-paper-2 text-ink")}>{sprint.status}</span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-muted">{sprint.goal || "No goal yet."}</p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDay(sprint.startDate)} — {formatDay(sprint.endDate)} · {sprint.doneCount}/{sprint.taskCount} done
                  </p>
                </div>
                <div className="flex gap-2">
                  {sprint.status !== "active" ? (
                    <form action={updateSprintStatus.bind(null, projectId, sprint.id, "active")}>
                      <PendingSubmit idle="Activate" busy="Saving…" />
                    </form>
                  ) : null}
                  {sprint.status !== "completed" ? (
                    <form action={updateSprintStatus.bind(null, projectId, sprint.id, "completed")}>
                      <PendingSubmit idle="Complete" busy="Saving…" variant="ghost" />
                    </form>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full bg-forest" style={{ width: `${progress}%` }} />
              </div>
              <ul className="mt-4 divide-y divide-line">
                {items.length === 0 ? (
                  <li className="py-4 text-sm text-muted">No items in this sprint yet.</li>
                ) : (
                  items.map((task) => (
                    <li key={task.id}>
                      <button
                        className="flex w-full items-center justify-between gap-3 py-3 text-left"
                        onClick={() => setOpenId(task.id)}
                      >
                        <span className="font-medium">{task.title}</span>
                        <StatusBadge status={task.status} />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
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
