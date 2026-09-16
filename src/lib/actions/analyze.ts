"use server";

import { requireProjectMember } from "@/lib/auth";
import { isMissingAnalysisSchema } from "@/lib/access";
import { chatCompletion } from "@/lib/ai";
import { getProjectWorkspace } from "@/lib/queries";
import { supabase, unwrap } from "@/lib/supabase";
import { dateKeyJakarta } from "@/lib/utils";
import { iso, type ProjectAnalysis, type ProjectWorkspace } from "@/lib/types";
import { revalidatePath } from "next/cache";

function mapRow(row: { content: string; model: string; updated_at: string }): ProjectAnalysis {
  return {
    content: row.content,
    model: row.model,
    updatedAt: iso(row.updated_at) ?? row.updated_at,
  };
}

export async function loadProjectAnalysis(projectId: string): Promise<ProjectAnalysis | null> {
  await requireProjectMember(projectId);
  try {
    const row = unwrap(
      await supabase
        .from("project_analyses")
        .select("content, model, updated_at")
        .eq("project_id", projectId)
        .maybeSingle(),
    ) as { content: string; model: string; updated_at: string } | null;
    return row ? mapRow(row) : null;
  } catch (error) {
    if (isMissingAnalysisSchema(error)) return null;
    throw error;
  }
}

function clip(value: string, max = 180) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function buildSnapshot(workspace: ProjectWorkspace) {
  const today = dateKeyJakarta(new Date());
  const open = workspace.tasks.filter((task) => task.status !== "done");
  const done = workspace.tasks.filter((task) => task.status === "done");
  const overdue = open.filter((task) => task.dueDate && dateKeyJakarta(task.dueDate) < today);
  const byStatus = workspace.tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});
  const byPriority = open.reduce<Record<string, number>>((acc, task) => {
    acc[task.priority] = (acc[task.priority] ?? 0) + 1;
    return acc;
  }, {});

  const taskLines = open.slice(0, 60).map((task) => {
    const start = task.startDate ? dateKeyJakarta(task.startDate) : "no start";
    const due = task.dueDate ? dateKeyJakarta(task.dueDate) : "no due";
    const people = task.assignees.map((person) => person.name).join(", ") || "unassigned";
    return `- [${task.status}/${task.priority}/${task.type}] ${clip(task.title)} | ${people} | start ${start} | due ${due}${task.sprintName ? ` | ${task.sprintName}` : ""}`;
  });

  const sprintLines = workspace.sprints.slice(0, 8).map((sprint) => {
    return `- ${sprint.name} (${sprint.status}) ${sprint.doneCount}/${sprint.taskCount} done | ${clip(sprint.goal || "no goal", 120)}`;
  });

  const dailyLines = workspace.dailyLogs.slice(0, 8).map((log) => {
    const blockers = log.blockers.trim() ? ` blockers: ${clip(log.blockers, 140)}` : "";
    return `- ${log.date} ${log.user.name}: today ${clip(log.today || "-", 120)}${blockers}`;
  });

  return [
    `Project: ${workspace.project.name}`,
    workspace.project.description ? `Description: ${clip(workspace.project.description, 400)}` : null,
    `Members: ${workspace.members.length}. Daily check-ins today: ${workspace.todayCheckins}.`,
    `Tasks: ${workspace.tasks.length} total, ${open.length} open, ${done.length} done, ${overdue.length} overdue.`,
    `Open by status: ${JSON.stringify(byStatus)}`,
    `Open by priority: ${JSON.stringify(byPriority)}`,
    sprintLines.length ? `Sprints:\n${sprintLines.join("\n")}` : "Sprints: none",
    taskLines.length ? `Open tasks:\n${taskLines.join("\n")}` : "Open tasks: none",
    dailyLines.length ? `Recent daily checks:\n${dailyLines.join("\n")}` : "Recent daily checks: none",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function generateProjectAnalysis(projectId: string): Promise<ProjectAnalysis> {
  const { user } = await requireProjectMember(projectId);
  const workspace = await getProjectWorkspace(projectId, user.id);
  if (!workspace) throw new Error("Project not found.");

  const snapshot = buildSnapshot(workspace);
  const today = dateKeyJakarta(new Date());
  const { content, model } = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a project delivery coach. Analyze one software project board. Be specific to the tasks given. Do not invent tasks or people. Write in the same language as most task titles (Indonesian or English). Reply with JSON only, no markdown fences, using this shape: {\"health\":\"2-4 sentences\",\"risks\":[\"...\"],\"blockers\":[\"...\"],\"next7days\":[\"concrete actions\"],\"work\":[{\"title\":\"exact open task title\",\"owner\":\"assignee or Unassigned\",\"status\":\"backlog|todo|in_progress|review\",\"priority\":\"low|medium|high|urgent\",\"start\":\"YYYY-MM-DD or null\",\"end\":\"YYYY-MM-DD or null\",\"action\":\"what to do next\"}]}. Include the important open tasks in work (max 20), overdue and high priority first. Use snapshot start/due dates when present. If a task has no dates, suggest start and end within the next 14 days from " +
          today +
          " based on priority and order. Do not invent new task titles. Put the full JSON in message content, not reasoning.",
      },
      {
        role: "user",
        content: `Analyze this project snapshot:\n\n${snapshot}`,
      },
    ],
    { maxTokens: 3072 },
  );

  try {
    unwrap(
      await supabase.from("project_analyses").upsert(
        {
          project_id: projectId,
          content,
          model,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      ),
    );
  } catch (error) {
    if (!isMissingAnalysisSchema(error)) throw error;
    throw new Error("Run supabase/migration_project_analyses.sql in the SQL Editor first.");
  }

  revalidatePath(`/projects/${projectId}/analyze`);
  return {
    content,
    model,
    updatedAt: new Date().toISOString(),
  };
}
