import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { Overview } from "@/components/overview";

export default async function ProjectOverviewPage({
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
    <Overview
      projectId={id}
      description={workspace.project.description}
      tasks={workspace.tasks}
      sprints={workspace.sprints}
      activities={workspace.activities}
      todayCheckins={workspace.todayCheckins}
      memberCount={workspace.members.length}
    />
  );
}
