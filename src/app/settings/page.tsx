import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";
import { PresenceProvider } from "@/components/presence";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { btnGhost } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings — Task Management",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <PresenceProvider>
      <main className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrandLockup markClassName="h-6 w-6" textClassName="text-xs" />
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl">Settings</h1>
            <p className="mt-1 text-sm text-muted">Change your display name and reset your password.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/guide" className={cn(btnGhost, "self-start")}>
              How to use
            </Link>
            <Link href="/" className={cn(btnGhost, "self-start")}>
              Back
            </Link>
          </div>
        </div>
        <div className="mt-6">
          <SettingsForm user={user} />
        </div>
      </main>
    </PresenceProvider>
  );
}
