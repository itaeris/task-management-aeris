"use client";

import { AnalyzeView } from "@/components/analyze-view";
import { useWorkspace } from "@/components/workspace-provider";

export default function AnalyzePage() {
  const { project } = useWorkspace();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AnalyzeView projectId={project.id} projectName={project.name} />
    </div>
  );
}
