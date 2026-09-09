import Link from "next/link";
import { btnPrimary } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-serif text-4xl">Halaman tidak ketemu</h1>
      <p className="mt-2 text-muted">Project mungkin privat atau tautannya sudah kedaluwarsa.</p>
      <Link href="/" className={cn(btnPrimary, "mt-6 self-start")}>
        Kembali ke beranda
      </Link>
    </main>
  );
}
