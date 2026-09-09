"use client";

import { SharePanel } from "@/components/share-panel";
import { useWorkspace } from "@/components/workspace-provider";

export default function ShareFromWorkspace({
  people,
  groups,
}: {
  people: Array<{ id: string; name: string; email: string; initials: string; color: string }>;
  groups: Array<{ id: string; name: string; memberCount: number }>;
}) {
  const { project, role, membershipSource, members, groupMembers, userId } = useWorkspace();
  return (
    <SharePanel
      projectId={project.id}
      name={project.name}
      description={project.description}
      shareCode={project.shareCode}
      color={project.color}
      role={role}
      access={project.access}
      groupId={project.groupId}
      groupName={project.groupName}
      membershipSource={membershipSource}
      members={members}
      groupMembers={groupMembers}
      groups={groups}
      people={people}
      currentUserId={userId}
    />
  );
}
