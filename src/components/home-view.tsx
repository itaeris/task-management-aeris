"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { createProject, joinProject } from "@/lib/actions/projects";
import { AvatarStack, btnGhost, btnPrimary, field, iconBtn, surface } from "@/components/ui";
import { IconPicker, ProjectIconEditor } from "@/components/icon-picker";
import { PresenceBoard, PresenceProvider } from "@/components/presence";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft, FadeIn } from "@/components/motion";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

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
  const width = `${Math.max(value, value > 0 ? 4 : 0)}%`;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-paper-2">
        <motion.div
          className="h-full rounded-full bg-terracotta"
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.55, ease: easeOutSoft }}
        />
      </div>
      <p className="w-16 shrink-0 text-right text-[11px] font-semibold tabular-nums text-ink sm:w-[4.75rem] sm:text-xs">
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

const PAGE_SIZE = 6;

export function HomeProjects({
  user,
  projects,
}: {
  user: UserCard;
  projects: ProjectCard[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const mine = projects.filter((project) => project.role === "owner");
  const others = projects.filter((project) => project.role !== "owner");
  const mineProgress = rollup(mine);
  const othersProgress = rollup(others);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.description,
        project.ownerName ?? "",
        project.role === "owner" ? "yours" : "joined",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <PresenceProvider>
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-3 p-3 sm:p-4 lg:h-dvh lg:overflow-hidden">
        <FadeIn className="shrink-0">
        <header className="flex shrink-0 items-center gap-2 rounded-3xl border border-line bg-paper/80 px-3 py-2.5 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLockup />
          </div>
          <div className="hidden min-w-0 flex-1 md:flex">
            <PresenceBoard variant="header" />
          </div>
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <UserMenu user={user} />
            <ThemeToggle />
          </div>
        </header>
        </FadeIn>

        <FadeIn delay={0.02} className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3">
          <article className={cn(surface, "rounded-2xl px-3 py-2.5 sm:rounded-3xl sm:px-4 sm:py-3")}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
              <p className="text-[10px] font-semibold tracking-wide text-muted uppercase sm:text-[11px]">Your projects</p>
              <p className="text-sm font-semibold">{mine.length}</p>
            </div>
            <ProgressBar done={mineProgress.done} total={mineProgress.total} />
          </article>
          <article className={cn(surface, "rounded-2xl px-3 py-2.5 sm:rounded-3xl sm:px-4 sm:py-3")}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
              <p className="text-[10px] font-semibold tracking-wide text-muted uppercase sm:text-[11px]">Following</p>
              <p className="text-sm font-semibold">{others.length} joined</p>
            </div>
            <ProgressBar done={othersProgress.done} total={othersProgress.total} />
          </article>
        </FadeIn>

        <FadeIn delay={0.04} className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className={cn(surface, "flex min-h-[24rem] flex-col overflow-hidden rounded-3xl lg:min-h-0")}>
            <div className="flex shrink-0 flex-col gap-2 border-b border-line px-3 py-3 sm:flex-row sm:items-center sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif shrink-0 text-xl">Project</h2>
                <p className="text-sm text-muted sm:hidden">
                  {filtered.length}/{projects.length}
                </p>
              </div>
              <label className="relative min-w-0 flex-1">
                <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  className={cn(field, "h-10 pl-9")}
                  placeholder="Search projects…"
                  aria-label="Search projects"
                />
              </label>
              <p className="hidden shrink-0 text-sm text-muted sm:block">
                {filtered.length} of {projects.length}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-semibold">No projects yet</p>
                    <p className="mt-1 text-sm text-muted">Create one or join with a share code.</p>
                  </div>
                </div>
              ) : paged.length === 0 ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-semibold">No matches</p>
                    <p className="mt-1 text-sm text-muted">Try another term, or clear the search.</p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                  {paged.map((project) => (
                    <motion.li
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: easeOutSoft }}
                    >
                      <article className="rounded-2xl px-2 py-3 transition hover:bg-sand sm:px-3">
                        <div className="flex items-center gap-3">
                          <ProjectIconEditor
                            projectId={project.id}
                            value={project.color}
                            canEdit={project.role === "owner"}
                            size="sm"
                          />
                          <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <h3 className="truncate font-semibold">{project.name}</h3>
                              <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase sm:inline">
                                {project.role === "owner" ? "Yours" : "Joined"}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted">{project.description}</p>
                          </Link>
                          <div className="hidden sm:block">
                            <AvatarStack members={project.members} />
                          </div>
                        </div>
                        <div className="mt-3 sm:pl-11">
                          <ProgressBar done={project.doneCount} total={project.taskCount} />
                          <p className="mt-1 truncate text-[11px] text-muted">
                            {project.role === "owner" ? "Yours" : "Joined"}
                            {" · "}
                            {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
                            {project.role !== "owner" && project.ownerName ? ` · owner ${project.ownerName}` : ""}
                          </p>
                        </div>
                      </article>
                    </motion.li>
                  ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 sm:px-4 sm:py-2.5">
              <p className="text-xs text-muted">
                {filtered.length === 0 ? "No results" : `Page ${currentPage} of ${pageCount}`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={iconBtn}
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1)
                  .filter((number) => {
                    if (pageCount <= 5) return true;
                    return number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1;
                  })
                  .reduce<number[]>((list, number, index, source) => {
                    if (index > 0 && number - source[index - 1] > 1) list.push(-source[index - 1]);
                    list.push(number);
                    return list;
                  }, [])
                  .map((number) =>
                    number < 0 ? (
                      <span key={`gap-${number}`} className="hidden px-1 text-sm text-muted sm:inline">
                        …
                      </span>
                    ) : (
                      <button
                        key={number}
                        type="button"
                        onClick={() => setPage(number)}
                        className={cn(
                          "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold",
                          number === currentPage ? "bg-terracotta text-white" : "text-muted hover:bg-sand",
                        )}
                      >
                        {number}
                      </button>
                    ),
                  )}
                <button
                  type="button"
                  className={iconBtn}
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <aside className={cn(surface, "flex min-h-0 flex-col overflow-hidden rounded-3xl")}>
            <form action={createProject} className="min-h-0 flex-1 overflow-y-auto p-4">
              <h2 className="font-serif text-xl">New project</h2>
              <div className="mt-3 grid gap-2">
                <input name="name" className={field} placeholder="Project name" required />
                <textarea name="description" className={field} rows={2} placeholder="Product summary" />
                <IconPicker compact />
                <button className={cn(btnPrimary, "w-full")}>Create project</button>
              </div>
            </form>
            <form action={joinProject} className="shrink-0 border-t border-line p-4">
              <h2 className="text-sm font-semibold">Join with a code</h2>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input name="code" className={cn(field, "uppercase")} placeholder="XXXX-XXXX" required />
                <button className={cn(btnGhost, "shrink-0")}>Join</button>
              </div>
            </form>
          </aside>
        </FadeIn>
      </main>
    </PresenceProvider>
  );
}
