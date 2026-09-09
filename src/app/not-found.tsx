import Link from "next/link";
import { btnPrimary } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-serif text-4xl">Page not found</h1>
      <p className="mt-2 text-muted">The project may be private, or the link has expired.</p>
      <Link href="/" className={cn(btnPrimary, "mt-6 self-start")}>
        Back to home
      </Link>
    </main>
  );
}
