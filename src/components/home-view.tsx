"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pin, Search, Trash2 } from "lucide-react";
import { joinProject, toggleProjectPin } from "@/lib/actions/projects";
import { ACCESS_LABEL, ACCESS_OPTIONS, type ProjectAccess } from "@/lib/access";
import { AvatarStack, field, iconBtn, surface } from "@/components/ui";
import { CreateProjectForm } from "@/components/create-project-form";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { PendingSubmit } from "@/components/pending-submit";
import { ProjectIconEditor } from "@/components/icon-picker";
import { PresenceBoard, PresenceProvider } from "@/components/presence";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { usePersistSessionUser } from "@/lib/session-user";
import { notifyChange } from "@/components/toast";

type ProjectCard = {
  id: string;
  name: string;
  description: string;
  color: string;
  shareCode: string;
  role: string;
  access: ProjectAccess;
  pinned: boolean;
  groupName: string | null;
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

type GroupOption = {
  id: string;
  name: string;
  memberCount: number;
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
          initial={false}
          animate={{ width }}
          transition={{ duration: 0.35, ease: easeOutSoft }}
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

type AccessFilter = "all" | ProjectAccess;

const VIEW_FILTERS = [{ id: "all" as const, label: "All" }, ...ACCESS_OPTIONS];

export function HomeFrame({
  user,
  people,
  groups,
  children,
}: {
  user: UserCard;
  people: UserCard[];
  groups: GroupOption[];
  children: ReactNode;
}) {
  usePersistSessionUser(user);
  return (
    <PresenceProvider>
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-3 p-3 sm:p-4 lg:h-dvh lg:overflow-hidden">
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

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-h-0 min-w-0 flex-col gap-3">{children}</div>
          <aside className={cn(surface, "flex min-h-0 flex-col overflow-hidden rounded-3xl")}>
            <CreateProjectForm userId={user.id} people={people} groups={groups} />
            <form
              action={async (formData) => {
                await notifyChange(joinProject(formData), "Joined project");
              }}
              className="shrink-0 border-t border-line p-4"
            >
              <h2 className="text-sm font-semibold">Join with a code</h2>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input name="code" className={cn(field, "uppercase")} placeholder="XXXX-XXXX" required />
                <PendingSubmit idle="Join" busy="Joining…" variant="ghost" className="shrink-0" />
              </div>
            </form>
          </aside>
        </div>
      </main>
    </PresenceProvider>
  );
}

export function HomeProjectList({ projects }: { projects: ProjectCard[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [pinDraft, setPinDraft] = useState<Record<string, boolean>>({});
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinPending, startPin] = useTransition();
  const mine = projects.filter((project) => project.role === "owner");
  const others = projects.filter((project) => project.role !== "owner");
  const mineProgress = rollup(mine);
  const othersProgress = rollup(others);

  const accessCounts = useMemo(() => {
    const counts: Record<AccessFilter, number> = {
      all: projects.length,
      personal: 0,
      group: 0,
      organization: 0,
    };
    for (const project of projects) counts[project.access] += 1;
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    const scoped =
      accessFilter === "all" ? projects : projects.filter((project) => project.access === accessFilter);
    const q = query.trim().toLowerCase();
    const searched = !q
      ? scoped
      : scoped.filter((project) => {
          const haystack = [
            project.name,
            project.description,
            project.ownerName ?? "",
            project.role === "owner" ? "yours" : "joined",
            ACCESS_LABEL[project.access],
            project.groupName ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });
    return [...searched].sort((a, b) => {
      const pinnedA = pinDraft[a.id] ?? a.pinned;
      const pinnedB = pinDraft[b.id] ?? b.pinned;
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;
      return 0;
    });
  }, [projects, query, accessFilter, pinDraft]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <section className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3">
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
        </section>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <section className={cn(surface, "flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-3xl lg:min-h-0")}>
            <div className="flex shrink-0 flex-col gap-2 border-b border-line px-3 py-3 sm:px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif shrink-0 text-xl">Project</h2>
                  <p className="text-sm text-muted sm:hidden">
                    {filtered.length}/{accessFilter === "all" ? projects.length : accessCounts[accessFilter]}
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
                  {filtered.length} of {accessFilter === "all" ? projects.length : accessCounts[accessFilter]}
                </p>
              </div>
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter projects by access">
                {VIEW_FILTERS.map((option) => {
                  const active = accessFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setAccessFilter(option.id);
                        setPage(1);
                      }}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        active ? "bg-terracotta text-white" : "bg-paper-2 text-muted hover:bg-sand hover:text-ink",
                      )}
                    >
                      {option.label}
                      <span className={cn("tabular-nums", active ? "text-white/80" : "text-muted")}>
                        {accessCounts[option.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {pinError ? (
                <p className="px-2 pb-2 text-sm text-red-700 dark:text-red-400">{pinError}</p>
              ) : null}
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
                    <p className="mt-1 text-sm text-muted">
                      {query.trim()
                        ? "Try another term, or clear the search."
                        : `No ${accessFilter === "all" ? "" : `${ACCESS_LABEL[accessFilter].toLowerCase()} `}projects yet.`}
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {paged.map((project) => {
                    const pinned = pinDraft[project.id] ?? project.pinned;
                    return (
                    <li key={project.id}>
                      <article className="group rounded-2xl px-2 py-3 transition hover:bg-sand sm:px-3">
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
                              {pinned ? (
                                <Pin size={12} className="shrink-0 fill-current text-terracotta" aria-hidden />
                              ) : null}
                              <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase sm:inline">
                                {ACCESS_LABEL[project.access]}
                              </span>
                              <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted uppercase sm:inline">
                                {project.role === "owner" ? "Yours" : "Joined"}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted">{project.description}</p>
                          </Link>
                          {project.access === "organization" ? (
                            <button
                              type="button"
                              disabled={pinPending}
                              className={cn(
                                "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition",
                                pinned
                                  ? "text-terracotta opacity-100 hover:bg-terracotta/10"
                                  : "text-muted opacity-100 hover:bg-paper-2 hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                              )}
                              aria-label={pinned ? `Unpin ${project.name}` : `Pin ${project.name}`}
                              aria-pressed={pinned}
                              onClick={() => {
                                const next = !pinned;
                                setPinError(null);
                                setPinDraft((current) => ({ ...current, [project.id]: next }));
                                if (next) setPage(1);
                                startPin(async () => {
                                  try {
                                    await notifyChange(
                                      toggleProjectPin(project.id),
                                      next ? "Project pinned" : "Project unpinned",
                                    );
                                  } catch (caught) {
                                    setPinDraft((current) => ({ ...current, [project.id]: pinned }));
                                    setPinError(
                                      caught instanceof Error ? caught.message : "Could not update the pin.",
                                    );
                                  }
                                });
                              }}
                            >
                              <Pin size={16} className={pinned ? "fill-current" : undefined} />
                            </button>
                          ) : null}
                          {project.role === "owner" ? (
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                              aria-label={`Delete ${project.name}`}
                              onClick={() => setPendingDelete({ id: project.id, name: project.name })}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                          <div className="hidden sm:block">
                            <AvatarStack members={project.members} />
                          </div>
                        </div>
                        <div className="mt-3 sm:pl-11">
                          <ProgressBar done={project.doneCount} total={project.taskCount} />
                          <p className="mt-1 truncate text-[11px] text-muted">
                            {ACCESS_LABEL[project.access]}
                            {project.access === "group" && project.groupName ? ` · ${project.groupName}` : ""}
                            {project.access === "organization"
                              ? " · open to everyone"
                              : ` · ${project.memberCount} ${project.memberCount === 1 ? "member" : "members"}`}
                            {project.role !== "owner" && project.ownerName ? ` · owner ${project.ownerName}` : ""}
                          </p>
                        </div>
                      </article>
                    </li>
                    );
                  })}
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
        </section>
        <DeleteProjectDialog project={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  );
}
