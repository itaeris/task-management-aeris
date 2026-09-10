"use server";

import { revalidateProject } from "@/lib/revalidate";
import { requireProjectMember } from "@/lib/auth";
import { disconnectCalendar, isMissingCalendarTable, syncProjectToGoogleCalendar } from "@/lib/google-calendar";

export type CalendarActionState = {
  error?: string;
  success?: string;
};

export async function disconnectGoogleCalendar(
  _prev: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "Project not found." };
  try {
    const { user } = await requireProjectMember(projectId);
    await disconnectCalendar(user.id);
    revalidateProject(projectId);
    return { success: "Google Calendar disconnected." };
  } catch (error) {
    if (isMissingCalendarTable(error)) {
      return { error: "Google Calendar tables are missing. Run the Supabase migration first." };
    }
    return { error: error instanceof Error ? error.message : "Could not disconnect Google Calendar." };
  }
}

export async function syncGoogleCalendar(
  _prev: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "Project not found." };
  try {
    const { user } = await requireProjectMember(projectId);
    const count = await syncProjectToGoogleCalendar(user.id, projectId);
    revalidateProject(projectId);
    return { success: `${count} ${count === 1 ? "task" : "tasks"} synced to Google Calendar.` };
  } catch (error) {
    if (isMissingCalendarTable(error)) {
      return { error: "Google Calendar tables are missing. Run the Supabase migration first." };
    }
    return { error: error instanceof Error ? error.message : "Could not sync to Google Calendar." };
  }
}
