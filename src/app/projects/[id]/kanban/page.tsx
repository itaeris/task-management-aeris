"use client";

import { KanbanBoard } from "@/components/kanban-board";
import { useWorkspace } from "@/components/workspace-provider";

export default function KanbanPage() {
  const { project, tasks, members, sprints } = useWorkspace();
  return (
    <KanbanBoard projectId={project.id} tasks={tasks} members={members} sprints={sprints} />
  );
}
