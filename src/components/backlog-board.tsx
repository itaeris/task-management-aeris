"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Paperclip } from "lucide-react";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { cn, formatDay } from "@/lib/utils";
import { AvatarStack, PriorityBadge, StatusBadge, TypeBadge, field, surface } from "@/components/ui";
import { Select } from "@/components/fields";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskDrawer } from "@/components/task-drawer";

export function BacklogBoard({
  projectId,
  tasks,
  members,
  sprints,
}: {
  projectId: string;
  tasks: TaskDTO[];
  members: MemberDTO[];
  sprints: SprintDTO[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");

  const rows = useMemo(
    () =>
      tasks
        .filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))
        .filter((task) => (priority === "all" ? true : task.priority === priority))
        .sort((a, b) => a.rank - b.rank),
    [tasks, query, priority],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Product log</h1>
          <p className="text-sm text-muted">
            Backlog ordered by priority. Move items into a sprint from the task detail.
          </p>
        </div>
        <CreateTaskButton projectId={projectId} members={members} sprints={sprints} />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className={cn(field, "max-w-xs")}
          placeholder="Search items..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          className="w-44"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "all", label: "All priorities" },
            { value: "urgent", label: "Urgent" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />
      </div>
      <div className={cn(surface, "overflow-hidden rounded-3xl")}>
        <table className="w-full text-sm">
          <thead className="bg-paper-2/80 text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sprint</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Pts</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr
                key={task.id}
                className="cursor-pointer border-t border-line hover:bg-paper/70"
                onClick={() => setOpenId(task.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={task.type} />
                    <PriorityBadge priority={task.priority} />
                    <span className="font-semibold">{task.title}</span>
                  </div>
                  {task.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{task.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 text-muted">{task.sprintName ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{task.dueDate ? formatDay(task.dueDate) : "—"}</td>
                <td className="px-4 py-3">{task.points ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 text-muted">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MessageSquare size={12} /> {task.commentCount}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Paperclip size={12} /> {task.attachmentCount}
                    </span>
                    {task.assignees?.length ? <AvatarStack members={task.assignees} /> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
