"use client";

import { CalendarView } from "@/components/calendar-view";
import { useWorkspace } from "@/components/workspace-provider";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CalendarFromWorkspace() {
  const { project, tasks, members, sprints, calendar } = useWorkspace();
  const searchParams = useSearchParams();
  return (
    <CalendarView
      projectId={project.id}
      access={project.access}
      tasks={tasks}
      members={members}
      sprints={sprints}
      connection={calendar}
      calendarNotice={searchParams.get("calendar") ?? undefined}
      calendarError={searchParams.get("error") ?? undefined}
    />
  );
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarFromWorkspace />
    </Suspense>
  );
}
