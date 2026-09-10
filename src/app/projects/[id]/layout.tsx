import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProjectShell, getProjectWorkspace, listProjectSwitcherForUser } from "@/lib/queries";
import { getCalendarConnection } from "@/lib/google-calendar";
import { ProjectShell } from "@/components/project-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { ProjectPageSkeleton } from "@/components/skeletons";

export const dynamic = "force-dynamic";

async function ProjectWorkspaceLoader({
  projectId,
  userId,
  children,
}: {
  projectId: string;
  userId: string;
  children: ReactNode;
}) {
  const [workspace, calendar] = await Promise.all([
    getProjectWorkspace(projectId, userId),
    getCalendarConnection(userId),
  ]);
  if (!workspace) notFound();
  return (
    <WorkspaceProvider
      key={`${workspace.tasks.map((task) => task.id).join(",")}|${workspace.sprints.map((sprint) => `${sprint.id}:${sprint.status}`).join(",")}`}
      workspace={workspace}
      userId={userId}
      calendar={calendar}
    >
      {children}
    </WorkspaceProvider>
  );
}

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

  return (
    <ProjectShell
      projectId={shell.project.id}
      projectName={shell.project.name}
      projectColor={shell.project.color}
      canEditIcon={shell.role === "owner"}
      projects={projects}
      user={user}
    >
      <Suspense fallback={<ProjectPageSkeleton />}>
        <ProjectWorkspaceLoader projectId={id} userId={user.id}>
          {children}
        </ProjectWorkspaceLoader>
      </Suspense>
    </ProjectShell>
  );
}
