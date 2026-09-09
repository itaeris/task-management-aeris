"use client";

import { Overview } from "@/components/overview";
import { useWorkspace } from "@/components/workspace-provider";

export default function ProjectOverviewPage() {
  const { project, tasks, sprints, activities, todayCheckins, members } = useWorkspace();
  return (
    <Overview
      projectId={project.id}
      description={project.description}
      tasks={tasks}
      sprints={sprints}
      activities={activities}
      todayCheckins={todayCheckins}
      memberCount={members.length}
    />
  );
}
