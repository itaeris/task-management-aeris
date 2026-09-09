import type { ReactNode } from "react";
import { Skeleton, surface } from "@/components/ui";
import { cn } from "@/lib/utils";

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(surface, "rounded-3xl p-5", className)}>{children}</div>;
}

export function HomeSkeleton() {
  return (
    <main className="relative flex h-dvh flex-col gap-3 overflow-hidden p-4" aria-busy="true" aria-label="Memuat beranda">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
        <div className="min-w-0">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-2 h-7 w-40" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="h-8 w-28 !rounded-full" />
          <Skeleton className="h-8 w-36 !rounded-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-8 !rounded-full" />
          <Skeleton className="h-10 w-24 !rounded-full" />
          <Skeleton className="h-10 w-20 !rounded-full" />
        </div>
      </header>

      <section className="grid shrink-0 gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="px-4 py-3">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-2.5 w-full !rounded-full" />
          </Card>
        ))}
      </section>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="flex min-h-0 flex-col p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl px-3 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-1 h-4 w-64" />
                  </div>
                </div>
                <Skeleton className="mt-3 ml-11 h-2.5 w-full !rounded-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex min-h-0 flex-col p-0">
          <div className="p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-3 h-10 w-full rounded-xl" />
            <Skeleton className="mt-2 h-16 w-full rounded-xl" />
            <Skeleton className="mt-3 h-10 w-full !rounded-full" />
          </div>
          <div className="border-t border-line p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
          </div>
        </Card>
      </div>
    </main>
  );
}

export function ProjectShellSkeleton() {
  return (
    <div className="relative flex h-dvh gap-4 overflow-hidden p-4" aria-busy="true" aria-label="Memuat project">
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-white/80 shadow-sm backdrop-blur-md">
        <div className="px-5 pt-6">
          <Skeleton className="h-3 w-32" />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-2xl" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-2 px-3 pb-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-2xl" />
          ))}
        </nav>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <header className="flex items-center gap-3 rounded-3xl border border-line bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <Skeleton className="h-10 w-32 shrink-0 !rounded-full" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-8 w-28 !rounded-full" />
            <Skeleton className="h-8 w-36 !rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 !rounded-full" />
          <Skeleton className="h-10 w-24 !rounded-full" />
          <Skeleton className="h-10 w-20 !rounded-full" />
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-2 py-4 lg:px-6">
          <ProjectPageSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProjectPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat halaman">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-7 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <main className="relative mx-auto w-full max-w-5xl px-6 py-8" aria-busy="true" aria-label="Memuat settings">
      <Skeleton className="h-3 w-36" />
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-24 !rounded-full" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-4 h-11 w-full rounded-xl" />
            <Skeleton className="mt-3 h-11 w-full rounded-xl" />
            <Skeleton className="mt-3 h-11 w-full rounded-xl" />
            <Skeleton className="mt-4 h-10 w-28 !rounded-full" />
          </Card>
        ))}
      </div>
    </main>
  );
}
