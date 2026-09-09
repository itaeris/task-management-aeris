"use client";

import { BacklogBoard } from "@/components/backlog-board";
import { useWorkspace } from "@/components/workspace-provider";

export default function BacklogPage() {
  const { project, tasks, members, sprints } = useWorkspace();
  return (
    <BacklogBoard projectId={project.id} tasks={tasks} members={members} sprints={sprints} />
  );
}
