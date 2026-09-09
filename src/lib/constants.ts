export const STATUSES = [
  { id: "backlog", label: "Backlog", tone: "muted" },
  { id: "todo", label: "To Do", tone: "slate" },
  { id: "in_progress", label: "In Progress", tone: "amber" },
  { id: "review", label: "Review", tone: "blue" },
  { id: "done", label: "Done", tone: "green" },
] as const;

export const KANBAN_COLUMNS = STATUSES.filter((status) => status.id !== "backlog");

export const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
] as const;

export const TASK_TYPES = [
  { id: "story", label: "Story" },
  { id: "task", label: "Task" },
  { id: "bug", label: "Bug" },
  { id: "spike", label: "Spike" },
] as const;

export const SPRINT_STATUSES = [
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
]);

export type StatusId = (typeof STATUSES)[number]["id"];
export type PriorityId = (typeof PRIORITIES)[number]["id"];
export type TaskTypeId = (typeof TASK_TYPES)[number]["id"];
export type SprintStatusId = (typeof SPRINT_STATUSES)[number]["id"];
