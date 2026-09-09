import Link from "next/link";
import { cn, formatDay } from "@/lib/utils";
import { Avatar, StatusBadge, surface } from "@/components/ui";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";

export function Overview({
  projectId,
  description,
  tasks,
  sprints,
  activities,
  todayCheckins,
  memberCount,
}: {
  projectId: string;
  description: string;
  tasks: TaskDTO[];
  sprints: SprintDTO[];
  activities: Array<{ id: string; message: string; createdAt: string; user: MemberDTO }>;
  todayCheckins: number;
  memberCount: number;
}) {
  const active = sprints.find((sprint) => sprint.status === "active");
  const done = tasks.filter((task) => task.status === "done").length;
  const upcoming = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-serif text-3xl sm:text-4xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-muted">{description}</p>
      </FadeIn>
      <Stagger className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerItem>
          <Stat label="Open items" value={String(tasks.length - done)} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Done" value={String(done)} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Daily check hari ini" value={`${todayCheckins}/${memberCount}`} />
        </StaggerItem>
        <StaggerItem>
          <Stat label="Sprint aktif" value={active ? active.name.replace(/Sprint \d+ — /, "") : "Tidak ada"} />
        </StaggerItem>
      </Stagger>
      {active ? (
        <FadeIn delay={0.12}>
        <section className={cn(surface, "rounded-3xl p-5")}>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">{active.name}</h2>
            <Link href={`/projects/${projectId}/scrum`} className="text-sm font-semibold text-terracotta">
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
        <section className={cn(surface, "rounded-3xl p-5")}>
          <h2 className="font-serif text-2xl">Deadline dekat</h2>
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2 py-3">
                <span className="min-w-0 truncate text-sm font-medium">{task.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-muted">{formatDay(task.dueDate!)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className={cn(surface, "rounded-3xl p-5")}>
          <h2 className="font-serif text-2xl">Aktivitas</h2>
          <ul className="mt-3 space-y-3">
            {activities.map((item) => (
              <li key={item.id} className="flex gap-3">
                <Avatar {...item.user} size="sm" />
                <p className="text-sm">
                  <span className="font-semibold">{item.user.name}</span> {item.message}
                  <span className="block text-xs text-muted">{formatDay(item.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </FadeIn>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(surface, "rounded-3xl p-4")}>
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="font-serif mt-2 text-2xl">{value}</p>
    </div>
  );
}
