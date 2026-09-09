import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { getCalendarConnection } from "@/lib/google-calendar";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ calendar?: string; error?: string }>;
}) {
  const { id } = await params;
  const { calendar, error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const workspace = await getProjectWorkspace(id, user.id);
  if (!workspace) notFound();
  const connection = await getCalendarConnection(user.id);
  return (
    <CalendarView
      projectId={id}
      tasks={workspace.tasks}
      members={workspace.members}
      sprints={workspace.sprints}
      connection={connection}
      calendarNotice={calendar}
      calendarError={error}
    />
  );
}
