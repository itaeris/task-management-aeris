"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Columns3,
  Flag,
  GanttChart,
  LayoutDashboard,
  NotebookPen,
  Share2,
  Sunrise,
} from "lucide-react";
import { logout } from "@/lib/actions/identity";
import { Avatar, btnGhost, btnPrimary } from "@/components/ui";
import { ProjectIconEditor } from "@/components/icon-picker";
import { PresenceBoard, PresenceProvider } from "@/components/presence";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/backlog", label: "Product log", icon: NotebookPen },
  { href: "/scrum", label: "Scrum log", icon: Flag },
  { href: "/daily", label: "Daily check", icon: Sunrise },
  { href: "/kanban", label: "Kanban check", icon: Columns3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/timeline", label: "Timeline", icon: GanttChart },
  { href: "/share", label: "Share", icon: Share2 },
];

type UserLite = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export function ProjectShell({
  projectId,
  projectName,
  projectColor,
  canEditIcon,
  user,
  children,
}: {
  projectId: string;
  projectName: string;
  projectColor: string;
  canEditIcon: boolean;
  user: UserLite;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <PresenceProvider>
      <div className="relative flex h-dvh gap-4 overflow-hidden p-4">
        <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-white/80 text-ink shadow-sm backdrop-blur-md">
          <div className="px-5 pt-6">
            <Link href="/">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-terracotta uppercase">Task Management</p>
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <ProjectIconEditor
                projectId={projectId}
                value={projectColor}
                canEdit={canEditIcon}
                size="sm"
              />
              <p className="font-serif min-w-0 text-xl leading-tight">{projectName}</p>
            </div>
          </div>
          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
            {NAV.map((item) => {
              const href = `${base}${item.href}`;
              const active = item.href === "" ? pathname === base : pathname.startsWith(href);
              const Icon = item.icon;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                    active ? "bg-paper-2 text-terracotta" : "text-muted hover:bg-sand hover:text-ink",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <header className="flex items-center gap-3 rounded-3xl border border-line bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
            <Link href="/" className={cn(btnGhost, "shrink-0")}>
              <ArrowLeft size={16} />
              Menu utama
            </Link>
            <PresenceBoard variant="header" />
            <div className="flex shrink-0 items-center gap-2">
              <Avatar {...user} size="sm" />
              <Link href="/settings" className={btnGhost}>
                Settings
              </Link>
              <form action={logout}>
                <button className={btnPrimary}>Keluar</button>
              </form>
            </div>
          </header>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-2 py-4 lg:px-6">{children}</div>
        </div>
      </div>
    </PresenceProvider>
  );
}
