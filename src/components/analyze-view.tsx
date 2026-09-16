"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { generateProjectAnalysis, loadProjectAnalysis } from "@/lib/actions/analyze";
import { parseAnalysisContent, workPlanFromBoard } from "@/lib/analysis";
import type { AnalysisWorkItem, StructuredAnalysis } from "@/lib/analysis";
import type { ProjectAnalysis, TaskDTO } from "@/lib/types";
import { AnalyzeWorkPlan } from "@/components/analyze-plan";
import { useWorkspace } from "@/components/workspace-provider";
import { btnPrimary } from "@/components/ui";
import { cn, formatDayTime } from "@/lib/utils";
import { notifyChange } from "@/components/toast";
import { easeOutSoft } from "@/components/motion";

const CAST_LINES = [
  "Gathering the board…",
  "Reading tasks and sprints…",
  "Listening to daily checks…",
  "Finding the risks…",
  "Writing the report…",
];

const SPARKS = [
  { top: "10%", left: "8%", delay: "0s", size: 12 },
  { top: "16%", left: "28%", delay: "0.4s", size: 9 },
  { top: "8%", left: "58%", delay: "0.2s", size: 11 },
  { top: "18%", left: "86%", delay: "0.7s", size: 14 },
  { top: "42%", left: "6%", delay: "0.9s", size: 10 },
  { top: "48%", left: "92%", delay: "0.3s", size: 12 },
  { top: "72%", left: "12%", delay: "1.1s", size: 11 },
  { top: "78%", left: "38%", delay: "0.5s", size: 9 },
  { top: "70%", left: "68%", delay: "0.15s", size: 13 },
  { top: "82%", left: "88%", delay: "0.85s", size: 10 },
];

const DRIFTS = [
  { left: "18%", delay: "0s", x: "-14px" },
  { left: "36%", delay: "0.5s", x: "8px" },
  { left: "52%", delay: "1s", x: "-8px" },
  { left: "68%", delay: "0.3s", x: "12px" },
  { left: "84%", delay: "1.2s", x: "-6px" },
];

const glassPanel =
  "relative flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/55 bg-white/40 shadow-[0_18px_60px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-paper/35 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]";

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function StructuredBody({ data, work }: { data: StructuredAnalysis; work: AnalysisWorkItem[] }) {
  return (
    <div className="space-y-6">
      {data.health ? (
        <section className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Health</h3>
          <p className="text-sm leading-relaxed text-ink">{data.health}</p>
        </section>
      ) : null}
      {data.risks.length ? (
        <section className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Risks</h3>
          <BulletList items={data.risks} />
        </section>
      ) : null}
      {data.blockers.length ? (
        <section className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Blockers</h3>
          <BulletList items={data.blockers} />
        </section>
      ) : null}
      {data.next7days.length ? (
        <section className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Next 7 days</h3>
          <BulletList items={data.next7days} />
        </section>
      ) : null}
      <AnalyzeWorkPlan work={data.work} />
    </div>
  );
}

function AnalysisBody({ content, tasks }: { content: string; tasks: TaskDTO[] }) {
  const parsed = parseAnalysisContent(content);
  const work = workPlanFromBoard(tasks, parsed.kind === "structured" ? parsed.data.work : []);
  if (parsed.kind === "structured") return <StructuredBody data={parsed.data} work={work} />;

  const nodes: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let list: string[] = [];
  let para: string[] = [];

  function flushList() {
    if (!list.length) return;
    const items = list;
    list = [];
    nodes.push(
      <ul key={`l-${nodes.length}`} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>,
    );
  }

  function flushPara() {
    if (!para.length) return;
    const text = para.join("\n");
    para = [];
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
        {text}
      </p>,
    );
  }

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flushList();
      flushPara();
      nodes.push(
        <h3 key={`h-${nodes.length}`} className="font-serif text-xl text-ink">
          {line.replace(/^#+\s+/, "")}
        </h3>,
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (!line.trim()) {
      flushList();
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();

  return (
    <div className="space-y-6">
      <div className="space-y-4">{nodes}</div>
      <AnalyzeWorkPlan work={work} />
    </div>
  );
}

function MagicCast({ reduce }: { reduce: boolean | null }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setLine((current) => (current + 1) % CAST_LINES.length);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgb(255_255_255_/_0.55),transparent_58%)] dark:bg-[radial-gradient(circle_at_50%_46%,rgb(59_130_246_/_0.16),transparent_58%)]" />
      {!reduce
        ? SPARKS.map((spark) => (
            <Sparkles
              key={`${spark.top}-${spark.left}`}
              size={spark.size}
              className="magic-twinkle pointer-events-none absolute text-terracotta/70"
              style={{ top: spark.top, left: spark.left, animationDelay: spark.delay }}
            />
          ))
        : null}
      {!reduce
        ? DRIFTS.map((drift) => (
            <span
              key={drift.left}
              className="magic-drift pointer-events-none absolute bottom-16 h-1.5 w-1.5 rounded-full bg-terracotta/50"
              style={{ left: drift.left, animationDelay: drift.delay, ["--magic-x" as string]: drift.x }}
            />
          ))
        : null}
      <div className="relative grid place-items-center">
        <span className="magic-pulse absolute h-40 w-40 rounded-full bg-white/40 blur-3xl dark:bg-terracotta/20" />
        <span className="magic-spin absolute h-32 w-32 rounded-full border border-white/70 dark:border-terracotta/30" />
        <span className="relative grid h-20 w-20 place-items-center rounded-full border border-white/80 bg-white/50 text-terracotta shadow-[0_8px_30px_rgba(37,99,235,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/10 dark:bg-paper/50 dark:text-white">
          <Sparkles size={28} className={reduce ? undefined : "magic-pulse"} />
        </span>
      </div>
      <p className="relative mt-7 font-serif text-2xl text-ink">Casting the analysis</p>
      <p className="relative mt-2 min-h-5 text-sm text-muted">{CAST_LINES[line]}</p>
    </div>
  );
}

export function AnalyzeView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { tasks } = useWorkspace();
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    loadProjectAnalysis(projectId)
      .then((row) => {
        if (!cancelled) setAnalysis(row);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const row = await notifyChange(generateProjectAnalysis(projectId), "Analysis updated");
      setAnalysis(row);
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Analyze</h1>
          <p className="text-sm text-muted">
            AI reads this project only: {projectName}. Other projects stay separate.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            btnPrimary,
            "relative shrink-0 overflow-hidden",
            busy && "shadow-[0_10px_28px_rgba(37,99,235,0.22)]",
          )}
          onClick={() => void run()}
          disabled={busy || !ready}
        >
          {busy && !reduce ? (
            <span className="magic-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          ) : null}
          <Sparkles size={16} className={cn("relative", busy && !reduce && "magic-pulse")} />
          <span className="relative">{busy ? "Casting…" : analysis ? "Refresh analysis" : "Generate analysis"}</span>
        </button>
      </div>

      <section className={cn(glassPanel, !busy && "overflow-y-auto p-5 sm:p-6")}>
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.p
              key="load"
              className="m-auto text-sm text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading saved analysis…
            </motion.p>
          ) : busy ? (
            <motion.div
              key="cast"
              className="h-full min-h-0 w-full"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.28, ease: easeOutSoft }}
            >
              <MagicCast reduce={reduce} />
            </motion.div>
          ) : analysis ? (
            <motion.div
              key={analysis.updatedAt}
              className="w-full"
              initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: easeOutSoft }}
            >
              <p className="text-xs text-muted">
                Updated {formatDayTime(analysis.updatedAt)}
                {analysis.model ? ` · ${analysis.model}` : ""}
              </p>
              <div className="mt-4">
                <AnalysisBody content={analysis.content} tasks={tasks} />
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              className="m-auto max-w-md text-center text-sm text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No analysis yet. Generate one from this project&apos;s open tasks, sprints, and recent daily
              checks.
            </motion.p>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
