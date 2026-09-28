import { isMissingAccessSchema } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export async function createGroupRecord(name: string, creatorId: string, memberIds: string[]) {
  const group = unwrap(
    await db.from("groups").insert({ name, created_by: creatorId }).select("id").single(),
  ) as { id: string };
  const ids = [...new Set([creatorId, ...memberIds.map((id) => id.trim()).filter(Boolean)])];
  unwrap(
    await db.from("group_members").insert(ids.map((user_id) => ({ group_id: group.id, user_id }))),
  );
  return group.id;
}

export async function addGroupMembersToProject(projectId: string, groupId: string, ownerId: string) {
  const members = unwrap(
    await db.from("group_members").select("user_id").eq("group_id", groupId),
  ) as Array<{ user_id: string }>;
  const existing = unwrap(
    await db.from("project_members").select("user_id").eq("project_id", projectId),
  ) as Array<{ user_id: string }>;
  const have = new Set(existing.map((row) => row.user_id));
  const rows = members
    .filter((row) => row.user_id !== ownerId && !have.has(row.user_id))
    .map((row) => ({
      project_id: projectId,
      user_id: row.user_id,
      role: "member",
      source: "access",
    }));
  if (rows.length === 0) return;
  const result = await db.from("project_members").insert(rows);
  if (result.error && isMissingAccessSchema(result.error)) {
    unwrap(
      await db.from("project_members").insert(
        rows.map((row) => ({
          project_id: row.project_id,
          user_id: row.user_id,
          role: row.role,
        })),
      ),
    );
    return;
  }
  if (result.error) throw new Error(result.error.message);
}
