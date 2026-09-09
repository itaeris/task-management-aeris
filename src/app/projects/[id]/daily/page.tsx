"use client";

import { DailyView } from "@/components/daily-view";
import { useWorkspace } from "@/components/workspace-provider";

export default function DailyPage() {
  const { project, userId, dailyLogs, members } = useWorkspace();
  return (
    <DailyView projectId={project.id} currentUserId={userId} logs={dailyLogs} members={members} />
  );
}
