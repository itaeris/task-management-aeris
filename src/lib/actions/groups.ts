"use server";

import { revalidatePath } from "next/cache";
import { parseProjectAccess } from "@/lib/access";
import { addGroupMembersToProject } from "@/lib/groups";
import { requireProjectMember } from "@/lib/auth";
import { supabase, unwrap } from "@/lib/supabase";
import { revalidateProject } from "@/lib/revalidate";

function refresh(projectId: string) {
  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/share`);
}

export async function addGroupMember(projectId: string, formData: FormData) {
  const { user, membership, project } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can edit the group.");
  if (parseProjectAccess(project.access) !== "group" || !project.group_id) {
    throw new Error("This project is not linked to a group.");
  }
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) throw new Error("Pick a person to add.");

  const existing = unwrap(
    await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", project.group_id)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!existing) {
    unwrap(
      await supabase.from("group_members").insert({
        group_id: project.group_id,
        user_id: userId,
      }),
    );
  }
  await addGroupMembersToProject(projectId, project.group_id, user.id);
  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: "added someone to the group",
    }),
  );
  refresh(projectId);
}

export async function removeGroupMember(projectId: string, userId: string) {
  const { user, membership, project } = await requireProjectMember(projectId);
  if (membership.role !== "owner") throw new Error("Only the owner can edit the group.");
  if (parseProjectAccess(project.access) !== "group" || !project.group_id) {
    throw new Error("This project is not linked to a group.");
  }
  if (userId === user.id) throw new Error("You cannot remove yourself from the group.");

  unwrap(
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", project.group_id)
      .eq("user_id", userId),
  );

  const linked = unwrap(
    await supabase.from("projects").select("id").eq("group_id", project.group_id),
  ) as Array<{ id: string }>;
  const projectIds = linked.map((row) => row.id);
  if (projectIds.length) {
    unwrap(
      await supabase
        .from("project_members")
        .delete()
        .in("project_id", projectIds)
        .eq("user_id", userId)
        .eq("source", "access"),
    );
  }

  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: "removed someone from the group",
    }),
  );
  refresh(projectId);
}
