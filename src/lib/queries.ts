import { cache } from "react";
import { isMissingAccessSchema, parseProjectAccess, type ProjectAccess } from "@/lib/access";
import { ensureProjectAccess } from "@/lib/project-access";
import { supabase, unwrap } from "@/lib/supabase";
import { iso, memberFromUser, type ProjectWorkspace, type TaskDetailDTO } from "@/lib/types";
import { mapTask, mapUser, memberFromRow, type TaskRow, type UserRow } from "@/lib/mappers";
import { todayKey } from "@/lib/utils";

function asUser(value: UserRow | UserRow[] | null | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function countByProject(table: "project_members" | "tasks", projectId: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listUsers() {
  const rows = unwrap(
    await supabase.from("users").select("*").order("created_at", { ascending: true }),
  ) as UserRow[];
  return rows.map(mapUser);
}

export async function isProjectMember(projectId: string, userId: string) {
  return Boolean(await ensureProjectAccess(projectId, userId));
}

export async function listGroupsForUser(userId: string) {
  try {
    const rows = unwrap(
      await supabase.from("group_members").select("group_id").eq("user_id", userId),
    ) as Array<{ group_id: string }>;
    const ids = [...new Set(rows.map((row) => row.group_id))];
    if (ids.length === 0) return [];
    const groups = unwrap(
      await supabase.from("groups").select("id, name").in("id", ids),
    ) as Array<{ id: string; name: string }>;
    const countRows = unwrap(
      await supabase.from("group_members").select("group_id").in("group_id", ids),
    ) as Array<{ group_id: string }>;
    const counts = new Map<string, number>();
    for (const row of countRows) counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
    return groups.map((group) => ({
      ...group,
      memberCount: counts.get(group.id) ?? 1,
    }));
  } catch (error) {
    if (isMissingAccessSchema(error)) return [];
    throw error;
  }
}

export async function listGroupMembers(groupId: string) {
  const rows = unwrap(
    await supabase
      .from("group_members")
      .select("user_id, users (id, name, email, initials, color)")
      .eq("group_id", groupId),
  ) as Array<{ user_id: string; users: UserRow | UserRow[] | null }>;
  return rows.flatMap((row) => {
    const user = asUser(row.users);
    return user ? [memberFromRow(user, "member")] : [];
  });
}

export async function getProjectByShareCode(code: string) {
  const project = unwrap(
    await supabase
      .from("projects")
      .select("id, name, description, color, share_code")
      .eq("share_code", code.trim().toUpperCase())
      .maybeSingle(),
  ) as {
    id: string;
    name: string;
    description: string;
    color: string;
    share_code: string;
  } | null;
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    shareCode: project.share_code,
    _count: {
      members: await countByProject("project_members", project.id),
      tasks: await countByProject("tasks", project.id),
    },
  };
}

export async function listProjectsForUser(userId: string) {
  const memberships = unwrap(
    await supabase
      .from("project_members")
      .select("role, joined_at, project_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false }),
  ) as Array<{ role: string; project_id: string }>;

  const extraIds: string[] = [];
  try {
    const groupRows = unwrap(
      await supabase.from("group_members").select("group_id").eq("user_id", userId),
    ) as Array<{ group_id: string }>;
    const groupIds = [...new Set(groupRows.map((row) => row.group_id))];
    const [orgResult, groupResult] = await Promise.all([
      supabase.from("projects").select("id").eq("access", "organization"),
      groupIds.length
        ? supabase.from("projects").select("id").eq("access", "group").in("group_id", groupIds)
        : Promise.resolve({ data: [] as Array<{ id: string }>, error: null }),
    ]);
    extraIds.push(
      ...((unwrap(orgResult) as Array<{ id: string }>).map((row) => row.id)),
      ...((unwrap(groupResult) as Array<{ id: string }>).map((row) => row.id)),
    );
  } catch (error) {
    if (!isMissingAccessSchema(error)) throw error;
  }

  const seen = new Set<string>();
  const projectIds: string[] = [];
  for (const id of [...memberships.map((item) => item.project_id), ...extraIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    projectIds.push(id);
  }
  if (projectIds.length === 0) return [];

  type ProjectListRow = {
    id: string;
    name: string;
    description: string;
    color: string;
    share_code: string;
    owner_id: string;
    access?: string | null;
    group_id?: string | null;
  };

  const [projects, allMembers, taskRows, activeSprints] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .in("id", projectIds)
      .then((result) => unwrap(result) as ProjectListRow[]),
    supabase
      .from("project_members")
      .select("project_id, role, users (id, name, email, initials, color)")
      .in("project_id", projectIds)
      .then((result) => unwrap(result) as Array<{ project_id: string; role: string; users: UserRow | UserRow[] | null }>),
    supabase
      .from("tasks")
      .select("project_id, status")
      .in("project_id", projectIds)
      .then((result) => unwrap(result) as Array<{ project_id: string; status: string }>),
    supabase
      .from("sprints")
      .select("project_id, name")
      .in("project_id", projectIds)
      .eq("status", "active")
      .then((result) => unwrap(result) as Array<{ project_id: string; name: string }>),
  ]);

  const groupIdsForNames = [
    ...new Set(projects.map((project) => project.group_id).filter((id): id is string => Boolean(id))),
  ];
  const groupNameById = new Map<string, string>();
  if (groupIdsForNames.length) {
    try {
      const groupRows = unwrap(
        await supabase.from("groups").select("id, name").in("id", groupIdsForNames),
      ) as Array<{ id: string; name: string }>;
      for (const row of groupRows) groupNameById.set(row.id, row.name);
    } catch (error) {
      if (!isMissingAccessSchema(error)) throw error;
    }
  }

  const membershipByProject = new Map(memberships.map((item) => [item.project_id, item.role]));
  const order = new Map(projectIds.map((id, index) => [id, index]));

  return [...projects]
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((project) => {
      const members = allMembers
        .filter((item) => item.project_id === project.id)
        .flatMap((item) => {
          const user = asUser(item.users);
          return user ? [memberFromRow(user, item.role)] : [];
        });
      const projectTasks = taskRows.filter((task) => task.project_id === project.id);
      const access: ProjectAccess = parseProjectAccess(project.access);
      const role =
        membershipByProject.get(project.id) ?? (project.owner_id === userId ? "owner" : "member");
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        shareCode: project.share_code,
        role,
        access,
        groupName: project.group_id ? (groupNameById.get(project.group_id) ?? null) : null,
        taskCount: projectTasks.length,
        doneCount: projectTasks.filter((task) => task.status === "done").length,
        memberCount: members.length,
        ownerName: members.find((member) => member.role === "owner")?.name ?? null,
        activeSprint: activeSprints.find((sprint) => sprint.project_id === project.id)?.name ?? null,
        members,
      };
    });
}

export const getProjectShell = cache(async (projectId: string, userId: string) => {
  const membership = await ensureProjectAccess(projectId, userId);
  if (!membership) return null;
  const project = unwrap(
    await supabase.from("projects").select("id, name, color").eq("id", projectId).maybeSingle(),
  ) as { id: string; name: string; color: string } | null;
  if (!project) return null;
  return { project, role: membership.role };
});

export const getProjectWorkspace = cache(async (projectId: string, userId: string): Promise<ProjectWorkspace | null> => {
  const ensured = await ensureProjectAccess(projectId, userId);
  if (!ensured) return null;

  const [project, memberRows] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle()
      .then(
        (result) =>
          unwrap(result) as {
            id: string;
            name: string;
            description: string;
            color: string;
            share_code: string;
            owner_id: string;
            access?: string | null;
            group_id?: string | null;
          } | null,
      ),
    supabase
      .from("project_members")
      .select("role, user_id, source, joined_at, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true })
      .then(async (result) => {
        if (result.error && isMissingAccessSchema(result.error)) {
          return unwrap(
            await supabase
              .from("project_members")
              .select("role, user_id, joined_at, users (id, name, email, initials, color)")
              .eq("project_id", projectId)
              .order("joined_at", { ascending: true }),
          ) as Array<{
            role: string;
            user_id: string;
            source?: string | null;
            users: UserRow | UserRow[] | null;
          }>;
        }
        return unwrap(result) as Array<{
          role: string;
          user_id: string;
          source?: string | null;
          users: UserRow | UserRow[] | null;
        }>;
      }),
  ]);
  if (!project) return null;
  const membership = memberRows.find((item) => item.user_id === userId) ?? ensured;

  const [sprintRows, tasks, dailyRows, activityRows, todayRows, groupRow, groupMembers] = await Promise.all([
    supabase
      .from("sprints")
      .select("*")
      .eq("project_id", projectId)
      .order("start_date", { ascending: false })
      .then(
        (result) =>
          unwrap(result) as Array<{
            id: string;
            name: string;
            goal: string;
            start_date: string;
            end_date: string;
            status: string;
          }>,
      ),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("rank", { ascending: true })
      .then((result) => unwrap(result) as TaskRow[]),
    supabase
      .from("daily_logs")
      .select("*, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("date", { ascending: false })
      .then(
        (result) =>
          unwrap(result) as Array<{
            id: string;
            date: string;
            yesterday: string;
            today: string;
            blockers: string;
            updated_at: string;
            users: UserRow | UserRow[] | null;
          }>,
      ),
    supabase
      .from("activities")
      .select("*, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(
        (result) =>
          unwrap(result) as Array<{
            id: string;
            message: string;
            created_at: string;
            users: UserRow | UserRow[] | null;
          }>,
      ),
    supabase
      .from("daily_logs")
      .select("id")
      .eq("project_id", projectId)
      .eq("date", todayKey())
      .then((result) => unwrap(result) as Array<{ id: string }>),
    project.group_id
      ? supabase
          .from("groups")
          .select("name")
          .eq("id", project.group_id)
          .maybeSingle()
          .then((result) => {
            if (result.error && isMissingAccessSchema(result.error)) return null;
            return unwrap(result) as { name: string } | null;
          })
      : Promise.resolve(null),
    project.group_id
      ? listGroupMembers(project.group_id).catch((error) => {
          if (isMissingAccessSchema(error)) return [];
          throw error;
        })
      : Promise.resolve([]),
  ]);

  const taskIds = tasks.map((task) => task.id);
  const [commentRows, attachmentRows] = await Promise.all([
    taskIds.length
      ? supabase
          .from("comments")
          .select("task_id")
          .in("task_id", taskIds)
          .then((result) => unwrap(result) as Array<{ task_id: string }>)
      : Promise.resolve([] as Array<{ task_id: string }>),
    taskIds.length
      ? supabase
          .from("attachments")
          .select("task_id")
          .in("task_id", taskIds)
          .then((result) => unwrap(result) as Array<{ task_id: string }>)
      : Promise.resolve([] as Array<{ task_id: string }>),
  ]);

  const commentCount = new Map<string, number>();
  const attachmentCount = new Map<string, number>();
  for (const row of commentRows) commentCount.set(row.task_id, (commentCount.get(row.task_id) ?? 0) + 1);
  for (const row of attachmentRows) attachmentCount.set(row.task_id, (attachmentCount.get(row.task_id) ?? 0) + 1);

  const members = memberRows.flatMap((item) => {
    const user = asUser(item.users);
    return user ? [memberFromRow(user, item.role)] : [];
  });
  const usersById = new Map(members.map((member) => [member.id, member]));
  const access = parseProjectAccess(project.access);
  const groupName = groupRow?.name ?? null;

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      shareCode: project.share_code,
      ownerId: project.owner_id,
      access,
      groupId: project.group_id ?? null,
      groupName,
    },
    role: membership.role,
    membershipSource: membership.source ?? "invite",
    members,
    sprints: sprintRows.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      startDate: iso(sprint.start_date) ?? sprint.start_date,
      endDate: iso(sprint.end_date) ?? sprint.end_date,
      status: sprint.status,
      taskCount: tasks.filter((task) => task.sprint_id === sprint.id).length,
      doneCount: tasks.filter((task) => task.sprint_id === sprint.id && task.status === "done").length,
    })),
    tasks: tasks.map((task) => {
      const assignee = usersById.get(task.assignee_id ?? "");
      return mapTask(task, {
        assignee: assignee
          ? {
              id: assignee.id,
              name: assignee.name,
              email: assignee.email,
              initials: assignee.initials,
              color: assignee.color,
            }
          : null,
        sprintName: sprintRows.find((sprint) => sprint.id === task.sprint_id)?.name ?? null,
        commentCount: commentCount.get(task.id) ?? 0,
        attachmentCount: attachmentCount.get(task.id) ?? 0,
      });
    }),
    dailyLogs: dailyRows.map((log) => {
      const user = asUser(log.users);
      return {
        id: log.id,
        date: log.date,
        yesterday: log.yesterday,
        today: log.today,
        blockers: log.blockers,
        user: user
          ? memberFromUser(mapUser(user))
          : memberFromUser({ id: "", name: "Unknown", email: "", initials: "?", color: "#888" }),
        updatedAt: iso(log.updated_at) ?? log.updated_at,
      };
    }),
    activities: activityRows.map((item) => {
      const user = asUser(item.users);
      return {
        id: item.id,
        message: item.message,
        createdAt: iso(item.created_at) ?? item.created_at,
        user: user
          ? memberFromUser(mapUser(user))
          : memberFromUser({ id: "", name: "Unknown", email: "", initials: "?", color: "#888" }),
      };
    }),
    todayCheckins: todayRows.length,
    groupMembers,
  };
});

export async function getTaskDetail(taskId: string, userId: string): Promise<TaskDetailDTO | null> {
  const task = unwrap(
    await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle(),
  ) as TaskRow | null;
  if (!task) return null;
  if (!(await isProjectMember(task.project_id, userId))) return null;

  const [assignee, sprint, comments, attachments] = await Promise.all([
    task.assignee_id
      ? unwrap(await supabase.from("users").select("*").eq("id", task.assignee_id).maybeSingle())
      : Promise.resolve(null),
    task.sprint_id
      ? unwrap(await supabase.from("sprints").select("id, name").eq("id", task.sprint_id).maybeSingle())
      : Promise.resolve(null),
    unwrap(
      await supabase
        .from("comments")
        .select("*, users (id, name, email, initials, color)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),
    ),
    unwrap(
      await supabase
        .from("attachments")
        .select("*, users (id, name, email, initials, color)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
    ),
  ]);

  const mapped = mapTask(task, {
    assignee: assignee as UserRow | null,
    sprintName: (sprint as { name: string } | null)?.name ?? null,
    commentCount: (comments as unknown[]).length,
    attachmentCount: (attachments as unknown[]).length,
  });

  return {
    ...mapped,
    comments: (
      comments as Array<{ id: string; body: string; created_at: string; users: UserRow | UserRow[] | null }>
    ).map((comment) => {
      const user = asUser(comment.users);
      return {
        id: comment.id,
        body: comment.body,
        createdAt: iso(comment.created_at) ?? comment.created_at,
        user: user
          ? memberFromUser(mapUser(user))
          : memberFromUser({ id: "", name: "Unknown", email: "", initials: "?", color: "#888" }),
      };
    }),
    attachments: (
      attachments as Array<{
        id: string;
        filename: string;
        mime_type: string;
        size: number;
        created_at: string;
        users: UserRow | UserRow[] | null;
      }>
    ).map((file) => {
      const user = asUser(file.users);
      return {
        id: file.id,
        filename: file.filename,
        mimeType: file.mime_type,
        size: file.size,
        createdAt: iso(file.created_at) ?? file.created_at,
        user: user
          ? memberFromUser(mapUser(user))
          : memberFromUser({ id: "", name: "Unknown", email: "", initials: "?", color: "#888" }),
      };
    }),
  };
}
