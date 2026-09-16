import type { TaskDTO } from "@/lib/types";
import { dateKeyJakarta } from "@/lib/utils";

export type AnalysisWorkItem = {
  title: string;
  owner: string;
  status: string;
  priority: string;
  start: string | null;
  end: string | null;
  action: string;
};

export type StructuredAnalysis = {
  health: string;
  risks: string[];
  blockers: string[];
  next7days: string[];
  work: AnalysisWorkItem[];
};

export type ParsedAnalysis =
  | { kind: "structured"; data: StructuredAnalysis }
  | { kind: "markdown"; content: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown) {
  if (Array.isArray(value)) return value.map(asString).filter(Boolean);
  const text = asString(value);
  return text ? [text] : [];
}

function dayKey(value: unknown): string | null {
  const text = asString(value);
  if (!text || /^(none|null|n\/a|no date|no due|no start|-)$/i.test(text)) return null;
  const match = text.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function normalizeStatus(value: string) {
  const key = value.toLowerCase().replace(/[\s-]+/g, "_");
  if (key.includes("progress")) return "in_progress";
  if (key.includes("review")) return "review";
  if (key.includes("backlog")) return "backlog";
  if (key.includes("done") || key.includes("complete")) return "done";
  if (key.includes("todo") || key.includes("to_do") || key === "open") return "todo";
  return value || "todo";
}

function normalizePriority(value: string) {
  const key = value.toLowerCase();
  if (key.includes("urgent") || key.includes("critical")) return "urgent";
  if (key.includes("high")) return "high";
  if (key.includes("low")) return "low";
  return key.includes("medium") || key.includes("normal") ? "medium" : value || "medium";
}

function parseWorkItem(value: unknown): AnalysisWorkItem | null {
  const row = asRecord(value);
  if (!row) return null;
  const title = asString(row.title) || asString(row.task) || asString(row.name);
  if (!title) return null;
  const start = dayKey(row.start) || dayKey(row.startDate) || dayKey(row.from);
  const end = dayKey(row.end) || dayKey(row.due) || dayKey(row.dueDate) || dayKey(row.to) || start;
  return {
    title,
    owner: asString(row.owner) || asString(row.assignee) || asString(row.people) || "Unassigned",
    status: normalizeStatus(asString(row.status)),
    priority: normalizePriority(asString(row.priority)),
    start,
    end: end || start,
    action: asString(row.action) || asString(row.next) || asString(row.focus),
  };
}

function extractJson(text: string): unknown | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : trimmed).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

export function parseAnalysisContent(content: string): ParsedAnalysis {
  const json = extractJson(content);
  const row = asRecord(json);
  if (!row) return { kind: "markdown", content };

  const workSource = row.work ?? row.table ?? row.plan ?? row.tasks;
  const work = (Array.isArray(workSource) ? workSource : []).map(parseWorkItem).filter((item): item is AnalysisWorkItem => Boolean(item)).slice(0, 20);

  const health = asString(row.health) || asString(row.summary);
  const risks = asStringList(row.risks);
  const blockers = asStringList(row.blockers);
  const next7days = asStringList(row.next7days ?? row.next_7_days ?? row.next);

  if (!health && !risks.length && !blockers.length && !next7days.length && !work.length) {
    return { kind: "markdown", content };
  }

  return {
    kind: "structured",
    data: { health, risks, blockers, next7days, work },
  };
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function matchWorkItem(title: string, aiWork: AnalysisWorkItem[]) {
  const needle = title.trim().toLowerCase();
  return (
    aiWork.find((item) => item.title.trim().toLowerCase() === needle) ??
    aiWork.find((item) => {
      const hay = item.title.trim().toLowerCase();
      return hay.includes(needle) || needle.includes(hay);
    })
  );
}

export function workPlanFromBoard(tasks: TaskDTO[], aiWork: AnalysisWorkItem[] = []) {
  const today = dateKeyJakarta(new Date());
  return tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => {
      const aOverdue = a.dueDate && dateKeyJakarta(a.dueDate) < today ? 0 : 1;
      const bOverdue = b.dueDate && dateKeyJakarta(b.dueDate) < today ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aRank = PRIORITY_RANK[a.priority] ?? 8;
      const bRank = PRIORITY_RANK[b.priority] ?? 8;
      if (aRank !== bRank) return aRank - bRank;
      return a.rank - b.rank;
    })
    .slice(0, 20)
    .map((task) => {
      const hint = matchWorkItem(task.title, aiWork);
      return {
        title: task.title,
        owner: task.assignees.map((person) => person.name).join(", ") || hint?.owner || "Unassigned",
        status: task.status,
        priority: task.priority,
        start: task.startDate ? dateKeyJakarta(task.startDate) : hint?.start ?? null,
        end: task.dueDate ? dateKeyJakarta(task.dueDate) : hint?.end ?? null,
        action: hint?.action ?? "",
      };
    });
}
