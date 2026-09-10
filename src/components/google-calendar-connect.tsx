"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Link2Off, RefreshCw } from "lucide-react";
import { btnGhost, btnPrimary } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  disconnectGoogleCalendar,
  syncGoogleCalendar,
  type CalendarActionState,
} from "@/lib/actions/google-calendar";
import type { CalendarConnectionPublic } from "@/lib/types";
import { toast, useToastMessage } from "@/components/toast";

const ERRORS: Record<string, string> = {
  gcal_config: "Google Calendar is not configured.",
  gcal_denied: "Google Calendar access was cancelled.",
  gcal_state: "Google Calendar session expired. Try again.",
  gcal_token: "Could not verify with Google Calendar.",
  gcal_profile: "Could not load the Google account.",
  gcal_email: "This Google account has no email.",
  gcal_save: "Could not save the Google Calendar connection.",
  gcal_migrate: "Run the google_calendar Supabase migration first.",
};

export function GoogleCalendarConnect({
  projectId,
  connection,
  notice,
  error,
}: {
  projectId: string;
  connection: CalendarConnectionPublic;
  notice?: string;
  error?: string;
}) {
  const router = useRouter();
  const [syncState, syncAction, syncPending] = useActionState(syncGoogleCalendar, {} as CalendarActionState);
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectGoogleCalendar,
    {} as CalendarActionState,
  );

  const flash = ERRORS[error ?? ""] ?? (notice === "connected" ? "Google Calendar connected." : "");
  const message = disconnectState.error ?? syncState.error ?? disconnectState.success ?? syncState.success ?? flash;
  useToastMessage(syncState);
  useToastMessage(disconnectState);

  useEffect(() => {
    if (flash) {
      if (error) toast.error(flash);
      else toast.success(flash);
    }
    if (!notice && !error) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("calendar");
    url.searchParams.delete("error");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [error, flash, notice, router]);

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
      {connection.connected ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-[12px] font-medium text-ink">
            <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-terracotta" />
            <span className="truncate">{connection.email ?? "Google Calendar"}</span>
          </span>
          <form action={syncAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button className={btnGhost} disabled={syncPending || disconnectPending} type="submit">
              <RefreshCw className={cn("h-3.5 w-3.5", syncPending && "animate-spin")} />
              {syncPending ? "Syncing..." : "Sync"}
            </button>
          </form>
          <form action={disconnectAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button className={btnGhost} disabled={syncPending || disconnectPending} type="submit">
              <Link2Off className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </form>
        </div>
      ) : (
        <a
          href={`/api/auth/google-calendar?next=${encodeURIComponent(`/projects/${projectId}/calendar`)}`}
          className={btnPrimary}
        >
          Connect Google Calendar
        </a>
      )}
      {message ? (
        <p className={cn("text-right text-[12px]", disconnectState.error || syncState.error || ERRORS[error ?? ""] ? "text-red-700 dark:text-red-400" : "text-muted")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
