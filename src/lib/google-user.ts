import { supabase, unwrap } from "@/lib/supabase";
import { colorFromSeed, initialsFromName } from "@/lib/utils";
import type { UserRow } from "@/lib/mappers";

async function uniqueUsername(base: string) {
  const cleaned = base.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 18) || "user";
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? cleaned : `${cleaned}${i + 1}`;
    const existing = unwrap(
      await supabase.from("users").select("id").eq("username", candidate).maybeSingle(),
    );
    if (!existing) return candidate;
  }
  return `${cleaned}${Date.now().toString(36).slice(-4)}`;
}

export async function findOrCreateGoogleUser(profile: { email: string; name: string }) {
  const email = profile.email.trim().toLowerCase();
  const name = profile.name.trim() || email.split("@")[0];
  if (!email) throw new Error("Google did not return an email.");

  const existing = unwrap(
    await supabase.from("users").select("*").eq("email", email).maybeSingle(),
  ) as UserRow | null;
  if (existing) return existing.id;

  const created = unwrap(
    await supabase
      .from("users")
      .insert({
        name,
        email,
        username: await uniqueUsername(email.split("@")[0] ?? "user"),
        role: "member",
        initials: initialsFromName(name),
        color: colorFromSeed(email),
      })
      .select("id")
      .single(),
  ) as { id: string };

  return created.id;
}
