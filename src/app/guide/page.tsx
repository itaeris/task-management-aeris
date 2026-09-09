import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PresenceProvider } from "@/components/presence";
import { BrandLockup } from "@/components/brand-mark";
import { UsageGuide } from "@/components/usage-guide";
import { ThemeToggle } from "@/components/theme-toggle";
import { btnGhost } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How to use — Task Management",
};

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/guide");

  return (
    <PresenceProvider>
      <main className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrandLockup markClassName="h-6 w-6" textClassName="text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className={cn(btnGhost, "self-start")}>
              Back
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <UsageGuide />
        </div>
      </main>
    </PresenceProvider>
  );
}
