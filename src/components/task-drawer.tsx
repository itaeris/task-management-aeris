"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Trash2, LoaderCircle } from "lucide-react";
import { addComment, deleteTask, loadTaskDetail, updateTask } from "@/lib/actions/tasks";
import { deleteAttachment, uploadAttachment } from "@/lib/actions/attachments";
import { PRIORITIES, STATUSES, TASK_TYPES } from "@/lib/constants";
import { cn, formatBytes, formatDay } from "@/lib/utils";
import type { MemberDTO, SprintDTO, TaskDTO, TaskDetailDTO } from "@/lib/types";
import { Avatar, PriorityBadge, TypeBadge, btnGhost, field, iconBtn, Skeleton } from "@/components/ui";
import { PendingSubmit } from "@/components/pending-submit";
import { DatePicker, Select } from "@/components/fields";
import { TaskDrawerSkeleton } from "@/components/skeletons";
import { useSetActiveTask } from "@/components/presence";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function TaskDrawer({
  taskId,
  members,
  sprints,
  onClose,
  onChanged,
}: {
  taskId: string | null;
  members: MemberDTO[];
  sprints: SprintDTO[];
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [loaded, setLoaded] = useState<{ id: string; data: TaskDetailDTO } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const setActiveTask = useSetActiveTask();
  const detail = taskId && loaded?.id === taskId ? loaded.data : null;

  useEffect(() => {
    setActiveTask(taskId);
    return () => setActiveTask(null);
  }, [taskId, setActiveTask]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    loadTaskDetail(taskId).then((data) => {
      if (!cancelled) setLoaded({ id: taskId, data });
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function refresh() {
    if (!taskId) return;
    const data = await loadTaskDetail(taskId);
    setLoaded({ id: taskId, data });
    onChanged?.();
  }

  return (
    <AnimatePresence>
      {taskId ? (
      <motion.div
        key="task-drawer"
        className="fixed inset-0 z-50 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <button className="h-full flex-1 bg-black/30" onClick={onClose} aria-label="Close" />
        <motion.aside
          className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-paper shadow-2xl"
          initial={{ x: 32 }}
          animate={{ x: 0 }}
          exit={{ x: 32 }}
          transition={{ duration: 0.28, ease: easeOutSoft }}
        >
        {detail ? (
        <>
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Task detail
            </p>
            <h2 className="font-serif mt-1 text-2xl leading-tight">
              {detail.title}
            </h2>
          </div>
          <button type="button" className={iconBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

          <form
            key={[
              detail.id,
              detail.title,
              detail.description,
              detail.type,
              detail.priority,
              detail.status,
              detail.sprintId,
              detail.assignee?.id,
              detail.points,
              detail.startDate,
              detail.dueDate,
            ].join("|")}
            className="flex flex-1 flex-col gap-4 px-6 py-5"
            action={async (formData) => {
              await updateTask(detail.id, formData);
              await refresh();
            }}
          >
            <label className="text-xs font-semibold text-muted">Title</label>
            <input name="title" className={field} defaultValue={detail.title} />

            <label className="text-xs font-semibold text-muted">Description</label>
            <textarea
              name="description"
              rows={4}
              className={field}
              defaultValue={detail.description}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                name="type"
                defaultValue={detail.type}
                options={TASK_TYPES.map((item) => ({ value: item.id, label: item.label }))}
              />
              <Select
                name="priority"
                defaultValue={detail.priority}
                options={PRIORITIES.map((item) => ({ value: item.id, label: item.label }))}
              />
              <Select
                name="status"
                defaultValue={detail.status}
                options={STATUSES.map((item) => ({ value: item.id, label: item.label }))}
              />
              <Select
                name="sprintId"
                defaultValue={detail.sprintId ?? ""}
                placeholder="No sprint"
                options={[
                  { value: "", label: "No sprint" },
                  ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
                ]}
              />
              <Select
                name="assigneeId"
                defaultValue={detail.assignee?.id ?? ""}
                placeholder="Unassigned"
                options={[
                  { value: "", label: "Unassigned" },
                  ...members.map((member) => ({ value: member.id, label: member.name })),
                ]}
              />
              <input
                name="points"
                type="number"
                min={0}
                className={field}
                placeholder="Story points"
                defaultValue={detail.points ?? ""}
              />
              <DatePicker
                name="startDate"
                defaultValue={dateInput(detail.startDate)}
                placeholder="Start date"
              />
              <DatePicker
                name="dueDate"
                defaultValue={dateInput(detail.dueDate)}
                placeholder="Due date"
              />
            </div>

            <PendingSubmit idle="Save changes" busy="Saving…" className="self-start" />
          </form>

          <div className="border-t border-line px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Attachment</h3>
              <button className={btnGhost} onClick={() => fileRef.current?.click()}>
                <Paperclip size={14} /> Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const data = new FormData();
                  data.append("file", file);
                  startTransition(async () => {
                    await uploadAttachment(detail.id, data);
                    await refresh();
                  });
                  event.target.value = "";
                }}
              />
            </div>
            <ul className="space-y-2">
              {detail.attachments.length === 0 ? (
                <li className="text-sm text-muted">No files yet.</li>
              ) : (
                detail.attachments.map((file) => (
                  <li key={file.id} className="flex items-center justify-between rounded-2xl border border-line bg-paper px-3 py-2">
                    <a href={`/api/files/${file.id}`} target="_blank" className="min-w-0 truncate text-sm font-medium hover:underline">
                      {file.filename}
                    </a>
                    <span className="ml-3 shrink-0 text-xs text-muted">{formatBytes(file.size)}</span>
                    <button
                      className="ml-2 text-muted hover:text-red-700 dark:hover:text-red-400"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteAttachment(file.id);
                          await refresh();
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="border-t border-line px-6 py-5">
            <h3 className="mb-3 text-sm font-semibold">Collaboration — comments</h3>
            <ul className="space-y-3">
              {detail.comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <Avatar {...comment.user} size="sm" />
                  <div className="flex-1 rounded-2xl bg-paper px-3 py-2">
                    <p className="text-xs text-muted">
                      {comment.user.name} · {formatDay(comment.createdAt)}
                    </p>
                    <p className="text-sm">{comment.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              action={async (formData) => {
                await addComment(detail.id, formData);
                await refresh();
              }}
            >
              <input name="body" className={field} placeholder="Write a comment..." />
              <PendingSubmit idle="Send" busy="Sending…" />
            </form>
          </div>

          <div className="mt-auto border-t border-line px-6 py-4">
            <button
              className={cn(btnGhost, "text-red-700 dark:text-red-400")}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteTask(detail.id);
                  onChanged?.();
                  onClose();
                })
              }
            >
              {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {pending ? "Deleting…" : "Delete task"}
            </button>
          </div>
        </>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  Task detail
                </p>
                <Skeleton className="mt-2 h-8 w-3/4" />
              </div>
              <button type="button" className={iconBtn} onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
            <TaskDrawerSkeleton />
          </>
        )}
        </motion.aside>
      </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function TaskChip({
  task,
  onOpen,
}: {
  task: TaskDTO;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(task.id);
      }}
      className="w-full cursor-pointer rounded-2xl border border-line bg-paper p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug">{task.title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{task.points ? `${task.points} pt` : "No points"}</span>
        {task.dueDate ? <span>{formatDay(task.dueDate)}</span> : <span />}
        {task.assignee ? (
          <Avatar {...task.assignee} size="sm" />
        ) : (
          <span className="h-7 w-7 rounded-full border border-dashed border-line" />
        )}
      </div>
    </div>
  );
}
