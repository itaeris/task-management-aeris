"use client";

import { TimelineView } from "@/components/timeline-view";
import { useWorkspace } from "@/components/workspace-provider";

export default function TimelinePage() {
  const { tasks, members, sprints } = useWorkspace();
  return <TimelineView tasks={tasks} members={members} sprints={sprints} />;
}
