import type { MemberDTO, Profile, TaskDTO } from "@/lib/types";
import { iso, memberFromUser } from "@/lib/types";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  username?: string | null;
  role?: string | null;
  password_hash?: string | null;
};

export type TaskRow = {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  points: number | null;
  rank: number;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  assignee_id: string | null;
};

export function mapUser(row: UserRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    initials: row.initials,
    color: row.color,
    username: row.username ?? null,
    role: row.role ?? "member",
  };
}

export function mapTask(
  row: TaskRow,
  extras: {
    assignee?: UserRow | null;
    sprintName?: string | null;
    commentCount?: number;
    attachmentCount?: number;
  } = {},
): TaskDTO {
  return {
    id: row.id,
    projectId: row.project_id,
    sprintId: row.sprint_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    type: row.type,
    points: row.points,
    rank: row.rank,
    startDate: iso(row.start_date),
    dueDate: iso(row.due_date),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    assignee: extras.assignee ? memberFromUser(mapUser(extras.assignee)) : null,
    sprintName: extras.sprintName ?? null,
    commentCount: extras.commentCount ?? 0,
    attachmentCount: extras.attachmentCount ?? 0,
  };
}

export function memberFromRow(user: UserRow, role = "member"): MemberDTO {
  return memberFromUser(mapUser(user), role);
}
