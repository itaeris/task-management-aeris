import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectShell } from "@/lib/queries";
import { ProjectShell } from "@/components/project-shell";

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
  const shell = await getProjectShell(id, user.id);
  if (!shell) notFound();

  return (
    <ProjectShell
      projectId={shell.project.id}
      projectName={shell.project.name}
      projectColor={shell.project.color}
      canEditIcon={shell.role === "owner"}
      user={user}
    >
      {children}
    </ProjectShell>
  );
}
