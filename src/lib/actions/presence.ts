"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { USER_COOKIE } from "@/lib/auth";

export type PresencePerson = {
  userId: string;
  name: string;
  initials: string;
  color: string;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  taskId: string | null;
  taskTitle: string | null;
  pageLabel: string;
  path: string;
  isMe: boolean;
};

function pageLabel(path: string) {
  if (path === "/" || path === "") return "Home";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/guide")) return "How to use";
  if (path.startsWith("/join/")) return "Join project";
  const rest = path.replace(/^\/projects\/[^/]+/, "") || "/";
  const labels: Record<string, string> = {
    "/": "Overview",
    "/backlog": "Product log",
    "/scrum": "Scrum log",
    "/daily": "Daily check",
    "/kanban": "Kanban",
    "/calendar": "Calendar",
    "/timeline": "Timeline",
    "/analyze": "Analyze",
    "/share": "Share",
    "/guide": "How to use",
  };
  return labels[rest] ?? "Workspace";
}

function projectIdFromPath(path: string) {
  const match = path.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

function isMissingTable(error: { message: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "ER_NO_SUCH_TABLE" || /unknown table|does not exist|schema cache/i.test(error.message);
}

export async function pingPresence(path: string, taskId?: string | null) {
  const userId = (await cookies()).get(USER_COOKIE)?.value;
  if (!userId) return;
  const cleanPath = path.startsWith("/") ? path : "/";
  const projectId = projectIdFromPath(cleanPath);
  const updatedAt = new Date();
  const payloads = [
    { user_id: userId, project_id: projectId, task_id: taskId || null, path: cleanPath, updated_at: updatedAt },
    { user_id: userId, project_id: projectId, task_id: null, path: cleanPath, updated_at: updatedAt },
    { user_id: userId, project_id: null, task_id: null, path: cleanPath, updated_at: updatedAt },
  ];
  const seen = new Set<string>();
  for (const payload of payloads) {
    const key = `${payload.project_id ?? ""}:${payload.task_id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { error } = await db.from("presences").upsert(payload);
    if (!error) return;
    if (isMissingTable(error)) return;
  }
}

export async function listPresence(): Promise<PresencePerson[]> {
  const meId = (await cookies()).get(USER_COOKIE)?.value;
  if (!meId) return [];

  const cutoff = new Date(Date.now() - 180_000);
  const { data, error } = await db
    .from("presences")
    .select("user_id, project_id, task_id, path, updated_at")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    project_id: string | null;
    task_id: string | null;
    path: string;
  }>;
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const projectIds = [...new Set(rows.map((row) => row.project_id).filter(Boolean))] as string[];
  const taskIds = [...new Set(rows.map((row) => row.task_id).filter(Boolean))] as string[];

  const [{ data: users }, { data: projects }, { data: tasks }] = await Promise.all([
    db.from("users").select("id, name, initials, color").in("id", userIds),
    projectIds.length
      ? db.from("projects").select("id, name, color").in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; color: string }> }),
    taskIds.length
      ? db.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);

  const userMap = new Map((users ?? []).map((item) => [item.id, item]));
  const projectMap = new Map((projects ?? []).map((item) => [item.id, item]));
  const taskMap = new Map((tasks ?? []).map((item) => [item.id, item]));

  return rows.flatMap((row) => {
    const person = userMap.get(row.user_id);
    if (!person) return [];
    const project = row.project_id ? projectMap.get(row.project_id) : null;
    const task = row.task_id ? taskMap.get(row.task_id) : null;
    return [
      {
        userId: person.id,
        name: person.name,
        initials: person.initials,
        color: person.color,
        projectId: project?.id ?? row.project_id,
        projectName: project?.name ?? null,
        projectColor: project?.color ?? null,
        taskId: task?.id ?? row.task_id,
        taskTitle: task?.title ?? null,
        pageLabel: pageLabel(row.path),
        path: row.path,
        isMe: person.id === meId,
      } satisfies PresencePerson,
    ];
  });
}

export async function clearPresence() {
  const userId = (await cookies()).get(USER_COOKIE)?.value;
  if (!userId) return;
  await db.from("presences").delete().eq("user_id", userId);
}
