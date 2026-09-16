"use client";

import { PriorityBadge, StatusBadge } from "@/components/ui";
import type { AnalysisWorkItem } from "@/lib/analysis";
import { addDays, cn, formatDay, startOfDay } from "@/lib/utils";

function dayFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyzeWorkPlan({ work }: { work: AnalysisWorkItem[] }) {
  if (!work.length) return null;

  const dated = work.map((item, index) => {
    const start = item.start ? dayFromKey(item.start) : addDays(startOfDay(new Date()), index);
    const end = item.end ? dayFromKey(item.end) : addDays(start, item.priority === "urgent" || item.priority === "high" ? 2 : 1);
    const from = start.getTime() <= end.getTime() ? start : end;
    const to = start.getTime() <= end.getTime() ? end : start;
    return { ...item, from, to };
  });

  const min = dated.reduce((acc, item) => (item.from < acc ? item.from : acc), dated[0].from);
  const max = dated.reduce((acc, item) => (item.to > acc ? item.to : acc), dated[0].to);
  const start = addDays(min, -1);
  const end = addDays(max, 1);
  const days = Math.max(8, Math.min(21, Math.round((end.getTime() - start.getTime()) / 86400000) + 1));
  const dayWidth = 32;
  const width = days * dayWidth;
  const today = startOfDay(new Date());

  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-serif text-xl text-ink">Work to do</h3>
        <p className="mt-1 text-sm text-muted">Open work from this board, with the next move on each item.</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/55 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-paper/40">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/40 text-xs tracking-wide text-muted uppercase dark:bg-paper/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Window</th>
                <th className="px-4 py-3 font-semibold">Next</th>
              </tr>
            </thead>
            <tbody>
              {dated.map((item, index) => (
                <tr key={`${item.title}-${index}`} className="border-t border-white/45 dark:border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{item.title}</td>
                  <td className="px-4 py-3 text-muted">{item.owner}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {formatDay(item.from) === formatDay(item.to)
                      ? formatDay(item.from)
                      : `${dayLabel(item.from)} – ${dayLabel(item.to)}`}
                  </td>
                  <td className="px-4 py-3 text-ink">{item.action || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-xl text-ink">Plan timeline</h3>
        <p className="mt-1 text-sm text-muted">When each item should be worked, from start to finish.</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/55 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-paper/40">
          <div className="min-w-full" style={{ width: width + 220 }}>
            <div className="flex border-b border-white/45 dark:border-white/10">
              <div className="w-52 shrink-0 px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">
                Task
              </div>
              <div className="flex">
                {Array.from({ length: days }, (_, index) => {
                  const date = addDays(start, index);
                  const isToday = date.getTime() === today.getTime();
                  const weekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center justify-end gap-0.5 border-l border-white/35 px-0.5 py-2 dark:border-white/10",
                        weekend && "bg-sand/30",
                      )}
                      style={{ width: dayWidth }}
                    >
                      <span className="text-[9px] font-semibold tracking-wide text-muted uppercase">
                        {date.toLocaleString("en-US", { weekday: "narrow" })}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                          isToday ? "bg-terracotta text-white" : "text-ink",
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {dated.map((item, index) => {
              const offset = Math.max(0, Math.round((item.from.getTime() - start.getTime()) / 86400000));
              const span = Math.max(1, Math.round((item.to.getTime() - item.from.getTime()) / 86400000) + 1);
              return (
                <div key={`bar-${item.title}-${index}`} className="flex items-center border-t border-white/45 dark:border-white/10">
                  <div className="w-52 shrink-0 truncate px-4 py-3 text-sm font-medium text-ink" title={item.title}>
                    {item.title}
                  </div>
                  <div className="relative h-12" style={{ width }}>
                    <div
                      className="absolute top-1/2 h-7 -translate-y-1/2 overflow-hidden rounded-full border border-white/70 bg-terracotta/80 px-2 text-[11px] leading-7 font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-sm"
                      style={{ left: offset * dayWidth, width: span * dayWidth }}
                      title={`${item.title}: ${dayLabel(item.from)} – ${dayLabel(item.to)}`}
                    >
                      <span className="block truncate">{span >= 3 ? item.owner : ""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
