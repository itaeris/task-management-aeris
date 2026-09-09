"use client";

import { useMemo, useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { ACCESS_OPTIONS, type ProjectAccess } from "@/lib/access";
import { btnPrimary, field } from "@/components/ui";
import { IconPicker } from "@/components/icon-picker";
import { cn } from "@/lib/utils";

type Person = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
};

type GroupOption = {
  id: string;
  name: string;
  memberCount: number;
};

export function CreateProjectForm({
  userId,
  people,
  groups,
}: {
  userId: string;
  people: Person[];
  groups: GroupOption[];
}) {
  const [access, setAccess] = useState<ProjectAccess>("personal");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "new");
  const others = useMemo(() => people.filter((person) => person.id !== userId), [people, userId]);
  const makingNewGroup = access === "group" && (groups.length === 0 || groupId === "new");

  return (
    <form action={createProject} className="min-h-0 flex-1 overflow-y-auto p-4">
      <h2 className="font-serif text-xl">New project</h2>
      <div className="mt-3 grid gap-2">
        <input name="name" className={field} placeholder="Project name" required />
        <textarea name="description" className={field} rows={2} placeholder="Product summary" />
        <IconPicker compact />
        <fieldset className="grid gap-1.5">
          <legend className="text-[11px] font-semibold tracking-wide text-muted uppercase">Access</legend>
          {ACCESS_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={cn(
                "cursor-pointer rounded-2xl border px-3 py-2 transition",
                access === option.id ? "border-terracotta/50 bg-sand" : "border-line hover:bg-sand/60",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="access"
                  value={option.id}
                  checked={access === option.id}
                  onChange={() => setAccess(option.id)}
                  className="accent-terracotta"
                />
                <span className="text-sm font-semibold">{option.label}</span>
              </span>
              <span className="mt-0.5 block pl-6 text-[11px] leading-snug text-muted">{option.hint}</span>
            </label>
          ))}
        </fieldset>
        {access === "group" ? (
          <div className="grid gap-2 rounded-2xl border border-line p-3">
            {groups.length > 0 ? (
              <label className="grid gap-1">
                <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">Group</span>
                <select
                  name="groupId"
                  className={field}
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.memberCount})
                    </option>
                  ))}
                  <option value="new">Create a new group</option>
                </select>
              </label>
            ) : (
              <input type="hidden" name="groupId" value="new" />
            )}
            {makingNewGroup ? (
              <>
                <input name="groupName" className={field} placeholder="Group name" required />
                {others.length > 0 ? (
                  <fieldset className="grid max-h-36 gap-1 overflow-y-auto">
                    <legend className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                      People in this group
                    </legend>
                    {others.map((person) => (
                      <label key={person.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" name="members" value={person.id} className="accent-terracotta" />
                        <span className="truncate">{person.name}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <p className="text-[11px] text-muted">You can add people to the group later on Share.</p>
                )}
              </>
            ) : null}
          </div>
        ) : null}
        <button className={cn(btnPrimary, "w-full")}>Create project</button>
      </div>
    </form>
  );
}
