import { cache } from "react";
import {
  isMissingAccessSchema,
  parseProjectAccess,
  type MembershipRow,
  type MembershipSource,
  type ProjectAccessRow,
} from "@/lib/access";
import { supabase, unwrap } from "@/lib/supabase";

export async function isGroupMember(groupId: string, userId: string) {
  const row = unwrap(
    await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  return Boolean(row);
}

export async function canAccessProject(
  project: ProjectAccessRow,
  userId: string,
  membership: Pick<MembershipRow, "source"> | null,
) {
  if (project.owner_id === userId) return true;
  const access = parseProjectAccess(project.access);
  if (access === "organization") return true;
  if (access === "group" && project.group_id) {
    if (await isGroupMember(project.group_id, userId)) return true;
    return Boolean(membership && membership.source !== "access");
  }
  return Boolean(membership);
}

async function insertMembership(projectId: string, userId: string, role: string, source: MembershipSource) {
  const result = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
      source,
    })
    .select("id, role, source")
    .single();

  if (!result.error) return result.data as MembershipRow;

  if (result.error.code === "23505" || /duplicate/i.test(result.error.message)) {
    return unwrap(
      await supabase
        .from("project_members")
        .select("id, role, source")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle(),
    ) as MembershipRow | null;
  }

  if (isMissingAccessSchema(result.error)) {
    unwrap(
      await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: userId,
        role,
      }),
    );
    return unwrap(
      await supabase
        .from("project_members")
        .select("id, role, source")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle(),
    ) as MembershipRow | null;
  }

  throw new Error(result.error.message);
}

export const ensureProjectAccess = cache(async (projectId: string, userId: string): Promise<MembershipRow | null> => {
  try {
    const [project, membership] = await Promise.all([
      supabase
        .from("projects")
        .select("id, access, group_id, owner_id")
        .eq("id", projectId)
        .maybeSingle()
        .then((result) => unwrap(result) as ProjectAccessRow | null),
      supabase
        .from("project_members")
        .select("id, role, source")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle()
        .then((result) => unwrap(result) as MembershipRow | null),
    ]);
    if (!project) return null;
    if (!(await canAccessProject(project, userId, membership))) return null;
    if (membership) return membership;

    const role = project.owner_id === userId ? "owner" : "member";
    const source: MembershipSource = project.owner_id === userId ? "owner" : "access";
    return insertMembership(projectId, userId, role, source);
  } catch (error) {
    if (!isMissingAccessSchema(error)) throw error;
    return unwrap(
      await supabase
        .from("project_members")
        .select("id, role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle(),
    ) as MembershipRow | null;
  }
});
