"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type SettingsState } from "@/lib/actions/identity";
import { btnPrimary, field, surface } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { FadeIn } from "@/components/motion";

function Message({ state }: { state: SettingsState }) {
  if (state.error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>;
  return null;
}

export function SettingsForm({ user }: { user: Profile }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, {} as SettingsState);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, {} as SettingsState);

  return (
    <FadeIn className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <form action={profileAction} className={cn(surface, "flex h-full flex-col rounded-3xl p-6")}>
        <h2 className="font-serif text-2xl">Profil</h2>
        <p className="mt-1 text-sm text-muted">Nama ini yang dilihat user lain di workspace.</p>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Nama</span>
            <input name="name" className={field} defaultValue={user.name} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Email</span>
              <input className={field} value={user.email} readOnly />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Username</span>
              <input className={field} value={user.username ?? "—"} readOnly />
            </label>
          </div>
          <Message state={profileState} />
          <button className={cn(btnPrimary, "mt-auto self-start")} disabled={profilePending}>
            {profilePending ? "Menyimpan..." : "Simpan nama"}
          </button>
        </div>
      </form>

      <form action={passwordAction} className={cn(surface, "flex h-full flex-col rounded-3xl p-6")}>
        <h2 className="font-serif text-2xl">Reset password</h2>
        <p className="mt-1 text-sm text-muted">Password saat ini, lalu password baru.</p>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Password saat ini</span>
            <input name="currentPassword" type="password" className={field} required autoComplete="current-password" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Password baru</span>
              <input name="newPassword" type="password" className={field} required minLength={8} autoComplete="new-password" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Konfirmasi</span>
              <input name="confirmPassword" type="password" className={field} required minLength={8} autoComplete="new-password" />
            </label>
          </div>
          <Message state={passwordState} />
          <button className={cn(btnPrimary, "mt-auto self-start")} disabled={passwordPending}>
            {passwordPending ? "Menyimpan..." : "Ganti password"}
          </button>
        </div>
      </form>
    </FadeIn>
  );
}
