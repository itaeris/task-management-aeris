"use client";

import { logout } from "@/lib/actions/identity";
import { createProject, joinProject } from "@/lib/actions/projects";
import { Avatar, AvatarStack, btnGhost, btnPrimary, field, surface } from "@/components/ui";
import { IconPicker, ProjectIconEditor } from "@/components/icon-picker";
import { PresenceBoard, PresenceProvider } from "@/components/presence";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ProjectCard = {
  id: string;
  name: string;
  description: string;
  color: string;
  shareCode: string;
  role: string;
  taskCount: number;
  doneCount: number;
  memberCount: number;
  ownerName: string | null;
  activeSprint: string | null;
  members: Array<{ name: string; initials: string; color: string }>;
};

type UserCard = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
};

function percent(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const value = percent(done, total);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-sky-100">
        <div className="h-full rounded-full bg-terracotta transition-[width]" style={{ width: `${Math.max(value, value > 0 ? 4 : 0)}%` }} />
      </div>
      <p className="w-[4.75rem] shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
        {done}/{total}
        <span className="ml-1 text-muted">{value}%</span>
      </p>
    </div>
  );
}

function rollup(projects: ProjectCard[]) {
  return projects.reduce(
    (acc, project) => {
      acc.done += project.doneCount;
      acc.total += project.taskCount;
      return acc;
    },
    { done: 0, total: 0 },
  );
}

export function HomeProjects({
  user,
  projects,
}: {
  user: UserCard;
  projects: ProjectCard[];
}) {
  const mine = projects.filter((project) => project.role === "owner");
  const others = projects.filter((project) => project.role !== "owner");
  const mineProgress = rollup(mine);
  const othersProgress = rollup(others);

  return (
    <PresenceProvider>
      <main className="relative flex h-dvh flex-col gap-3 overflow-hidden p-4">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-terracotta uppercase">Task Management</p>
            <h1 className="font-serif mt-0.5 text-2xl leading-tight">Hai, {user.name.split(" ")[0]}</h1>
          </div>
          <PresenceBoard variant="header" />
          <div className="flex shrink-0 items-center gap-2">
            <Avatar {...user} />
            <Link href="/settings" className={btnGhost}>
              Settings
            </Link>
            <form action={logout}>
              <button className={btnPrimary}>Keluar</button>
            </form>
          </div>
        </header>

        <section className="grid shrink-0 gap-3 md:grid-cols-2">
          <article className={cn(surface, "rounded-3xl px-4 py-3")}>
            <div className="mb-2 flex items-baseline gap-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Project kamu</p>
              <p className="text-sm font-semibold">{mine.length} project</p>
            </div>
            <ProgressBar done={mineProgress.done} total={mineProgress.total} />
          </article>
          <article className={cn(surface, "rounded-3xl px-4 py-3")}>
            <div className="mb-2 flex items-baseline gap-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Project orang lain</p>
              <p className="text-sm font-semibold">{others.length} diikuti</p>
            </div>
            <ProgressBar done={othersProgress.done} total={othersProgress.total} />
          </article>
        </section>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className={cn(surface, "flex min-h-0 flex-col overflow-hidden rounded-3xl")}>
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-serif text-xl">Project</h2>
              <p className="text-sm text-muted">{projects.length} total</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-semibold">Belum ada project</p>
                    <p className="mt-1 text-sm text-muted">Buat baru atau join lewat kode di kanan.</p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <article className="rounded-2xl px-3 py-3 transition hover:bg-sand">
                        <div className="flex items-center gap-3">
                          <ProjectIconEditor
                            projectId={project.id}
                            value={project.color}
                            canEdit={project.role === "owner"}
                            size="sm"
                          />
                          <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold">{project.name}</h3>
                              <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase">
                                {project.role === "owner" ? "Punya kamu" : "Diikuti"}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted">{project.description}</p>
                          </Link>
                          <AvatarStack members={project.members} />
                        </div>
                        <div className="mt-3 pl-11">
                          <ProgressBar done={project.doneCount} total={project.taskCount} />
                          <p className="mt-1 text-[11px] text-muted">
                            {project.memberCount} anggota
                            {project.role !== "owner" && project.ownerName ? ` · owner ${project.ownerName}` : ""}
                            {project.activeSprint ? ` · ${project.activeSprint}` : ""}
                          </p>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className={cn(surface, "flex min-h-0 flex-col overflow-hidden rounded-3xl")}>
            <form action={createProject} className="min-h-0 flex-1 overflow-y-auto p-4">
              <h2 className="font-serif text-xl">Project baru</h2>
              <div className="mt-3 grid gap-2">
                <input name="name" className={field} placeholder="Nama project" required />
                <textarea name="description" className={field} rows={2} placeholder="Ringkasan produk" />
                <IconPicker compact />
                <button className={cn(btnPrimary, "w-full")}>Buat project</button>
              </div>
            </form>
            <form action={joinProject} className="shrink-0 border-t border-line p-4">
              <h2 className="text-sm font-semibold">Join lewat kode</h2>
              <div className="mt-2 flex gap-2">
                <input name="code" className={cn(field, "uppercase")} placeholder="XXXX-XXXX" required />
                <button className={cn(btnGhost, "shrink-0")}>Gabung</button>
              </div>
            </form>
          </aside>
        </div>
      </main>
    </PresenceProvider>
  );
}
