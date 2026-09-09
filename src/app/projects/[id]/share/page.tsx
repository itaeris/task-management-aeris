import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { SharePanel } from "@/components/share-panel";

export default async function SharePage({
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
    <SharePanel
      projectId={id}
      name={workspace.project.name}
      description={workspace.project.description}
      shareCode={workspace.project.shareCode}
      color={workspace.project.color}
      role={workspace.role}
      members={workspace.members}
    />
  );
}
