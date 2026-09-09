"use client";

import { useState } from "react";
import { Check, Link2, RefreshCw } from "lucide-react";
import { addGroupMember, removeGroupMember } from "@/lib/actions/groups";
import { leaveProject, rotateShareCode, updateProject } from "@/lib/actions/projects";
import {
  ACCESS_LABEL,
  ACCESS_OPTIONS,
  canLeaveProject,
  parseProjectAccess,
  type ProjectAccess,
} from "@/lib/access";
import type { MemberDTO } from "@/lib/types";
import { Avatar, btnGhost, field, surface } from "@/components/ui";
import { PendingSubmit } from "@/components/pending-submit";
import { IconPicker } from "@/components/icon-picker";
import { DEFAULT_PROJECT_ICON, parseProjectMark } from "@/lib/project-icon";
import { cn } from "@/lib/utils";

type GroupOption = {
  id: string;
  name: string;
  memberCount: number;
};

type Person = {
  id: string;
  name: string;
  email: string;
};

function AccessCopy({ access, groupName }: { access: ProjectAccess; groupName: string | null }) {
  if (access === "organization") {
    return "Everyone in this workspace can open this project. A share code is optional for extra invites.";
  }
  if (access === "group") {
    return `${groupName ? `Everyone in ${groupName}` : "Everyone in the group"} can open this project without a share code.`;
  }
  return "Invite the team with a code or link. Every member can comment, upload files, and fill in daily check.";
}

export function SharePanel({
  projectId,
  name,
  description,
  shareCode,
  color,
  role,
  access,
  groupId,
  groupName,
  membershipSource,
  members,
  groupMembers,
  groups,
  people,
  currentUserId,
}: {
  projectId: string;
  name: string;
  description: string;
  shareCode: string;
  color: string;
  role: string;
  access: ProjectAccess;
  groupId: string | null;
  groupName: string | null;
  membershipSource: string;
  members: MemberDTO[];
  groupMembers: MemberDTO[];
  groups: GroupOption[];
  people: Person[];
  currentUserId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [nextAccess, setNextAccess] = useState<ProjectAccess>(access);
  const [nextGroupId, setNextGroupId] = useState(groupId ?? groups[0]?.id ?? "new");
  const mark = parseProjectMark(color);
  const selectedIcon = mark.type === "flaticon" ? mark.id : DEFAULT_PROJECT_ICON;
  const shareUrl =
    typeof window === "undefined" ? `/join/${shareCode}` : `${window.location.origin}/join/${shareCode}`;
  const showLeave = canLeaveProject(parseProjectAccess(access), role, membershipSource);
  const makingNewGroup = nextAccess === "group" && nextGroupId === "new";
  const groupIds = new Set(groupMembers.map((member) => member.id));
  const addable = people.filter((person) => person.id !== currentUserId && !groupIds.has(person.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className={cn(surface, "rounded-3xl p-6")}>
        <h1 className="font-serif text-3xl">Share & collaboration</h1>
        <p className="mt-1 text-sm text-muted">
          <span className="font-semibold text-ink">{ACCESS_LABEL[access]}</span>
          {access === "group" && groupName ? ` · ${groupName}` : ""}.{" "}
          <AccessCopy access={access} groupName={groupName} />
        </p>
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-4 text-white">
          <p className="text-xs tracking-[0.18em] text-white/70 uppercase">Share code</p>
          <p className="font-serif mt-1 text-3xl tracking-[0.12em]">{shareCode}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-terracotta transition hover:bg-sand"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? "Copied" : "Copy link"}
            </button>
            {role === "owner" ? (
              <form action={async () => { await rotateShareCode(projectId); }}>
                <button className={cn(btnGhost, "border-white/40 text-white hover:bg-white/10")}>
                  <RefreshCw size={14} /> Rotate code
                </button>
              </form>
            ) : null}
          </div>
        </div>
        {role === "owner" ? (
          <form className="mt-6 grid gap-3" action={(formData) => updateProject(projectId, formData)}>
            <input name="name" className={field} defaultValue={name} />
            <textarea name="description" className={field} rows={4} defaultValue={description} />
            <IconPicker defaultValue={selectedIcon} />
            <fieldset className="grid gap-1.5">
              <legend className="text-[11px] font-semibold tracking-wide text-muted uppercase">Access</legend>
              {ACCESS_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border px-3 py-2 transition",
                    nextAccess === option.id ? "border-terracotta/50 bg-sand" : "border-line hover:bg-sand/60",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="access"
                      value={option.id}
                      checked={nextAccess === option.id}
                      onChange={() => setNextAccess(option.id)}
                      className="accent-terracotta"
                    />
                    <span className="text-sm font-semibold">{option.label}</span>
                  </span>
                  <span className="mt-0.5 block pl-6 text-[11px] leading-snug text-muted">{option.hint}</span>
                </label>
              ))}
            </fieldset>
            {nextAccess === "group" ? (
              <div className="grid gap-2 rounded-2xl border border-line p-3">
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">Group</span>
                  <select
                    name="groupId"
                    className={field}
                    value={nextGroupId}
                    onChange={(event) => setNextGroupId(event.target.value)}
                  >
                    {groupId ? <option value={groupId}>{groupName ?? "Current group"}</option> : null}
                    {groups
                      .filter((group) => group.id !== groupId)
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.memberCount})
                        </option>
                      ))}
                    <option value="new">Create a new group</option>
                  </select>
                </label>
                {makingNewGroup ? (
                  <>
                    <input name="groupName" className={field} placeholder="Group name" required />
                    {people
                      .filter((person) => person.id !== currentUserId)
                      .map((person) => (
                        <label key={person.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" name="members" value={person.id} className="accent-terracotta" />
                          <span className="truncate">{person.name}</span>
                        </label>
                      ))}
                  </>
                ) : null}
              </div>
            ) : null}
            <PendingSubmit idle="Save project" busy="Saving…" className="self-start" />
          </form>
        ) : showLeave ? (
          <form className="mt-6" action={leaveProject.bind(null, projectId)}>
            <button className={cn(btnGhost, "text-red-700 dark:text-red-400")}>Leave project</button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">
            {access === "organization"
              ? "This project is open to the whole organization, so you cannot leave it."
              : "This project is open to your group, so you cannot leave it from here."}
          </p>
        )}
      </section>
      <div className="grid gap-6">
        <section className={cn(surface, "rounded-3xl p-6")}>
          <h2 className="font-serif text-2xl">Members</h2>
          <ul className="mt-4 space-y-3">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar {...member} />
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-xs text-muted">
                    {member.email} · {member.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {access === "group" && role === "owner" && groupId ? (
          <section className={cn(surface, "rounded-3xl p-6")}>
            <h2 className="font-serif text-2xl">Group</h2>
            <p className="mt-1 text-sm text-muted">
              People in {groupName ?? "this group"} can open every project linked to it.
            </p>
            <ul className="mt-4 space-y-3">
              {groupMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar {...member} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{member.name}</p>
                    <p className="truncate text-xs text-muted">{member.email}</p>
                  </div>
                  {member.id !== currentUserId ? (
                    <form action={removeGroupMember.bind(null, projectId, member.id)}>
                      <button className="text-xs font-semibold text-red-700 dark:text-red-400">Remove</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
            {addable.length > 0 ? (
              <form className="mt-4 flex gap-2" action={addGroupMember.bind(null, projectId)}>
                <select name="userId" className={cn(field, "min-w-0 flex-1")} defaultValue={addable[0]?.id}>
                  {addable.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <PendingSubmit idle="Add" busy="Adding…" variant="ghost" className="shrink-0" />
              </form>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
