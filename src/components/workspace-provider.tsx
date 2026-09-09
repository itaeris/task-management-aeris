"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CalendarConnectionPublic, ProjectWorkspace } from "@/lib/types";

type WorkspaceContextValue = ProjectWorkspace & {
  userId: string;
  calendar: CalendarConnectionPublic;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  workspace,
  userId,
  calendar,
  children,
}: {
  workspace: ProjectWorkspace;
  userId: string;
  calendar: CalendarConnectionPublic;
  children: ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={{ ...workspace, userId, calendar }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside a project.");
  return value;
}
