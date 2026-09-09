import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { TimelineView } from "@/components/timeline-view";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const workspace = await getProjectWorkspace(id, user.id);
  if (!workspace) notFound();
  return (
    <TimelineView
      tasks={workspace.tasks}
      members={workspace.members}
      sprints={workspace.sprints}
    />
  );
}
