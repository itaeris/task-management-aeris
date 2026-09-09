"use server";

import { revalidatePath } from "next/cache";
import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember } from "@/lib/auth";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/constants";

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function uploadAttachment(taskId: string, formData: FormData) {
  const existing = unwrap(
    await supabase.from("tasks").select("id, project_id, title").eq("id", taskId).maybeSingle(),
  ) as { id: string; project_id: string; title: string } | null;
  if (!existing) throw new Error("Task not found.");
  const { user } = await requireProjectMember(existing.project_id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file first.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Maximum file size is 10MB.");
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mimeType)) throw new Error("File type is not supported.");

  const storedName = `${taskId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage.from("attachments").upload(storedName, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  unwrap(
    await supabase.from("attachments").insert({
      task_id: taskId,
      user_id: user.id,
      filename: file.name,
      mime_type: mimeType,
      size: file.size,
      stored_name: storedName,
    }),
  );
  unwrap(
    await supabase.from("activities").insert({
      project_id: existing.project_id,
      user_id: user.id,
      message: `mengunggah ${file.name} ke "${existing.title}"`,
    }),
  );
  refresh(existing.project_id);
}

export async function deleteAttachment(attachmentId: string) {
  const file = unwrap(
    await supabase
      .from("attachments")
      .select("id, stored_name, task_id, tasks (project_id)")
      .eq("id", attachmentId)
      .maybeSingle(),
  ) as { stored_name: string; tasks: { project_id: string } | { project_id: string }[] | null } | null;
  if (!file) throw new Error("File not found.");
  const task = Array.isArray(file.tasks) ? file.tasks[0] : file.tasks;
  if (!task) throw new Error("Task not found.");
  await requireProjectMember(task.project_id);
  await supabase.storage.from("attachments").remove([file.stored_name]);
  unwrap(await supabase.from("attachments").delete().eq("id", attachmentId));
  refresh(task.project_id);
}
