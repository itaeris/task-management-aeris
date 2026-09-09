"use server";

import { revalidatePath } from "next/cache";
import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember, requireUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";
import { getTaskDetail } from "@/lib/queries";
import { notifyGoogleCalendarTaskChanged, notifyGoogleCalendarTaskDeleted } from "@/lib/google-calendar";

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

async function nextRank(projectId: string) {
  const last = unwrap(
    await supabase
      .from("tasks")
      .select("rank")
      .eq("project_id", projectId)
      .order("rank", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as { rank: number } | null;
  return (last?.rank ?? 0) + 1000;
}

export async function createTask(projectId: string, formData: FormData) {
  const { user } = await requireProjectMember(projectId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required.");
  const pointsRaw = String(formData.get("points") ?? "").trim();

  const task = unwrap(
    await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title,
        description: String(formData.get("description") ?? "").trim(),
        type: String(formData.get("type") ?? "story"),
        priority: String(formData.get("priority") ?? "medium"),
        status: String(formData.get("status") ?? "backlog"),
        sprint_id: String(formData.get("sprintId") ?? "") || null,
        assignee_id: String(formData.get("assigneeId") ?? "") || null,
        points: pointsRaw ? Number(pointsRaw) : null,
        start_date: parseDateInput(formData.get("startDate"))?.toISOString() ?? null,
        due_date: parseDateInput(formData.get("dueDate"))?.toISOString() ?? null,
        rank: await nextRank(projectId),
      })
      .select("id, title")
      .single(),
  ) as { id: string; title: string };

  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `added "${task.title}"`,
    }),
  );
  await notifyGoogleCalendarTaskChanged(task.id);
  refresh(projectId);
  return task.id;
}

export async function updateTask(taskId: string, formData: FormData) {
  const existing = unwrap(
    await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle(),
  ) as { project_id: string; title: string } | null;
  if (!existing) throw new Error("Task not found.");
  const { user } = await requireProjectMember(existing.project_id);
  const pointsRaw = String(formData.get("points") ?? "").trim();

  unwrap(
    await supabase
      .from("tasks")
      .update({
        title: String(formData.get("title") ?? existing.title).trim(),
        description: String(formData.get("description") ?? ""),
        type: String(formData.get("type") ?? "story"),
        priority: String(formData.get("priority") ?? "medium"),
        status: String(formData.get("status") ?? "backlog"),
        sprint_id: String(formData.get("sprintId") ?? "") || null,
        assignee_id: String(formData.get("assigneeId") ?? "") || null,
        points: pointsRaw ? Number(pointsRaw) : null,
        start_date: parseDateInput(formData.get("startDate"))?.toISOString() ?? null,
        due_date: parseDateInput(formData.get("dueDate"))?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId),
  );
  unwrap(
    await supabase.from("activities").insert({
      project_id: existing.project_id,
      user_id: user.id,
      message: `updated "${existing.title}"`,
    }),
  );
  await notifyGoogleCalendarTaskChanged(taskId);
  refresh(existing.project_id);
}

export async function moveTask(taskId: string, status: string, rank: number, sprintId?: string | null) {
  const existing = unwrap(
    await supabase.from("tasks").select("project_id").eq("id", taskId).maybeSingle(),
  ) as { project_id: string } | null;
  if (!existing) throw new Error("Task not found.");
  await requireProjectMember(existing.project_id);
  unwrap(
    await supabase
      .from("tasks")
      .update({
        status,
        rank,
        updated_at: new Date().toISOString(),
        ...(sprintId !== undefined ? { sprint_id: sprintId } : {}),
      })
      .eq("id", taskId),
  );
  await notifyGoogleCalendarTaskChanged(taskId);
  refresh(existing.project_id);
}

export async function reorderTasks(projectId: string, orderedIds: string[]) {
  await requireProjectMember(projectId);
  await Promise.all(
    orderedIds.map(async (id, index) => {
      unwrap(await supabase.from("tasks").update({ rank: (index + 1) * 1000 }).eq("id", id));
    }),
  );
  refresh(projectId);
}

export async function deleteTask(taskId: string) {
  const existing = unwrap(
    await supabase.from("tasks").select("project_id, title").eq("id", taskId).maybeSingle(),
  ) as { project_id: string; title: string } | null;
  if (!existing) throw new Error("Task not found.");
  const { user } = await requireProjectMember(existing.project_id);
  await notifyGoogleCalendarTaskDeleted(taskId);
  unwrap(await supabase.from("tasks").delete().eq("id", taskId));
  unwrap(
    await supabase.from("activities").insert({
      project_id: existing.project_id,
      user_id: user.id,
      message: `deleted "${existing.title}"`,
    }),
  );
  refresh(existing.project_id);
}

export async function addComment(taskId: string, formData: FormData) {
  const existing = unwrap(
    await supabase.from("tasks").select("project_id").eq("id", taskId).maybeSingle(),
  ) as { project_id: string } | null;
  if (!existing) throw new Error("Task not found.");
  const { user } = await requireProjectMember(existing.project_id);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment cannot be empty.");
  unwrap(await supabase.from("comments").insert({ task_id: taskId, user_id: user.id, body }));
  refresh(existing.project_id);
}

export async function loadTaskDetail(taskId: string) {
  const user = await requireUser();
  const task = await getTaskDetail(taskId, user.id);
  if (!task) throw new Error("Task not found.");
  return task;
}
