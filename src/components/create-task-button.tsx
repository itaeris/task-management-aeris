"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import { PRIORITIES, STATUSES, TASK_TYPES } from "@/lib/constants";
import type { MemberDTO, SprintDTO } from "@/lib/types";
import { DatePicker, MultiSelect, Select } from "@/components/fields";
import { btnGhost, btnPrimary, field, surface } from "@/components/ui";
import { PendingSubmit, FormBusy } from "@/components/pending-submit";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";
import { notifyChange } from "@/components/toast";

export function CreateTaskButton({
  projectId,
  members,
  sprints,
  defaultStatus = "backlog",
  defaultSprintId,
}: {
  projectId: string;
  members: MemberDTO[];
  sprints: SprintDTO[];
  defaultStatus?: string;
  defaultSprintId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={btnPrimary} onClick={() => setOpen(true)}>
        <Plus size={16} /> New task
      </button>
      <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.form
            className={cn(surface, "w-full max-w-lg rounded-3xl p-6")}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: easeOutSoft }}
            action={async (formData) => {
              await notifyChange(createTask(projectId, formData), "Task created");
              setOpen(false);
              router.refresh();
            }}
          >
            <FormBusy>
            <h2 className="font-serif text-2xl">New task</h2>
            <p className="mb-4 text-sm text-muted">Added to the product log. You can assign it to a sprint right away.</p>
            <div className="grid gap-3">
              <input name="title" className={field} placeholder="Title" required />
              <textarea name="description" className={field} rows={3} placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  name="type"
                  defaultValue="story"
                  options={TASK_TYPES.map((item) => ({ value: item.id, label: item.label }))}
                />
                <Select
                  name="priority"
                  defaultValue="medium"
                  options={PRIORITIES.map((item) => ({ value: item.id, label: item.label }))}
                />
                <Select
                  name="status"
                  defaultValue={defaultStatus}
                  options={STATUSES.map((item) => ({ value: item.id, label: item.label }))}
                />
                <Select
                  name="sprintId"
                  defaultValue={defaultSprintId ?? ""}
                  placeholder="No sprint"
                  options={[
                    { value: "", label: "No sprint" },
                    ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
                  ]}
                />
                <MultiSelect
                  name="assigneeIds"
                  defaultValue={[]}
                  placeholder="Unassigned"
                  options={members.map((member) => ({ value: member.id, label: member.name }))}
                />
                <input name="points" type="number" min={0} className={field} placeholder="Points" />
                <DatePicker name="startDate" placeholder="Start date" />
                <DatePicker name="dueDate" placeholder="Due date" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <PendingSubmit idle="Save" busy="Creating…" />
            </div>
            </FormBusy>
          </motion.form>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </>
  );
}
