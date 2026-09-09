import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace, listGroupMembers, listGroupsForUser, listUsers } from "@/lib/queries";
import { SharePanel } from "@/components/share-panel";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const [workspace, people, groups] = await Promise.all([
    getProjectWorkspace(id, user.id),
    listUsers(),
    listGroupsForUser(user.id),
  ]);
  if (!workspace) notFound();
  const groupMembers = workspace.project.groupId
    ? await listGroupMembers(workspace.project.groupId)
    : [];
  return (
    <SharePanel
      projectId={id}
      name={workspace.project.name}
      description={workspace.project.description}
      shareCode={workspace.project.shareCode}
      color={workspace.project.color}
      role={workspace.role}
      access={workspace.project.access}
      groupId={workspace.project.groupId}
      groupName={workspace.project.groupName}
      membershipSource={workspace.membershipSource}
      members={workspace.members}
      groupMembers={groupMembers}
      groups={groups}
      people={people}
      currentUserId={user.id}
    />
  );
}
