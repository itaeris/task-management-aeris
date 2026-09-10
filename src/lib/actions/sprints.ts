"use server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";
import { revalidateProject } from "@/lib/revalidate";

function refresh(projectId: string) {
  revalidateProject(projectId);
}

export async function createSprint(projectId: string, formData: FormData) {
  const { user } = await requireProjectMember(projectId);
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const startDate = parseDateInput(formData.get("startDate"));
  const endDate = parseDateInput(formData.get("endDate"));
  if (!name || !startDate || !endDate) {
    throw new Error("Sprint name, start date, and end date are required.");
  }

  unwrap(
    await supabase.from("sprints").insert({
      project_id: projectId,
      name,
      goal,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "planning",
    }),
  );
  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `created sprint ${name}`,
    }),
  );
  refresh(projectId);
}

export async function updateSprint(projectId: string, sprintId: string, formData: FormData) {
  const { user } = await requireProjectMember(projectId);
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const startDate = parseDateInput(formData.get("startDate"));
  const endDate = parseDateInput(formData.get("endDate"));
  if (!name || !startDate || !endDate) {
    throw new Error("Sprint name, start date, and end date are required.");
  }
  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  unwrap(
    await supabase
      .from("sprints")
      .update({
        name,
        goal,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })
      .eq("id", sprintId)
      .eq("project_id", projectId),
  );
  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `updated sprint ${name}`,
    }),
  );
  refresh(projectId);
}

export async function deleteSprint(projectId: string, sprintId: string) {
  const { user } = await requireProjectMember(projectId);
  const sprint = unwrap(
    await supabase
      .from("sprints")
      .select("name")
      .eq("id", sprintId)
      .eq("project_id", projectId)
      .single(),
  ) as { name: string };
  unwrap(await supabase.from("sprints").delete().eq("id", sprintId).eq("project_id", projectId));
  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `deleted sprint ${sprint.name}`,
    }),
  );
  refresh(projectId);
}

export async function updateSprintStatus(projectId: string, sprintId: string, status: string) {
  const { user } = await requireProjectMember(projectId);
  if (status === "active") {
    unwrap(
      await supabase.from("sprints").update({ status: "completed" }).eq("project_id", projectId).eq("status", "active"),
    );
  }
  const sprint = unwrap(
    await supabase.from("sprints").update({ status }).eq("id", sprintId).select("name").single(),
  ) as { name: string };
  unwrap(
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `changed ${sprint.name} to ${status}`,
    }),
  );
  refresh(projectId);
}
