"use client";

import { ScrumView } from "@/components/scrum-view";
import { useWorkspace } from "@/components/workspace-provider";

export default function ScrumPage() {
  const { project, sprints, tasks, members } = useWorkspace();
  return <ScrumView projectId={project.id} sprints={sprints} tasks={tasks} members={members} />;
}
