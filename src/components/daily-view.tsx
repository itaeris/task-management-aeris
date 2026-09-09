"use client";

import { saveDailyLog } from "@/lib/actions/daily";
import { cn, todayKey } from "@/lib/utils";
import type { MemberDTO } from "@/lib/types";
import { Avatar, btnPrimary, field, surface } from "@/components/ui";

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
        <p className="text-sm text-muted">Standup harian: kemarin, hari ini, dan blocker.</p>
      </div>

      <section className={cn(surface, "rounded-3xl p-5")}>
        <h2 className="font-serif text-xl">Check-in kamu · {today}</h2>
        <form className="mt-4 grid gap-3" action={(formData) => saveDailyLog(projectId, formData)}>
          <input type="hidden" name="date" value={today} />
          <textarea
            name="yesterday"
            className={field}
            rows={3}
            placeholder="Kemarin saya..."
            defaultValue={mine?.yesterday}
          />
          <textarea
            name="today"
            className={field}
            rows={3}
            placeholder="Hari ini saya..."
            defaultValue={mine?.today}
          />
          <textarea
            name="blockers"
            className={field}
            rows={2}
            placeholder="Blocker (opsional)"
            defaultValue={mine?.blockers}
          />
          <button className={cn(btnPrimary, "self-start")}>Simpan daily</button>
        </form>
      </section>

      {missing.length > 0 ? (
        <p className="text-sm text-muted">
          Belum check-in hari ini: {missing.map((member) => member.name).join(", ")}
        </p>
      ) : (
        <p className="text-sm text-forest">Semua anggota sudah daily check hari ini.</p>
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
                <Field label="Kemarin" value={log.yesterday} />
                <Field label="Hari ini" value={log.today} />
                <Field label="Blocker" value={log.blockers || "Tidak ada"} />
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
