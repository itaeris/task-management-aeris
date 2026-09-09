import { cookies } from "next/headers";
import { supabase, unwrap } from "@/lib/supabase";
import { mapUser, type UserRow } from "@/lib/mappers";
import { cookieOptions } from "@/lib/site";

export const USER_COOKIE = "nara_user";

export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(USER_COOKIE)?.value;
  if (!userId) return null;
  const row = unwrap(
    await supabase.from("users").select("*").eq("id", userId).maybeSingle(),
  ) as UserRow | null;
  return row ? mapUser(row) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("You are not signed in. Please log in first.");
  return user;
}

export async function requireProjectMember(projectId: string) {
  const user = await requireUser();
  const membership = unwrap(
    await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ) as { id: string; role: string } | null;
  if (!membership) throw new Error("You are not a member of this project.");

  const project = unwrap(
    await supabase.from("projects").select("*").eq("id", projectId).single(),
  ) as { id: string; name: string };
  return { user, membership, project };
}

export async function setUserCookie(userId: string) {
  const store = await cookies();
  store.set(USER_COOKIE, userId, cookieOptions(60 * 60 * 24 * 365));
}

export async function clearUserCookie() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
