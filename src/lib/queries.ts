import { cache } from "react";
import { isMissingAccessSchema, isMissingAssigneesSchema, isMissingPinsSchema, parseProjectAccess, type ProjectAccess } from "@/lib/access";
import { ensureProjectAccess } from "@/lib/project-access";
import { supabase, unwrap } from "@/lib/supabase";
import { iso, memberFromUser, type ProjectSwitcherItem, type ProjectWorkspace, type TaskDetailDTO } from "@/lib/types";
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
    await supabase
      .from("users")
      .select("id, name, email, initials, color, username, role")
      .order("created_at", { ascending: true }),
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
    const [groups, countRows] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name")
        .in("id", ids)
        .then((result) => unwrap(result) as Array<{ id: string; name: string }>),
      supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", ids)
        .then((result) => unwrap(result) as Array<{ group_id: string }>),
    ]);
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

async function loadSharedProjectIds(userId: string) {
  try {
    const [groupRows, orgResult] = await Promise.all([
      supabase.from("group_members").select("group_id").eq("user_id", userId),
      supabase.from("projects").select("id").eq("access", "organization"),
    ]);
    const groupIds = [
      ...new Set((unwrap(groupRows) as Array<{ group_id: string }>).map((row) => row.group_id)),
    ];
    const groupResult = groupIds.length
      ? await supabase.from("projects").select("id").eq("access", "group").in("group_id", groupIds)
      : { data: [] as Array<{ id: string }>, error: null };
    return [
      ...((unwrap(orgResult) as Array<{ id: string }>).map((row) => row.id)),
      ...((unwrap(groupResult) as Array<{ id: string }>).map((row) => row.id)),
    ];
  } catch (error) {
    if (!isMissingAccessSchema(error)) throw error;
    return [] as string[];
  }
}

let pinsTableReady: boolean | null = null;
let assigneesTableReady: boolean | null = null;

async function loadPinnedProjectIds(userId: string) {
  if (pinsTableReady === false) return [] as Array<{ project_id: string }>;
  const result = await supabase.from("project_pins").select("project_id").eq("user_id", userId);
  if (result.error && isMissingPinsSchema(result.error)) {
    pinsTableReady = false;
    return [] as Array<{ project_id: string }>;
  }
  pinsTableReady = true;
  return unwrap(result) as Array<{ project_id: string }>;
}

async function loadTaskAssigneeRows(taskIds: string[]) {
  if (taskIds.length === 0 || assigneesTableReady === false) return [] as Array<{ task_id: string; user_id: string }>;
  const result = await supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds);
  if (result.error && isMissingAssigneesSchema(result.error)) {
    assigneesTableReady = false;
    return [] as Array<{ task_id: string; user_id: string }>;
  }
  assigneesTableReady = true;
  return unwrap(result) as Array<{ task_id: string; user_id: string }>;
}

export async function listProjectsForUser(userId: string) {
  const [memberships, extraIds] = await Promise.all([
    supabase
      .from("project_members")
      .select("role, joined_at, project_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .then((result) => unwrap(result) as Array<{ role: string; project_id: string }>),
    loadSharedProjectIds(userId),
  ]);

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

  const [projects, memberRows, taskRows, pinRows] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, color, share_code, owner_id, access, group_id")
      .in("id", projectIds)
      .then((result) => unwrap(result) as ProjectListRow[]),
    supabase
      .from("project_members")
      .select("project_id, role, user_id")
      .in("project_id", projectIds)
      .then((result) => unwrap(result) as Array<{ project_id: string; role: string; user_id: string }>),
    supabase
      .from("tasks")
      .select("project_id, status")
      .in("project_id", projectIds)
      .then((result) => unwrap(result) as Array<{ project_id: string; status: string }>),
    loadPinnedProjectIds(userId),
  ]);

  const pinnedIds = new Set(pinRows.map((row) => row.project_id));
  const memberCountByProject = new Map<string, number>();
  const ownerIdByProject = new Map<string, string>();
  const avatarIdsByProject = new Map<string, string[]>();
  const avatarUserIds = new Set<string>();
  for (const row of memberRows) {
    memberCountByProject.set(row.project_id, (memberCountByProject.get(row.project_id) ?? 0) + 1);
    if (row.role === "owner") ownerIdByProject.set(row.project_id, row.user_id);
    const avatars = avatarIdsByProject.get(row.project_id) ?? [];
    if (avatars.length < 5) {
      avatars.push(row.user_id);
      avatarUserIds.add(row.user_id);
      avatarIdsByProject.set(row.project_id, avatars);
    }
  }
  for (const project of projects) {
    if (project.owner_id) avatarUserIds.add(project.owner_id);
  }

  const groupIdsForNames = [
    ...new Set(projects.map((project) => project.group_id).filter((id): id is string => Boolean(id))),
  ];

  const [userRows, groupRows] = await Promise.all([
    avatarUserIds.size
      ? supabase
          .from("users")
          .select("id, name, initials, color")
          .in("id", [...avatarUserIds])
          .then(
            (result) =>
              unwrap(result) as Array<{ id: string; name: string; initials: string; color: string }>,
          )
      : Promise.resolve([] as Array<{ id: string; name: string; initials: string; color: string }>),
    groupIdsForNames.length
      ? supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIdsForNames)
          .then((result) => {
            if (result.error && isMissingAccessSchema(result.error)) {
              return [] as Array<{ id: string; name: string }>;
            }
            return unwrap(result) as Array<{ id: string; name: string }>;
          })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
  ]);

  const userById = new Map(userRows.map((user) => [user.id, user]));
  const groupNameById = new Map(groupRows.map((group) => [group.id, group.name]));
  const membershipByProject = new Map(memberships.map((item) => [item.project_id, item.role]));
  const order = new Map(projectIds.map((id, index) => [id, index]));
  const taskCountByProject = new Map<string, { total: number; done: number }>();
  for (const task of taskRows) {
    const current = taskCountByProject.get(task.project_id) ?? { total: 0, done: 0 };
    current.total += 1;
    if (task.status === "done") current.done += 1;
    taskCountByProject.set(task.project_id, current);
  }

  return [...projects]
    .sort((a, b) => {
      const pinnedA = pinnedIds.has(a.id) && parseProjectAccess(a.access) === "organization";
      const pinnedB = pinnedIds.has(b.id) && parseProjectAccess(b.access) === "organization";
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    })
    .map((project) => {
      const access: ProjectAccess = parseProjectAccess(project.access);
      const role =
        membershipByProject.get(project.id) ?? (project.owner_id === userId ? "owner" : "member");
      const counts = taskCountByProject.get(project.id) ?? { total: 0, done: 0 };
      const ownerId = ownerIdByProject.get(project.id) ?? project.owner_id;
      const members = (avatarIdsByProject.get(project.id) ?? [])
        .map((id) => userById.get(id))
        .filter((user): user is { id: string; name: string; initials: string; color: string } => Boolean(user));
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        shareCode: project.share_code,
        role,
        access,
        pinned: access === "organization" && pinnedIds.has(project.id),
        groupName: project.group_id ? (groupNameById.get(project.group_id) ?? null) : null,
        taskCount: counts.total,
        doneCount: counts.done,
        memberCount: memberCountByProject.get(project.id) ?? members.length,
        ownerName: userById.get(ownerId)?.name ?? null,
        activeSprint: null,
        members,
      };
    });
}

export async function listProjectSwitcherForUser(userId: string): Promise<ProjectSwitcherItem[]> {
  const [memberships, extraIds] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, joined_at")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .then((result) => unwrap(result) as Array<{ project_id: string }>),
    loadSharedProjectIds(userId),
  ]);

  const seen = new Set<string>();
  const projectIds: string[] = [];
  for (const id of [...memberships.map((item) => item.project_id), ...extraIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    projectIds.push(id);
  }
  if (projectIds.length === 0) return [];

  const [projects, pinRows] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, color, access")
      .in("id", projectIds)
      .then(
        (result) =>
          unwrap(result) as Array<{ id: string; name: string; color: string; access?: string | null }>,
      ),
    loadPinnedProjectIds(userId),
  ]);

  const pinnedIds = new Set(pinRows.map((row) => row.project_id));
  const order = new Map(projectIds.map((id, index) => [id, index]));
  return [...projects]
    .sort((a, b) => {
      const pinnedA = pinnedIds.has(a.id) && parseProjectAccess(a.access) === "organization";
      const pinnedB = pinnedIds.has(b.id) && parseProjectAccess(b.access) === "organization";
      if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    })
    .map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      pinned: parseProjectAccess(project.access) === "organization" && pinnedIds.has(project.id),
    }));
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

  const [sprintRows, tasks, dailyRows, activityRows, groupRow, groupMembers] = await Promise.all([
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
      .select("id, message, created_at, users (id, name, email, initials, color)")
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
  const [commentRows, attachmentRows, assigneeRows] = await Promise.all([
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
    loadTaskAssigneeRows(taskIds),
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
  const assigneeIdsByTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const current = assigneeIdsByTask.get(row.task_id) ?? [];
    current.push(row.user_id);
    assigneeIdsByTask.set(row.task_id, current);
  }
  const missingUserIds = [
    ...new Set(
      [
        ...assigneeRows.map((row) => row.user_id),
        ...tasks.flatMap((task) => (task.assignee_id ? [task.assignee_id] : [])),
      ].filter((id) => !usersById.has(id)),
    ),
  ];
  if (missingUserIds.length) {
    const extraUsers = unwrap(
      await supabase.from("users").select("id, name, email, initials, color").in("id", missingUserIds),
    ) as Array<{ id: string; name: string; email: string; initials: string; color: string }>;
    for (const user of extraUsers) usersById.set(user.id, memberFromUser(mapUser(user)));
  }
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
      const assigneeIds = assigneeIdsByTask.get(task.id);
      const ids = assigneeIds?.length ? assigneeIds : task.assignee_id ? [task.assignee_id] : [];
      const assignees = ids
        .map((id) => usersById.get(id))
        .filter((user): user is NonNullable<typeof user> => Boolean(user))
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          initials: user.initials,
          color: user.color,
        }));
      return mapTask(task, {
        assignees,
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
    todayCheckins: dailyRows.filter((log) => log.date === todayKey()).length,
    groupMembers,
  };
});

export async function getTaskDetail(taskId: string, userId: string): Promise<TaskDetailDTO | null> {
  const task = unwrap(
    await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle(),
  ) as TaskRow | null;
  if (!task) return null;
  if (!(await isProjectMember(task.project_id, userId))) return null;

  const [assigneeRows, sprint, comments, attachments] = await Promise.all([
    loadTaskAssigneeRows([taskId]),
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

  const assigneeIds = [
    ...new Set(
      (assigneeRows.length ? assigneeRows.map((row) => row.user_id) : task.assignee_id ? [task.assignee_id] : []).filter(
        Boolean,
      ),
    ),
  ];
  const assigneeUsers = assigneeIds.length
    ? ((unwrap(
        await supabase.from("users").select("*").in("id", assigneeIds),
      ) as UserRow[]) ?? [])
    : [];
  const assigneeById = new Map(assigneeUsers.map((user) => [user.id, user]));
  const assignees = assigneeIds
    .map((id) => assigneeById.get(id))
    .filter((user): user is UserRow => Boolean(user));

  const mapped = mapTask(task, {
    assignees,
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
