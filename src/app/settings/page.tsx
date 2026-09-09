import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";
import { PresenceProvider } from "@/components/presence";
import { BrandMark } from "@/components/brand-mark";
import { btnGhost } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Settings — Task Management",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <PresenceProvider>
      <main className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <p className="text-xs font-semibold tracking-[0.22em] text-terracotta uppercase">Task Management</p>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl">Settings</h1>
            <p className="mt-1 text-sm text-muted">Ubah nama tampilan dan reset password akun.</p>
          </div>
          <Link href="/" className={cn(btnGhost, "self-start")}>
            Kembali
          </Link>
        </div>
        <div className="mt-6">
          <SettingsForm user={user} />
        </div>
      </main>
    </PresenceProvider>
  );
}
