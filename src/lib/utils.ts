export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const PALETTE = [
  "#3b82f6",
  "#0ea5e9",
  "#6366f1",
  "#38bdf8",
  "#2563eb",
  "#06b6d4",
  "#60a5fa",
  "#0284c7",
];

export function colorFromSeed(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function shareCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < 8; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${value.slice(0, 4)}-${value.slice(4)}`;
}

export function toISODate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const APP_TIMEZONE = "Asia/Jakarta";
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function parseDateInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function readAllDay(formData: FormData) {
  const raw = String(formData.get("allDay") ?? "0").toLowerCase();
  return raw !== "0" && raw !== "false";
}

export function parseTaskDateTimeInput(value: FormDataEntryValue | null, allDay = false) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const hour = allDay ? 0 : Number(match[4] ?? "0");
  const minute = allDay ? 0 : Number(match[5] ?? "0");
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour, minute) - JAKARTA_OFFSET_MS);
}

type JakartaParts = { date: string; time: string };

export function jakartaParts(value: Date | string): JakartaParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

export function dateKeyJakarta(value: Date | string) {
  return jakartaParts(value).date;
}

export function toJakartaDateTime(value: Date | string) {
  const { date, time } = jakartaParts(value);
  return `${date}T${time}+07:00`;
}

export function toDateInputValue(iso: string | null | undefined, allDay: boolean) {
  if (!iso) return "";
  const { date, time } = jakartaParts(iso);
  return allDay ? date : `${date}T${time.slice(0, 5)}`;
}

export function convertDateInput(value: string, allDay: boolean) {
  if (!value) return "";
  const date = value.slice(0, 10);
  if (allDay) return date;
  const time = /T\d{2}:\d{2}/.test(value) ? value.slice(11, 16) : "09:00";
  return `${date}T${time}`;
}

export function formatTime(value: Date | string) {
  const time = jakartaParts(value).time.slice(0, 5);
  return time;
}

export function formatDayTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-US", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatTaskWhen(value: Date | string, allDay = true) {
  return allDay ? formatDay(value) : formatDayTime(value);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
