"use client";

import { saveDailyLog } from "@/lib/actions/daily";
import { cn, todayKey } from "@/lib/utils";
import type { MemberDTO } from "@/lib/types";
import { Avatar, field, surface } from "@/components/ui";
import { PendingSubmit } from "@/components/pending-submit";
import { notifyChange } from "@/components/toast";

type DailyItem = {
  id: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  user: MemberDTO;
};

export function DailyView({
  projectId,
  currentUserId,
  logs,
  members,
}: {
  projectId: string;
  currentUserId: string;
  logs: DailyItem[];
  members: MemberDTO[];
}) {
  const today = todayKey();
  const mine = logs.find((log) => log.user.id === currentUserId && log.date === today);
  const grouped = logs.reduce<Record<string, DailyItem[]>>((acc, log) => {
    acc[log.date] ??= [];
    acc[log.date].push(log);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
  const missing = members.filter(
    (member) => !logs.some((log) => log.date === today && log.user.id === member.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Daily check</h1>
        <p className="text-sm text-muted">Daily standup: yesterday, today, and blockers.</p>
      </div>

      <section className={cn(surface, "rounded-3xl p-5")}>
        <h2 className="font-serif text-xl">Your check-in · {today}</h2>
        <form
          className="mt-4 grid gap-3"
          action={async (formData) => {
            await notifyChange(saveDailyLog(projectId, formData), "Daily check saved");
          }}
        >
          <input type="hidden" name="date" value={today} />
          <textarea
            name="yesterday"
            className={field}
            rows={3}
            placeholder="Yesterday I..."
            defaultValue={mine?.yesterday}
          />
          <textarea
            name="today"
            className={field}
            rows={3}
            placeholder="Today I..."
            defaultValue={mine?.today}
          />
          <textarea
            name="blockers"
            className={field}
            rows={2}
            placeholder="Blockers (optional)"
            defaultValue={mine?.blockers}
          />
          <PendingSubmit idle="Save daily" busy="Saving…" className="self-start" />
        </form>
      </section>

      {missing.length > 0 ? (
        <p className="text-sm text-muted">
          Not checked in today: {missing.map((member) => member.name).join(", ")}
        </p>
      ) : (
        <p className="text-sm text-forest">Everyone has checked in today.</p>
      )}

      {dates.map((date) => (
        <section key={date} className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">{date}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped[date].map((log) => (
              <article key={log.id} className={cn(surface, "rounded-3xl p-4")}>
                <div className="mb-3 flex items-center gap-2">
                  <Avatar {...log.user} />
                  <div>
                    <p className="font-semibold">{log.user.name}</p>
                    <p className="text-xs text-muted">{log.user.role === "owner" ? "Owner" : "Member"}</p>
                  </div>
                </div>
                <Field label="Yesterday" value={log.yesterday} />
                <Field label="Today" value={log.today} />
                <Field label="Blocker" value={log.blockers || "None"} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}
