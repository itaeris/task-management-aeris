"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember, requireUser } from "@/lib/auth";
import { DEFAULT_PROJECT_ICON, encodeProjectIcon, isFlaticonId } from "@/lib/project-icon";
import { shareCode } from "@/lib/utils";

function refresh(projectId?: string) {
  revalidatePath("/");
  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
}

async function logActivity(projectId: string, userId: string, message: string) {
  unwrap(await supabase.from("activities").insert({ project_id: projectId, user_id: userId, message }));
}

async function findProjectByCode(code: string) {
  return unwrap(
    await supabase
      .from("projects")
      .select("id, share_code")
      .eq("share_code", code)
      .maybeSingle(),
  ) as { id: string; share_code: string } | null;
}

async function joinMember(projectId: string, userId: string) {
  const existing = unwrap(
    await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (existing) return;
  unwrap(
    await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
      role: "member",
    }),
  );
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? DEFAULT_PROJECT_ICON).trim();
  const color = encodeProjectIcon(isFlaticonId(icon) ? icon : DEFAULT_PROJECT_ICON);
  if (!name) throw new Error("Project name is required.");

  const project = unwrap(
    await supabase
      .from("projects")
      .insert({
        name,
        description,
        color,
        share_code: shareCode(),
        owner_id: user.id,
      })
      .select("id")
      .single(),
  ) as { id: string };

  unwrap(
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
    }),
  );
  await logActivity(project.id, user.id, `created project ${name}`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can edit this project.");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  if (!name) throw new Error("Project name is required.");
  const patch: { name: string; description: string; updated_at: string; color?: string } = {
    name,
    description,
    updated_at: new Date().toISOString(),
  };
  if (isFlaticonId(icon)) patch.color = encodeProjectIcon(icon);
  unwrap(await supabase.from("projects").update(patch).eq("id", projectId));
  await logActivity(projectId, user.id, `updated project details`);
  refresh(projectId);
}

export async function updateProjectIcon(projectId: string, icon: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can change the icon.");
  if (!isFlaticonId(icon)) throw new Error("Invalid icon.");
  unwrap(
    await supabase
      .from("projects")
      .update({ color: encodeProjectIcon(icon), updated_at: new Date().toISOString() })
      .eq("id", projectId),
  );
  await logActivity(projectId, user.id, "changed the project icon");
  refresh(projectId);
}

export async function joinProject(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!code) throw new Error("Share code is required.");
  const project = await findProjectByCode(code);
  if (!project) throw new Error("Invalid share code.");
  await joinMember(project.id, user.id);
  await logActivity(project.id, user.id, `joined the project`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function joinProjectByCode(code: string) {
  const user = await requireUser();
  const project = await findProjectByCode(code.toUpperCase());
  if (!project) throw new Error("Invalid share code.");
  await joinMember(project.id, user.id);
  await logActivity(project.id, user.id, `joined via share link`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function rotateShareCode(projectId: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can rotate the code.");
  const next = shareCode();
  unwrap(await supabase.from("projects").update({ share_code: next, updated_at: new Date().toISOString() }).eq("id", projectId));
  await logActivity(projectId, user.id, `rotated the share code`);
  refresh(projectId);
  return next;
}

export async function leaveProject(projectId: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role === "owner") {
    throw new Error("The owner cannot leave. Transfer the project first.");
  }
  unwrap(
    await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", user.id),
  );
  await logActivity(projectId, user.id, `left the project`);
  refresh(projectId);
  redirect("/");
}
