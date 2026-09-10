"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createSprint, deleteSprint, updateSprint, updateSprintStatus } from "@/lib/actions/sprints";
import { cn, formatDay, todayKey } from "@/lib/utils";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { StatusBadge, btnGhost, btnPrimary, chip, field, iconBtn, surface } from "@/components/ui";
import { PendingSubmit } from "@/components/pending-submit";
import { DatePicker } from "@/components/fields";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskDrawer } from "@/components/task-drawer";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";
import { notifyChange } from "@/components/toast";

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
  const [editing, setEditing] = useState<SprintDTO | null>(null);
  const [deleting, setDeleting] = useState<SprintDTO | null>(null);

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
        action={async (formData) => {
          await notifyChange(createSprint(projectId, formData), "Sprint created");
          router.refresh();
        }}
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
                    {formatDay(sprint.startDate)} — {formatDay(sprint.endDate)} · {sprint.doneCount}/{sprint.taskCount}{" "}
                    done
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={iconBtn}
                    aria-label={`Edit ${sprint.name}`}
                    onClick={() => setEditing(sprint)}
                  >
                    <Pencil size={16} />
                  </button>
                  {sprint.status !== "active" ? (
                    <form
                      action={async () => {
                        await notifyChange(
                          updateSprintStatus(projectId, sprint.id, "active"),
                          "Sprint activated",
                        );
                        router.refresh();
                      }}
                    >
                      <PendingSubmit idle="Activate" busy="Saving…" />
                    </form>
                  ) : null}
                  {sprint.status !== "completed" ? (
                    <form
                      action={async () => {
                        await notifyChange(
                          updateSprintStatus(projectId, sprint.id, "completed"),
                          "Sprint completed",
                        );
                        router.refresh();
                      }}
                    >
                      <PendingSubmit idle="Complete" busy="Saving…" variant="ghost" />
                    </form>
                  ) : null}
                  <button
                    type="button"
                    className={cn(iconBtn, "text-muted hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400")}
                    aria-label={`Delete ${sprint.name}`}
                    onClick={() => setDeleting(sprint)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full bg-forest" style={{ width: `${progress}%` }} />
              </div>
              <ul className="mt-3 -mx-1">
                {items.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-muted">No items in this sprint yet.</li>
                ) : (
                  items.map((task) => (
                    <li key={task.id} className="border-b border-line last:border-0">
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-sand focus-visible:bg-sand focus-visible:outline-none"
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
      <EditSprintDialog
        projectId={projectId}
        sprint={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      <DeleteSprintDialog
        projectId={projectId}
        sprint={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function EditSprintDialog({
  projectId,
  sprint,
  onClose,
  onSaved,
}: {
  projectId: string;
  sprint: SprintDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  useEffect(() => {
    if (!sprint) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sprint, onClose]);

  return (
    <AnimatePresence>
      {sprint ? (
        <EditSprintForm key={sprint.id} projectId={projectId} sprint={sprint} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </AnimatePresence>
  );
}

function EditSprintForm({
  projectId,
  sprint,
  onClose,
  onSaved,
}: {
  projectId: string;
  sprint: SprintDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-sprint-title"
        className={cn(surface, "w-full max-w-lg rounded-3xl p-6")}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: easeOutSoft }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="edit-sprint-title" className="font-serif text-2xl">
          Edit sprint
        </h2>
        <form
          className="mt-4 grid gap-3"
          action={async (formData) => {
            setError(null);
            try {
              await notifyChange(updateSprint(projectId, sprint.id, formData), "Sprint updated");
              onSaved();
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Could not update the sprint.");
            }
          }}
        >
          <input name="name" className={field} defaultValue={sprint.name} placeholder="Sprint name" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker
              name="startDate"
              placeholder="Start date"
              defaultValue={todayKey(new Date(sprint.startDate))}
              required
            />
            <DatePicker
              name="endDate"
              placeholder="End date"
              defaultValue={todayKey(new Date(sprint.endDate))}
              required
            />
          </div>
          <input name="goal" className={field} defaultValue={sprint.goal} placeholder="Sprint goal" />
          {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={onClose}>
              Cancel
            </button>
            <PendingSubmit idle="Save sprint" busy="Saving…" />
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteSprintDialog({
  projectId,
  sprint,
  onClose,
  onDeleted,
}: {
  projectId: string;
  sprint: SprintDTO | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  useEffect(() => {
    if (!sprint) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sprint, onClose]);

  return (
    <AnimatePresence>
      {sprint ? (
        <DeleteSprintForm
          key={sprint.id}
          projectId={projectId}
          sprint={sprint}
          onClose={onClose}
          onDeleted={onDeleted}
        />
      ) : null}
    </AnimatePresence>
  );
}

function DeleteSprintForm({
  projectId,
  sprint,
  onClose,
  onDeleted,
}: {
  projectId: string;
  sprint: SprintDTO;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-sprint-title"
        className={cn(surface, "w-full max-w-md rounded-3xl p-6")}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: easeOutSoft }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-sprint-title" className="font-serif text-2xl">
          Delete sprint
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Remove <span className="font-semibold text-ink">{sprint.name}</span>? Tasks in this sprint stay in the
          project and go back to the product log.
        </p>
        {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={cn(btnPrimary, "bg-red-600 hover:bg-red-700")}
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await notifyChange(deleteSprint(projectId, sprint.id), "Sprint deleted");
                  onDeleted();
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Could not delete the sprint.");
                }
              });
            }}
          >
            {pending ? "Deleting…" : "Delete sprint"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
