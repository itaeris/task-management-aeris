import { cn } from "@/lib/utils";

export const btnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-terracotta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-60";

export const btnGhost =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper-2 disabled:opacity-60";

export const iconBtn =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-[22px] font-semibold leading-none text-ink transition hover:bg-paper-2";

export const field =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-terracotta/60 focus:ring-2 focus:ring-terracotta/20";

export const surface = "border border-line bg-paper/80 backdrop-blur-sm";

export const chip =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase";

export function Avatar({
  name,
  initials,
  color,
  size = "md",
}: {
  name: string;
  initials: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const dim =
    size === "xs"
      ? "h-5 w-5 text-[8px]"
      : size === "sm"
        ? "h-7 w-7 text-[10px]"
        : size === "lg"
          ? "h-11 w-11 text-sm"
          : "h-8 w-8 text-[11px]";
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm",
        dim,
      )}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({
  members,
}: {
  members: Array<{ name: string; initials: string; color: string }>;
}) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 5).map((member) => (
        <span key={`${member.name}-${member.initials}-${member.color}`} className="rounded-full ring-2 ring-paper">
          <Avatar {...member} size="sm" />
        </span>
      ))}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  };
  return <span className={cn(chip, map[priority] ?? map.medium)}>{priority}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    story: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    task: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    bug: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
    spike: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  };
  return <span className={cn(chip, map[type] ?? map.task)}>{type}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    backlog: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
    todo: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    review: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  };
  const labels: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
  };
  return <span className={cn(chip, map[status] ?? map.todo)}>{labels[status] ?? status}</span>;
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className={cn(surface, "rounded-3xl px-8 py-16 text-center")}>
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}
