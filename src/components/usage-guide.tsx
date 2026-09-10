"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { btnGhost, chip, surface } from "@/components/ui";
import { FadeIn } from "@/components/motion";

const TOC = [
  { id: "what-this-is", label: "What this is" },
  { id: "account", label: "Account & login" },
  { id: "home", label: "Home" },
  { id: "inside-project", label: "Inside a project" },
  { id: "overview", label: "Overview" },
  { id: "product-log", label: "Product log" },
  { id: "terms", label: "Task terms" },
  { id: "scrum", label: "Scrum log" },
  { id: "daily", label: "Daily check" },
  { id: "kanban", label: "Kanban check" },
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "share", label: "Share" },
  { id: "detail", label: "Task detail" },
  { id: "presence", label: "Active now" },
  { id: "workflow", label: "Suggested workflow" },
];

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/70 px-4 py-3">
      <p className="text-sm font-semibold">{name}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta text-[11px] font-bold text-white">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

function nearestScrollRoot(node: HTMLElement | null) {
  let el = node?.parentElement ?? null;
  while (el) {
    const overflowY = getComputedStyle(el).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 8) {
      return el;
    }
    el = el.parentElement;
  }
  return window;
}

function GuideToc() {
  const [active, setActive] = useState(TOC[0].id);

  useEffect(() => {
    const first = document.getElementById(TOC[0].id);
    const root = nearestScrollRoot(first);
    const offset = 120;

    const update = () => {
      const rootTop = root instanceof Window ? 0 : root.getBoundingClientRect().top;
      let current = TOC[0].id;
      for (const item of TOC) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - rootTop <= offset) current = item.id;
      }
      setActive(current);
    };

    update();
    const target: Window | HTMLElement = root;
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav
      className={cn(
        surface,
        "hidden rounded-3xl p-4 lg:sticky lg:top-8 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto",
      )}
      aria-label="Table of contents"
    >
      <p className="px-2 text-[11px] font-semibold tracking-wide text-muted uppercase">Contents</p>
      <ul className="mt-2 space-y-0.5">
        {TOC.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActive(item.id);
                  history.replaceState(null, "", `#${item.id}`);
                }}
                className={cn(
                  "block rounded-xl px-2 py-1.5 text-[13px] transition",
                  isActive ? "bg-paper-2 font-semibold text-terracotta" : "text-muted hover:bg-sand hover:text-ink",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function UsageGuide({ projectId }: { projectId?: string }) {
  const go = (path: string) => (projectId ? `/projects/${projectId}${path}` : null);

  return (
    <div className="space-y-6">
      <FadeIn>
        <p className={cn(chip, "bg-paper-2 text-terracotta")}>Guide</p>
        <h1 className="font-serif mt-2 text-3xl sm:text-4xl">How to use</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Teams use Task Management to plan a product, run sprints, check in daily, and see deadlines in one
          place. Below is what each menu means, and how it works.
        </p>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <GuideToc />
        <div className="space-y-5">
          <section id="what-this-is" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">What this app is</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This is a collaboration workspace. One <strong className="font-semibold text-ink">project</strong>{" "}
              is one product or initiative. Inside it you get a backlog (work list), sprints (time-boxed
              iterations), a kanban board, a deadline calendar, a timeline, and daily standups. Everyone in the
              project sees the same data.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              It is not a chat app. Comments live on each task. Attachments also belong to a task, not to the
              project as a whole.
            </p>
          </section>

          <section id="account" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Account & login</h2>
            <ul className="mt-4 space-y-3">
              <Step n="1" title="Sign in">
                Use email or username plus password, or the Google button. After you sign in, you land on home
                (the project list).
              </Step>
              <Step n="2" title="Settings">
                Change the display name other members see. Email and username cannot be changed here. Resetting
                your password requires the current password. The sun/moon icon in the header switches light and
                dark mode; the choice is saved on this device.
              </Step>
              <Step n="3" title="Log out">
                Open the header menu and choose Log out. The session on this device ends; project data stays on
                the server.
              </Step>
            </ul>
          </section>

          <section id="home" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Home</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This is the page after login. You do not work on tasks here; you pick or create a project.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Your projects">
                Projects you created. You are the owner: you can change the name, description, icon, and rotate
                the share code.
              </Term>
              <Term name="Following">
                Projects you joined with a code or that you can open because you are in the group or organization.
                You can work on tasks, daily, and comments; you cannot change the project identity or rotate the
                share code.
              </Term>
              <Term name="Access filter">
                All, Personal, Group, or Organization. The list only shows that type. Search still works inside the
                selected view.
              </Term>
              <Term name="Progress bar">
                Done tasks versus all tasks in that group. It is not hours worked.
              </Term>
              <Term name="Create project">
                Enter a name, description, and pick an icon. Choose access: Personal (invite with a code), Group
                (everyone in that group can open it), or Organization (everyone in the workspace can open it). You
                become the owner.
              </Term>
              <Term name="Join project">
                Enter a share code (format like ABCD-EFGH). If you are already a member, you go straight into
                that project.
              </Term>
              <Term name="Delete project">
                Owner only. Hover a project card and click delete. Type DELETE in the dialog to confirm. This is
                permanent.
              </Term>
              <Term name="Pin project">
                Organization projects only. Pin keeps that project at the top of your list. Pins are yours alone;
                other people do not see them.
              </Term>
            </div>
          </section>

          <section id="inside-project" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Inside a project</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The left sidebar is the work menu. Use the project name in the header to switch projects without
              going back to Home. <strong className="font-semibold text-ink">Home</strong> still opens the full
              project list; it does not close the app.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              On a phone, open the sidebar with the menu icon. Only the owner can change the project icon in the
              sidebar.
            </p>
          </section>

          <section id="overview" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Overview</h2>
              {go("") ? (
                <Link href={go("")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A snapshot of project health. This is not where you edit tasks.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Open items">Tasks that are not Done. Includes backlog, to do, in progress, and review.</Term>
              <Term name="Done">Finished tasks. These move the progress bar on home.</Term>
              <Term name="Daily check today">How many members have filled in standup today, versus the member count.</Term>
              <Term name="Active sprint">The iteration currently running. If this is empty, activate a sprint in Scrum log.</Term>
              <Term name="Upcoming deadlines">The five tasks with the nearest due dates. Click a row to open that task.</Term>
              <Term name="Activity">A trail of who added, changed, or deleted a task.</Term>
            </div>
          </section>

          <section id="product-log" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Product log</h2>
              {go("/backlog") ? (
                <Link href={go("/backlog")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The product backlog: every work item, in order. This is where tasks are usually created. Click a
              row to open its detail. The <strong className="font-semibold text-ink">+ New task</strong> button
              creates a new item.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Add a task to a sprint from the task detail (pick a sprint), not by dragging in this table.
              Priority filters and the search box only hide rows; they do not delete data.
            </p>
          </section>

          <section id="terms" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Terms on every task</h2>
            <p className="mt-2 text-sm text-muted">These are the values you fill in when you create or edit a task.</p>
            <h3 className="mt-5 text-sm font-semibold tracking-wide text-ink uppercase">Status</h3>
            <p className="mt-1 text-sm text-muted">Where the work sits right now. This moves the card on Kanban.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Term name="Backlog">Not scheduled yet. Only in Product log; it does not appear in a Kanban column.</Term>
              <Term name="To Do">Ready to work on, not started.</Term>
              <Term name="In Progress">Currently being worked on.</Term>
              <Term name="Review">Waiting for check / QA / approval.</Term>
              <Term name="Done">Finished. Counts toward progress.</Term>
            </div>
            <h3 className="mt-5 text-sm font-semibold tracking-wide text-ink uppercase">Priority</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Term name="Urgent">Do this now — a blocker or incident.</Term>
              <Term name="High">Important for this sprint / release.</Term>
              <Term name="Medium">Normal, the default.</Term>
              <Term name="Low">Can slip if capacity is full.</Term>
            </div>
            <h3 className="mt-5 text-sm font-semibold tracking-wide text-ink uppercase">Type</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Term name="Story">A user need / product value.</Term>
              <Term name="Task">Technical or operational work.</Term>
              <Term name="Bug">Wrong behavior that must be fixed.</Term>
              <Term name="Spike">Research / a time-box to reduce uncertainty.</Term>
            </div>
            <h3 className="mt-5 text-sm font-semibold tracking-wide text-ink uppercase">Other</h3>
            <div className="mt-3 grid gap-3">
              <Term name="Pts (story points)">Size estimate, not hours. Relative numbers on the team (for example 1, 2, 3, 5, 8).</Term>
              <Term name="Assignee">Who owns the task. You can assign more than one person, or leave it empty.</Term>
              <Term name="Start / Due">Start and deadline. Due fills Calendar. Both fill Timeline.</Term>
              <Term name="Sprint">The iteration where the task is worked. Empty = still on the product backlog.</Term>
            </div>
          </section>

          <section id="scrum" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Scrum log</h2>
              {go("/scrum") ? (
                <Link href={go("/scrum")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Where you plan iterations. A sprint has a name, a date range, and a goal (the iteration aim, one
              sentence).
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Planning">A new sprint, not running yet. Write the goal, pull tasks from Product log into this sprint.</Term>
              <Term name="Active">The sprint currently being worked. Overview uses the active sprint. Only one active sprint makes sense.</Term>
              <Term name="Completed">The sprint is closed. Its tasks remain; task status is separate from sprint status.</Term>
              <Term name="Activate / Complete">Buttons that change sprint status, not the status of tasks inside it.</Term>
              <Term name="Edit">Change the sprint name, dates, or goal. Status stays the same.</Term>
              <Term name="Delete">Removes the sprint only. Tasks return to the product log.</Term>
            </div>
          </section>

          <section id="daily" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Daily check</h2>
              {go("/daily") ? (
                <Link href={go("/daily")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A written standup: one person, one form per day. This is not a task list — it is a daily commitment
              so the team knows focus and blockers.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Yesterday">What you finished / worked on yesterday. Keep it short.</Term>
              <Term name="Today">Today&apos;s plan. Ideally realistic, not a wishlist.</Term>
              <Term name="Blocker">What is in the way. Leave it empty if there is none. Others can help if they can see it.</Term>
            </div>
            <p className="mt-3 text-sm text-muted">
              Saving daily overwrites your check-in for that date. Previous days stay listed below.
            </p>
          </section>

          <section id="kanban" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Kanban check</h2>
              {go("/kanban") ? (
                <Link href={go("/kanban")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A workflow board. Columns: To Do, In Progress, Review, Done. Tasks with Backlog status do not appear
              here — move them first from task detail, or create a task with To Do status.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Drag a card between columns to change status. Click a card to open detail. The sprint filter limits
              the board to one iteration.
            </p>
          </section>

          <section id="calendar" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Calendar</h2>
              {go("/calendar") ? (
                <Link href={go("/calendar")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A month calendar. Items appear on the <strong className="font-semibold text-ink">due date</strong>,
              not the start date. Click an item for detail. Tasks without a due date do not show here.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Connect Google Calendar">
                OAuth to your Google calendar. Tasks with a due date are copied to your primary calendar as
                all-day events. This is not a team invite — each member connects their own account.
              </Term>
              <Term name="Sync">
                Push every due date in this project to Google again. Creating, updating, or deleting a task also
                pushes while the connection is active. Deleting the whole project also removes those events from
                Google Calendar / CalDAV.
              </Term>
              <Term name="Disconnect">
                Revoke the app&apos;s access to Google. Due-date events already on Google Calendar are not deleted
                automatically; remove them in Google if you do not want them left behind.
              </Term>
            </div>
          </section>

          <section id="timeline" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Timeline</h2>
              {go("/timeline") ? (
                <Link href={go("/timeline")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A simple Gantt: a bar from start date to due date. Bar width is duration, not priority. If only one
              date is set, duration is counted as one day.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The title inside the bar starts from the left. A short bar will clip the text — the full title is
              still in the left column and in the tooltip. Tasks without dates do not appear on the timeline.
            </p>
          </section>

          <section id="share" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">Share</h2>
              {go("/share") ? (
                <Link href={go("/share")!} className={cn(btnGhost, "shrink-0 px-3 py-1.5 text-sm")}>
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Control who can open the project. Group and organization members do not need a share code.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Personal">Only the owner, plus people invited with the share code.</Term>
              <Term name="Group">Everyone already in the group can open it. Adding someone to the group gives them every project linked to that group.</Term>
              <Term name="Organization">Everyone in this workspace can open it.</Term>
              <Term name="Share code">Optional extra invite. Anyone with the code can join as a member, even on a group or organization project.</Term>
              <Term name="Copy link">Copy the join URL. Same as the code, easier to send.</Term>
              <Term name="Rotate code">Owner only. The old code dies; old links can no longer be used to join. People already in the project are not kicked out.</Term>
              <Term name="Save project">The owner changes the name, description, icon, and access type.</Term>
              <Term name="Leave project">A member (not the owner) can leave a personal project, or a group project they joined only with a share code. Group and organization auto-access cannot be left from here.</Term>
            </div>
          </section>

          <section id="detail" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Task detail (right drawer)</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Click a task in Product log, Kanban, Calendar, or Timeline. This drawer is where you edit it fully.
            </p>
            <div className="mt-4 grid gap-3">
              <Term name="Save">Writes title, description, status, priority, type, sprint, assignees, dates, and points.</Term>
              <Term name="Comments">Discussion on that task only. The team sees them in time order.</Term>
              <Term name="Attachments">Files attached to the task. Limit around 10 MB. Common formats: images, PDF, Office documents, ZIP, text/CSV.</Term>
              <Term name="Delete">Removes the task, its comments, and its attachments. Cannot be undone from the app.</Term>
            </div>
          </section>

          <section id="presence" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Active now</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Dots and names in the header show who is looking at the same page or task, nearly in real time.
              Useful so you do not collide while editing. If it is empty, nobody else is in this project right now.
            </p>
          </section>

          <section id="workflow" className={cn(surface, "scroll-mt-8 rounded-3xl p-5 sm:p-6")}>
            <h2 className="font-serif text-2xl">Suggested workflow</h2>
            <ol className="mt-4 space-y-3">
              <Step n="1" title="Set up the project">
                Create a project, pick Personal / Group / Organization, then add a short description on Overview.
              </Step>
              <Step n="2" title="Write the backlog">
                In Product log, break the work into tasks. Fill in priority, type, estimated points, and a due
                date if you already know it.
              </Step>
              <Step n="3" title="Plan the sprint">
                In Scrum log, create a sprint, write the goal, activate it. From task detail, pick that sprint.
              </Step>
              <Step n="4" title="Work on Kanban">
                Move cards To Do → In Progress → Review → Done. Do not let Review pile up without an owner.
              </Step>
              <Step n="5" title="Daily every day">
                Fill in Daily check in the morning. Recurring blockers usually become a new task or need help in
                comments.
              </Step>
              <Step n="6" title="Watch the dates">
                Use Calendar for deadlines, Timeline for duration. Connect Google Calendar if you want due dates
                on your personal calendar.
              </Step>
              <Step n="7" title="Close the sprint">
                In Scrum log, mark it Complete. Leave unfinished work: send it back to the backlog or the next
                sprint from task detail.
              </Step>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
