"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDay } from "@/lib/utils";
import { Avatar, StatusBadge, surface } from "@/components/ui";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { TaskDrawer } from "@/components/task-drawer";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";

const PAGE_SIZE = 5;

function pageItems<T>(items: T[], page: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  return {
    currentPage,
    pageCount,
    paged: items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  };
}

function Pager({
  page,
  pageCount,
  total,
  onPage,
  label,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
  label: string;
}) {
  if (total === 0 || pageCount <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
      <p className="text-xs text-muted">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:bg-paper-2 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label={`Previous ${label} page`}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:bg-paper-2 disabled:opacity-40"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          aria-label={`Next ${label} page`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Overview({
  projectId,
  description,
  tasks,
  sprints,
  members,
  activities,
  todayCheckins,
  memberCount,
}: {
  projectId: string;
  description: string;
  tasks: TaskDTO[];
  sprints: SprintDTO[];
  members: MemberDTO[];
  activities: Array<{ id: string; message: string; createdAt: string; user: MemberDTO }>;
  todayCheckins: number;
  memberCount: number;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [deadlinePage, setDeadlinePage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const active = sprints.find((sprint) => sprint.status === "active");
  const done = tasks.filter((task) => task.status === "done").length;
  const upcoming = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const deadlines = pageItems(upcoming, deadlinePage);
  const activity = pageItems(activities, activityPage);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-serif text-3xl sm:text-4xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{description}</p>
      </FadeIn>
      <Stagger className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StaggerItem>
          <Stat label="Open items" value={String(tasks.length - done)} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Done" value={String(done)} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Daily check today" value={`${todayCheckins}/${memberCount}`} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Active sprint" value={active ? active.name.replace(/Sprint \d+ — /, "") : "None"} />
        </StaggerItem>
      </Stagger>
      {active ? (
        <FadeIn delay={0.12}>
        <section className={cn(surface, "rounded-3xl p-4 sm:p-5")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif min-w-0 text-xl sm:text-2xl">{active.name}</h2>
            <Link href={`/projects/${projectId}/scrum`} className="shrink-0 text-sm font-semibold text-terracotta">
              Scrum log →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">{active.goal}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full bg-forest"
              style={{
                width: `${active.taskCount ? Math.round((active.doneCount / active.taskCount) * 100) : 0}%`,
              }}
            />
          </div>
        </section>
        </FadeIn>
      ) : null}
      <FadeIn delay={0.16} className="grid gap-4 lg:grid-cols-2">
        <section className={cn(surface, "min-w-0 rounded-3xl p-4 sm:p-5")}>
          <h2 className="font-serif text-xl sm:text-2xl">Upcoming deadlines</h2>
          <ul className="mt-3 -mx-1">
            {upcoming.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted">No upcoming deadlines.</li>
            ) : (
              deadlines.paged.map((task) => (
                <li key={task.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    className="flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl px-3 py-3 text-left transition hover:bg-sand focus-visible:bg-sand focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    onClick={() => setOpenId(task.id)}
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{task.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-muted">{formatDay(task.dueDate!)}</span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
          <Pager
            page={deadlines.currentPage}
            pageCount={deadlines.pageCount}
            total={upcoming.length}
            onPage={setDeadlinePage}
            label="deadlines"
          />
        </section>
        <section className={cn(surface, "min-w-0 rounded-3xl p-4 sm:p-5")}>
          <h2 className="font-serif text-xl sm:text-2xl">Activity</h2>
          <ul className="mt-3 space-y-3">
            {activities.length === 0 ? (
              <li className="py-4 text-sm text-muted">No activity yet.</li>
            ) : (
              activity.paged.map((item) => (
                <li key={item.id} className="flex min-w-0 gap-3">
                  <Avatar {...item.user} size="sm" />
                  <p className="min-w-0 text-sm">
                    <span className="font-semibold">{item.user.name}</span> {item.message}
                    <span className="block text-xs text-muted">{formatDay(item.createdAt)}</span>
                  </p>
                </li>
              ))
            )}
          </ul>
          <Pager
            page={activity.currentPage}
            pageCount={activity.pageCount}
            total={activities.length}
            onPage={setActivityPage}
            label="activity"
          />
        </section>
      </FadeIn>
      <TaskDrawer
        taskId={openId}
        members={members}
        sprints={sprints}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(surface, "min-w-0 rounded-3xl p-3 sm:p-4")}>
      <p className="text-[10px] tracking-wide text-muted uppercase sm:text-xs">{label}</p>
      <p className="font-serif mt-2 truncate text-xl sm:text-2xl">{value}</p>
    </div>
  );
}
