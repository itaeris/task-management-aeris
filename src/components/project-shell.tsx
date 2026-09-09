"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Columns3,
  Flag,
  GanttChart,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Settings,
  Share2,
  Sunrise,
  X,
} from "lucide-react";
import { logout } from "@/lib/actions/identity";
import { Avatar, btnGhost, btnPrimary, iconBtn } from "@/components/ui";
import { ProjectIconEditor } from "@/components/icon-picker";
import { PresenceBoard, PresenceProvider } from "@/components/presence";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";
import { BrandMark } from "@/components/brand-mark";

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

function SidebarBody({
  projectId,
  projectName,
  projectColor,
  canEditIcon,
  pathname,
  base,
  onClose,
}: {
  projectId: string;
  projectName: string;
  projectColor: string;
  canEditIcon: boolean;
  pathname: string;
  base: string;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between px-5 pt-6">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-5 w-5 shrink-0" />
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
        {onClose ? (
          <button type="button" className={cn(iconBtn, "lg:hidden")} onClick={onClose} aria-label="Tutup menu">
            <X size={16} />
          </button>
        ) : null}
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
    </>
  );
}

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
  const [navOpen, setNavOpen] = useState(false);
  const base = `/projects/${projectId}`;

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const sidebar = {
    projectId,
    projectName,
    projectColor,
    canEditIcon,
    pathname,
    base,
  };

  return (
    <PresenceProvider>
      <div className="relative flex h-dvh flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:flex-row lg:gap-4">
        <AnimatePresence>
          {navOpen ? (
            <motion.button
              key="nav-overlay"
              type="button"
              className="fixed inset-0 z-30 bg-ink/25 lg:hidden"
              onClick={() => setNavOpen(false)}
              aria-label="Tutup menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {navOpen ? (
            <motion.aside
              key="nav-drawer"
              className="fixed inset-y-3 left-3 z-40 flex w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white text-ink shadow-lg lg:hidden"
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -28, opacity: 0 }}
              transition={{ duration: 0.22, ease: easeOutSoft }}
            >
              <SidebarBody {...sidebar} onClose={() => setNavOpen(false)} />
            </motion.aside>
          ) : null}
        </AnimatePresence>
        <aside className="hidden h-auto w-64 shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-white/80 text-ink shadow-sm backdrop-blur-md lg:flex">
          <SidebarBody {...sidebar} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <header className="flex shrink-0 items-center gap-2 rounded-3xl border border-line bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2.5">
            <button type="button" className={cn(iconBtn, "lg:hidden")} onClick={() => setNavOpen(true)} aria-label="Buka menu">
              <Menu size={18} />
            </button>
            <Link href="/" className={cn(btnGhost, "shrink-0 px-3 sm:px-4")}>
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Menu utama</span>
            </Link>
            <div className="hidden min-w-0 flex-1 md:flex">
              <PresenceBoard variant="header" />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Avatar {...user} size="sm" />
              <Link href="/settings" className={cn(btnGhost, "hidden sm:inline-flex")}>
                Settings
              </Link>
              <Link href="/settings" className={cn(iconBtn, "sm:hidden")} aria-label="Settings">
                <Settings size={16} />
              </Link>
              <form action={logout}>
                <button className={btnPrimary}>Keluar</button>
              </form>
            </div>
          </header>
          <motion.div
            key={pathname}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-1 py-3 sm:px-2 sm:py-4 lg:px-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easeOutSoft }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </PresenceProvider>
  );
}
