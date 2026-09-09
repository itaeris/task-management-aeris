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
  if (!name) throw new Error("Nama project wajib diisi.");

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
  await logActivity(project.id, user.id, `membuat project ${name}`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Hanya owner yang bisa mengubah project.");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  if (!name) throw new Error("Nama project wajib diisi.");
  const patch: { name: string; description: string; updated_at: string; color?: string } = {
    name,
    description,
    updated_at: new Date().toISOString(),
  };
  if (isFlaticonId(icon)) patch.color = encodeProjectIcon(icon);
  unwrap(await supabase.from("projects").update(patch).eq("id", projectId));
  await logActivity(projectId, user.id, `memperbarui detail project`);
  refresh(projectId);
}

export async function updateProjectIcon(projectId: string, icon: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Hanya owner yang bisa mengubah icon.");
  if (!isFlaticonId(icon)) throw new Error("Icon tidak valid.");
  unwrap(
    await supabase
      .from("projects")
      .update({ color: encodeProjectIcon(icon), updated_at: new Date().toISOString() })
      .eq("id", projectId),
  );
  await logActivity(projectId, user.id, "mengganti icon project");
  refresh(projectId);
}

export async function joinProject(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!code) throw new Error("Kode share wajib diisi.");
  const project = await findProjectByCode(code);
  if (!project) throw new Error("Kode share tidak valid.");
  await joinMember(project.id, user.id);
  await logActivity(project.id, user.id, `bergabung ke project`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function joinProjectByCode(code: string) {
  const user = await requireUser();
  const project = await findProjectByCode(code.toUpperCase());
  if (!project) throw new Error("Kode share tidak valid.");
  await joinMember(project.id, user.id);
  await logActivity(project.id, user.id, `bergabung lewat tautan share`);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function rotateShareCode(projectId: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Hanya owner yang bisa merotasi kode.");
  const next = shareCode();
  unwrap(await supabase.from("projects").update({ share_code: next, updated_at: new Date().toISOString() }).eq("id", projectId));
  await logActivity(projectId, user.id, `merotasi kode share`);
  refresh(projectId);
  return next;
}

export async function leaveProject(projectId: string) {
  const { user, membership } = await requireProjectMember(projectId);
  if (membership.role === "owner") {
    throw new Error("Owner tidak bisa keluar. Serahkan project dulu.");
  }
  unwrap(
    await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", user.id),
  );
  await logActivity(projectId, user.id, `keluar dari project`);
  refresh(projectId);
  redirect("/");
}
