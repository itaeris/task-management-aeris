"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

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
  if (path === "/" || path === "") return "Beranda";
  if (path.startsWith("/settings")) return "Settings";
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
    "/share": "Share",
  };
  return labels[rest] ?? "Workspace";
}

function projectIdFromPath(path: string) {
  const match = path.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}

export async function pingPresence(path: string, taskId?: string | null) {
  const user = await getCurrentUser();
  if (!user) return;
  const cleanPath = path.startsWith("/") ? path : "/";
  const projectId = projectIdFromPath(cleanPath);
  const payload = {
    user_id: user.id,
    project_id: projectId,
    task_id: taskId || null,
    path: cleanPath,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("presences").upsert(payload);
  if (!error) return;
  if (/presences|schema cache|does not exist/i.test(error.message)) return;
  if (payload.task_id) {
    const retry = await supabase.from("presences").upsert({ ...payload, task_id: null });
    if (!retry.error) return;
  }
}

export async function listPresence(): Promise<PresencePerson[]> {
  const me = await getCurrentUser();
  if (!me) return [];

  const cutoff = new Date(Date.now() - 90_000).toISOString();
  const { data, error } = await supabase
    .from("presences")
    .select("user_id, project_id, task_id, path, updated_at")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });

  if (error) {
    if (/presences|schema cache|does not exist/i.test(error.message)) return [];
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
    supabase.from("users").select("id, name, initials, color").in("id", userIds),
    projectIds.length
      ? supabase.from("projects").select("id, name, color").in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; color: string }> }),
    taskIds.length
      ? supabase.from("tasks").select("id, title").in("id", taskIds)
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
        isMe: person.id === me.id,
      } satisfies PresencePerson,
    ];
  });
}

export async function clearPresence() {
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from("presences").delete().eq("user_id", user.id);
}
