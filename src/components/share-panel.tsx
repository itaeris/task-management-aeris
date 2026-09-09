"use client";

import { useState } from "react";
import { Check, Link2, RefreshCw } from "lucide-react";
import { leaveProject, rotateShareCode, updateProject } from "@/lib/actions/projects";
import type { MemberDTO } from "@/lib/types";
import { Avatar, btnGhost, btnPrimary, field, surface } from "@/components/ui";
import { IconPicker } from "@/components/icon-picker";
import { DEFAULT_PROJECT_ICON, parseProjectMark } from "@/lib/project-icon";
import { cn } from "@/lib/utils";

export function SharePanel({
  projectId,
  name,
  description,
  shareCode,
  color,
  role,
  members,
}: {
  projectId: string;
  name: string;
  description: string;
  shareCode: string;
  color: string;
  role: string;
  members: MemberDTO[];
}) {
  const [copied, setCopied] = useState(false);
  const mark = parseProjectMark(color);
  const selectedIcon = mark.type === "flaticon" ? mark.id : DEFAULT_PROJECT_ICON;
  const shareUrl =
    typeof window === "undefined" ? `/join/${shareCode}` : `${window.location.origin}/join/${shareCode}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className={cn(surface, "rounded-3xl p-6")}>
        <h1 className="font-serif text-3xl">Share & collaboration</h1>
        <p className="mt-1 text-sm text-muted">
          Invite the team with a code or link. Every member can comment, upload files, and fill in daily check.
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
            <button className={cn(btnPrimary, "self-start")}>Save project</button>
          </form>
        ) : (
          <form className="mt-6" action={leaveProject.bind(null, projectId)}>
            <button className={cn(btnGhost, "text-red-700 dark:text-red-400")}>Leave project</button>
          </form>
        )}
      </section>
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
    </div>
  );
}
