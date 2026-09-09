"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import { PRIORITIES, STATUSES, TASK_TYPES } from "@/lib/constants";
import type { MemberDTO, SprintDTO } from "@/lib/types";
import { DatePicker, Select } from "@/components/fields";
import { btnGhost, btnPrimary, field, surface } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={btnPrimary} onClick={() => setOpen(true)}>
        <Plus size={16} /> Task baru
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            className={cn(surface, "w-full max-w-lg rounded-3xl p-6")}
            action={async (formData) => {
              await createTask(projectId, formData);
              setOpen(false);
            }}
          >
            <h2 className="font-serif text-2xl">Task baru</h2>
            <p className="mb-4 text-sm text-muted">Masuk ke product log, bisa langsung di-assign ke sprint.</p>
            <div className="grid gap-3">
              <input name="title" className={field} placeholder="Judul" required />
              <textarea name="description" className={field} rows={3} placeholder="Deskripsi" />
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
                  placeholder="Tanpa sprint"
                  options={[
                    { value: "", label: "Tanpa sprint" },
                    ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
                  ]}
                />
                <Select
                  name="assigneeId"
                  defaultValue=""
                  placeholder="Unassigned"
                  options={[
                    { value: "", label: "Unassigned" },
                    ...members.map((member) => ({ value: member.id, label: member.name })),
                  ]}
                />
                <input name="points" type="number" min={0} className={field} placeholder="Points" />
                <DatePicker name="startDate" placeholder="Tanggal mulai" />
                <DatePicker name="dueDate" placeholder="Due date" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
                Batal
              </button>
              <button className={btnPrimary}>Simpan</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
