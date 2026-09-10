"use server";

import { redirect } from "next/navigation";
import {
  canLeaveProject,
  isMissingAccessSchema,
  isMissingPinsSchema,
  parseProjectAccess,
  type ProjectAccess,
} from "@/lib/access";
import { isGroupMember } from "@/lib/project-access";
import { addGroupMembersToProject, createGroupRecord } from "@/lib/groups";
import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember, requireUser } from "@/lib/auth";
import { removeProjectFromGoogleCalendar } from "@/lib/google-calendar";
import { DEFAULT_PROJECT_ICON, encodeProjectIcon, isFlaticonId } from "@/lib/project-icon";
import { shareCode } from "@/lib/utils";
import { revalidateHome, revalidateProject } from "@/lib/revalidate";

function refresh(projectId?: string) {
  if (projectId) revalidateProject(projectId);
  else revalidateHome();
}

function migrationHint() {
  return "Project access columns are missing. Run supabase/migration_project_access.sql in the SQL Editor.";
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
  const result = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "member",
    source: "invite",
  });
  if (result.error && isMissingAccessSchema(result.error)) {
    unwrap(
      await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: userId,
        role: "member",
      }),
    );
    return;
  }
  if (result.error) throw new Error(result.error.message);
}

async function resolveAccess(
  formData: FormData,
  userId: string,
  currentGroupId?: string | null,
) {
  const access = parseProjectAccess(formData.get("access"));
  if (access !== "group") return { access, groupId: null as string | null };

  const selected = String(formData.get("groupId") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "").trim();
  const memberIds = formData.getAll("members").map((value) => String(value));

  if (selected && selected !== "new") {
    if (!(await isGroupMember(selected, userId))) {
      throw new Error("You can only use a group you belong to.");
    }
    return { access, groupId: selected };
  }
  if (selected === "current" && currentGroupId) {
    if (!(await isGroupMember(currentGroupId, userId))) {
      throw new Error("You can only use a group you belong to.");
    }
    return { access, groupId: currentGroupId };
  }
  if (!groupName) throw new Error("Group name is required.");
  return { access, groupId: await createGroupRecord(groupName, userId, memberIds) };
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? DEFAULT_PROJECT_ICON).trim();
  const color = encodeProjectIcon(isFlaticonId(icon) ? icon : DEFAULT_PROJECT_ICON);
  if (!name) throw new Error("Project name is required.");

  let access: ProjectAccess = "personal";
  let groupId: string | null = null;
  try {
    const resolved = await resolveAccess(formData, user.id);
    access = resolved.access;
    groupId = resolved.groupId;
  } catch (error) {
    if (isMissingAccessSchema(error)) throw new Error(migrationHint());
    throw error;
  }

  const payload: Record<string, string | null> = {
    name,
    description,
    color,
    share_code: shareCode(),
    owner_id: user.id,
    access,
    group_id: groupId,
  };

  let project: { id: string };
  const inserted = await supabase.from("projects").insert(payload).select("id").single();
  if (inserted.error && isMissingAccessSchema(inserted.error)) {
    if (access !== "personal") throw new Error(migrationHint());
    project = unwrap(
      await supabase
        .from("projects")
        .insert({
          name,
          description,
          color,
          share_code: payload.share_code,
          owner_id: user.id,
        })
        .select("id")
        .single(),
    ) as { id: string };
  } else if (inserted.error) {
    throw new Error(inserted.error.message);
  } else {
    project = inserted.data as { id: string };
  }

  const ownerResult = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "owner",
    source: "owner",
  });
  if (ownerResult.error && isMissingAccessSchema(ownerResult.error)) {
    unwrap(
      await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role: "owner",
      }),
    );
  } else if (ownerResult.error) {
    throw new Error(ownerResult.error.message);
  }

  if (access === "group" && groupId) {
    await Promise.all([
      addGroupMembersToProject(project.id, groupId, user.id),
      logActivity(project.id, user.id, `created project ${name}`),
    ]);
  } else {
    await logActivity(project.id, user.id, `created project ${name}`);
  }
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { user, membership, project } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can edit this project.");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  if (!name) throw new Error("Project name is required.");

  const patch: {
    name: string;
    description: string;
    updated_at: string;
    color?: string;
    access?: ProjectAccess;
    group_id?: string | null;
  } = {
    name,
    description,
    updated_at: new Date().toISOString(),
  };
  if (isFlaticonId(icon)) patch.color = encodeProjectIcon(icon);

  if (formData.has("access")) {
    const resolved = await resolveAccess(formData, user.id, project.group_id ?? null);
    patch.access = resolved.access;
    patch.group_id = resolved.groupId;
    if (resolved.access === "personal") {
      await supabase.from("project_members").delete().eq("project_id", projectId).eq("source", "access");
    }
    if (resolved.access === "group" && resolved.groupId) {
      await addGroupMembersToProject(projectId, resolved.groupId, user.id);
    }
    if (resolved.access !== "organization") {
      const cleared = await supabase.from("project_pins").delete().eq("project_id", projectId);
      if (cleared.error && !isMissingPinsSchema(cleared.error)) throw new Error(cleared.error.message);
    }
  }

  const updated = await supabase.from("projects").update(patch).eq("id", projectId);
  if (updated.error && isMissingAccessSchema(updated.error) && (patch.access || patch.group_id !== undefined)) {
    throw new Error(migrationHint());
  }
  if (updated.error) throw new Error(updated.error.message);
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

export async function toggleProjectPin(projectId: string) {
  const { user, project } = await requireProjectMember(projectId);
  if (parseProjectAccess(project.access) !== "organization") {
    throw new Error("Only organization projects can be pinned.");
  }

  try {
    const existing = unwrap(
      await supabase
        .from("project_pins")
        .select("id")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .maybeSingle(),
    ) as { id: string } | null;

    if (existing) {
      unwrap(await supabase.from("project_pins").delete().eq("id", existing.id));
    } else {
      unwrap(await supabase.from("project_pins").insert({ user_id: user.id, project_id: projectId }));
    }
  } catch (error) {
    if (isMissingPinsSchema(error)) {
      throw new Error("Project pins are missing. Run supabase/migration_project_pins.sql in the SQL Editor.");
    }
    throw error;
  }

  revalidateHome();
}

export async function leaveProject(projectId: string) {
  const { user, membership, project } = await requireProjectMember(projectId);
  const access = parseProjectAccess(project.access);
  if (!canLeaveProject(access, membership.role, membership.source)) {
    if (membership.role === "owner") {
      throw new Error("The owner cannot leave. Transfer the project first.");
    }
    if (access === "organization") {
      throw new Error("Organization projects are open to everyone in the workspace.");
    }
    throw new Error("Group members keep access automatically. Ask the owner to remove you from the group.");
  }
  unwrap(
    await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", user.id),
  );
  await logActivity(projectId, user.id, `left the project`);
  refresh(projectId);
  redirect("/");
}

export async function deleteProject(projectId: string, confirmation: string) {
  const { membership } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can delete this project.");
  if (confirmation !== "DELETE") throw new Error("Type DELETE to confirm.");

  const tasks = unwrap(
    await supabase.from("tasks").select("id").eq("project_id", projectId),
  ) as Array<{ id: string }>;
  const taskIds = tasks.map((task) => task.id);
  if (taskIds.length) {
    const files = unwrap(
      await supabase.from("attachments").select("stored_name").in("task_id", taskIds),
    ) as Array<{ stored_name: string }>;
    if (files.length) {
      await supabase.storage.from("attachments").remove(files.map((file) => file.stored_name));
    }
  }

  try {
    await removeProjectFromGoogleCalendar(projectId);
  } catch {
    // Calendar cleanup is best-effort; the project still deletes.
  }

  unwrap(await supabase.from("projects").delete().eq("id", projectId));
  revalidateHome();
}
