"use server";

import { revalidateProject } from "@/lib/revalidate";
import { db, unwrap } from "@/lib/db";
import { requireProjectMember } from "@/lib/auth";
import { todayKey } from "@/lib/utils";

export async function saveDailyLog(projectId: string, formData: FormData) {
  const { user } = await requireProjectMember(projectId);
  const date = String(formData.get("date") ?? todayKey());
  unwrap(
    await db.from("daily_logs").upsert(
      {
        project_id: projectId,
        user_id: user.id,
        date,
        yesterday: String(formData.get("yesterday") ?? ""),
        today: String(formData.get("today") ?? ""),
        blockers: String(formData.get("blockers") ?? ""),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,user_id,date" },
    ),
  );
  unwrap(
    await db.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `mengisi daily check ${date}`,
    }),
  );
  await revalidateProject(projectId);
}
