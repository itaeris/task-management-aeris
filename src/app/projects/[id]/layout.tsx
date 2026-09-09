import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { getCalendarConnection } from "@/lib/google-calendar";
import { ProjectShell } from "@/components/project-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";

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
  const [workspace, calendar] = await Promise.all([
    getProjectWorkspace(id, user.id),
    getCalendarConnection(user.id),
  ]);
  if (!workspace) notFound();

  return (
    <ProjectShell
      projectId={workspace.project.id}
      projectName={workspace.project.name}
      projectColor={workspace.project.color}
      canEditIcon={workspace.role === "owner"}
      user={user}
    >
      <WorkspaceProvider workspace={workspace} userId={user.id} calendar={calendar}>
        {children}
      </WorkspaceProvider>
    </ProjectShell>
  );
}
