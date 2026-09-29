import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectShell, getProjectWorkspace, listProjectSwitcherForUser } from "@/lib/queries";
import { getCalendarConnection } from "@/lib/google-calendar";
import { ProjectShell } from "@/components/project-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/projects/${id}`);
  const [shell, projects] = await Promise.all([
    getProjectShell(id, user.id),
    listProjectSwitcherForUser(user.id),
  ]);
  if (!shell) notFound();
  const [workspace, calendar] = await Promise.all([
    getProjectWorkspace(id, user.id),
    getCalendarConnection(user.id),
  ]);
  if (!workspace) notFound();

  return (
    <ProjectShell
      projectId={shell.project.id}
      projectName={shell.project.name}
      projectColor={shell.project.color}
      canEditIcon={shell.role === "owner"}
      projects={projects}
      user={user}
    >
      <WorkspaceProvider
        key={`${workspace.tasks.map((task) => task.id).join(",")}|${workspace.sprints.map((sprint) => `${sprint.id}:${sprint.status}`).join(",")}`}
        workspace={workspace}
        userId={user.id}
        calendar={calendar}
      >
        {children}
      </WorkspaceProvider>
    </ProjectShell>
  );
}
