import { supabase, unwrap } from "@/lib/supabase";
import { iso, memberFromUser, type TaskDetailDTO } from "@/lib/types";
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
  const membership = unwrap(
    await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  return Boolean(membership);
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

  if (memberships.length === 0) return [];
  const projectIds = memberships.map((item) => item.project_id);

  const projects = unwrap(
    await supabase.from("projects").select("*").in("id", projectIds),
  ) as Array<{ id: string; name: string; description: string; color: string; share_code: string }>;

  const allMembers = unwrap(
    await supabase
      .from("project_members")
      .select("project_id, role, users (id, name, email, initials, color)")
      .in("project_id", projectIds),
  ) as Array<{ project_id: string; role: string; users: UserRow | UserRow[] | null }>;

  const taskRows = unwrap(
    await supabase.from("tasks").select("project_id, status").in("project_id", projectIds),
  ) as Array<{ project_id: string; status: string }>;

  const activeSprints = unwrap(
    await supabase
      .from("sprints")
      .select("project_id, name")
      .in("project_id", projectIds)
      .eq("status", "active"),
  ) as Array<{ project_id: string; name: string }>;

  return memberships.flatMap((membership) => {
    const project = projects.find((item) => item.id === membership.project_id);
    if (!project) return [];
    const members = allMembers
      .filter((item) => item.project_id === project.id)
      .flatMap((item) => {
        const user = asUser(item.users);
        return user ? [memberFromRow(user, item.role)] : [];
      });
    const projectTasks = taskRows.filter((task) => task.project_id === project.id);
    return [
      {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        shareCode: project.share_code,
        role: membership.role,
        taskCount: projectTasks.length,
        doneCount: projectTasks.filter((task) => task.status === "done").length,
        memberCount: members.length,
        ownerName: members.find((member) => member.role === "owner")?.name ?? null,
        activeSprint: activeSprints.find((sprint) => sprint.project_id === project.id)?.name ?? null,
        members,
      },
    ];
  });
}

export async function getProjectWorkspace(projectId: string, userId: string) {
  const project = unwrap(
    await supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
  ) as {
    id: string;
    name: string;
    description: string;
    color: string;
    share_code: string;
    owner_id: string;
  } | null;
  if (!project) return null;

  const memberRows = unwrap(
    await supabase
      .from("project_members")
      .select("role, user_id, joined_at, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true }),
  ) as Array<{ role: string; user_id: string; users: UserRow | UserRow[] | null }>;

  const membership = memberRows.find((item) => item.user_id === userId);
  if (!membership) return null;

  const members = memberRows.flatMap((item) => {
    const user = asUser(item.users);
    return user ? [memberFromRow(user, item.role)] : [];
  });

  const sprintRows = unwrap(
    await supabase.from("sprints").select("*").eq("project_id", projectId).order("start_date", { ascending: false }),
  ) as Array<{
    id: string;
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    status: string;
  }>;

  const tasks = unwrap(
    await supabase.from("tasks").select("*").eq("project_id", projectId).order("rank", { ascending: true }),
  ) as TaskRow[];

  const dailyRows = unwrap(
    await supabase
      .from("daily_logs")
      .select("*, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("date", { ascending: false }),
  ) as Array<{
    id: string;
    date: string;
    yesterday: string;
    today: string;
    blockers: string;
    updated_at: string;
    users: UserRow | UserRow[] | null;
  }>;

  const activityRows = unwrap(
    await supabase
      .from("activities")
      .select("*, users (id, name, email, initials, color)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),
  ) as Array<{
    id: string;
    message: string;
    created_at: string;
    users: UserRow | UserRow[] | null;
  }>;

  const todayRows = unwrap(
    await supabase.from("daily_logs").select("id").eq("project_id", projectId).eq("date", todayKey()),
  ) as Array<{ id: string }>;

  const taskIds = tasks.map((task) => task.id);
  const commentRows = taskIds.length
    ? (unwrap(await supabase.from("comments").select("task_id").in("task_id", taskIds)) as Array<{ task_id: string }>)
    : [];
  const attachmentRows = taskIds.length
    ? (unwrap(await supabase.from("attachments").select("task_id").in("task_id", taskIds)) as Array<{
        task_id: string;
      }>)
    : [];

  const commentCount = new Map<string, number>();
  const attachmentCount = new Map<string, number>();
  for (const row of commentRows) commentCount.set(row.task_id, (commentCount.get(row.task_id) ?? 0) + 1);
  for (const row of attachmentRows) attachmentCount.set(row.task_id, (attachmentCount.get(row.task_id) ?? 0) + 1);

  const usersById = new Map(members.map((member) => [member.id, member]));

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      shareCode: project.share_code,
      ownerId: project.owner_id,
    },
    role: membership.role,
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
  };
}

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
