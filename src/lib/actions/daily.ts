"use server";

import { revalidateProject } from "@/lib/revalidate";
import { supabase, unwrap } from "@/lib/supabase";
import { requireProjectMember } from "@/lib/auth";
import { todayKey } from "@/lib/utils";

export async function saveDailyLog(projectId: string, formData: FormData) {
  const { user } = await requireProjectMember(projectId);
  const date = String(formData.get("date") ?? todayKey());
  unwrap(
    await supabase.from("daily_logs").upsert(
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
    await supabase.from("activities").insert({
      project_id: projectId,
      user_id: user.id,
      message: `mengisi daily check ${date}`,
    }),
  );
  revalidateProject(projectId);
}
