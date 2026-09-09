export type MemberDTO = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: string;
};

export type TaskDTO = {
  id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  points: number | null;
  rank: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: MemberDTO | null;
  sprintName: string | null;
  commentCount: number;
  attachmentCount: number;
};

export type TaskDetailDTO = TaskDTO & {
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    user: MemberDTO;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
    user: MemberDTO;
  }>;
};

export type SprintDTO = {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  taskCount: number;
  doneCount: number;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  username?: string | null;
  role?: string;
};

export type CalendarConnectionPublic = {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
};

export type ProjectWorkspace = {
  project: {
    id: string;
    name: string;
    description: string;
    color: string;
    shareCode: string;
    ownerId: string;
    access: import("@/lib/access").ProjectAccess;
    groupId: string | null;
    groupName: string | null;
  };
  role: string;
  membershipSource: string;
  members: MemberDTO[];
  groupMembers: MemberDTO[];
  sprints: SprintDTO[];
  tasks: TaskDTO[];
  dailyLogs: Array<{
    id: string;
    date: string;
    yesterday: string;
    today: string;
    blockers: string;
    user: MemberDTO;
    updatedAt: string;
  }>;
  activities: Array<{
    id: string;
    message: string;
    createdAt: string;
    user: MemberDTO;
  }>;
  todayCheckins: number;
};

export function memberFromUser(
  user: Pick<Profile, "id" | "name" | "email" | "initials" | "color">,
  role = "member",
): MemberDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: user.initials,
    color: user.color,
    role,
  };
}

export function iso(value: string | Date | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}
