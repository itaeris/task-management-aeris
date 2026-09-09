"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, unwrap } from "@/lib/supabase";
import { clearUserCookie, requireUser, safeNextPath, setUserCookie } from "@/lib/auth";
import type { UserRow } from "@/lib/mappers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { initialsFromName } from "@/lib/utils";
import { clearPresence } from "@/lib/actions/presence";

export type LoginState = {
  error?: string;
};

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/settings");
}

function isMissingAuthColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /password_hash|username|column/i.test(message);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));

  if (!identifier || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const byEmail = unwrap(
      await supabase.from("users").select("*").eq("email", identifier).maybeSingle(),
    ) as (UserRow & { password_hash?: string | null; username?: string | null }) | null;

    const user =
      byEmail ??
      ((unwrap(
        await supabase.from("users").select("*").eq("username", identifier).maybeSingle(),
      ) as (UserRow & { password_hash?: string | null; username?: string | null }) | null) ??
        null);

    if (!user?.password_hash) {
      return { error: "Wrong email or password." };
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return { error: "Wrong email or password." };

    await setUserCookie(user.id);
    revalidateApp();
  } catch (error) {
    if (isMissingAuthColumn(error)) {
      return { error: "Login columns are missing. Run supabase/migration_auth.sql in the SQL Editor." };
    }
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return { error: message };
  }

  redirect(next);
}

export async function logout() {
  await clearPresence();
  await clearUserCookie();
  revalidateApp();
  redirect("/login");
}

export type SettingsState = {
  error?: string;
  success?: string;
};

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("users")
    .update({ name, initials: initialsFromName(name) })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidateApp();
  revalidatePath("/projects", "layout");
  return { success: "Name saved." };
}

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next || !confirm) return { error: "Fill in all password fields." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "Password confirmation does not match." };

  const row = unwrap(
    await supabase.from("users").select("password_hash").eq("id", user.id).single(),
  ) as { password_hash: string | null };

  if (!row.password_hash) return { error: "This account has no password yet." };
  const ok = await verifyPassword(current, row.password_hash);
  if (!ok) return { error: "Current password is wrong." };

  const passwordHash = await hashPassword(next);
  const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", user.id);
  if (error) return { error: error.message };

  return { success: "Password changed." };
}
