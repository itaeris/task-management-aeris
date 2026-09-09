import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectByShareCode, isProjectMember } from "@/lib/queries";
import { joinProjectByCode } from "@/lib/actions/projects";
import { ProjectIcon } from "@/components/project-icon";
import { btnPrimary, surface } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [user, project] = await Promise.all([getCurrentUser(), getProjectByShareCode(code)]);

  if (!project) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
        <h1 className="font-serif text-4xl">Invalid share code</h1>
        <p className="mt-2 text-muted">Ask the project owner for a new link.</p>
      </main>
    );
  }

  if (!user) {
    redirect(`/login?next=/join/${encodeURIComponent(project.shareCode)}`);
  }

  if (await isProjectMember(project.id, user.id)) {
    redirect(`/projects/${project.id}`);
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <div className={cn(surface, "rounded-3xl p-8 text-center")}>
        <ProjectIcon value={project.color} size="lg" className="mx-auto mb-4" />
        <h1 className="font-serif text-4xl">{project.name}</h1>
        <p className="mt-2 text-sm text-muted">{project.description}</p>
        <p className="mt-3 text-xs text-muted">
          {project._count.members} {project._count.members === 1 ? "member" : "members"} · {project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}
        </p>
        <form className="mt-6" action={joinProjectByCode.bind(null, project.shareCode)}>
          <button className={btnPrimary}>Join project</button>
        </form>
      </div>
    </main>
  );
}
