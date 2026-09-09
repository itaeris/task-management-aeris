export const DEFAULT_PROJECT_ICON = "fi-sr-briefcase";

export const FEATURED_PROJECT_ICONS = [
  "fi-sr-briefcase",
  "fi-sr-folder",
  "fi-sr-dashboard",
  "fi-sr-chart-kanban",
  "fi-sr-users",
  "fi-sr-rocket",
  "fi-sr-globe",
  "fi-sr-shop",
  "fi-sr-comments",
  "fi-sr-mobile-button",
  "fi-sr-megaphone",
  "fi-sr-chart-pie",
  "fi-sr-calendar",
  "fi-sr-clipboard-list",
  "fi-sr-bolt",
  "fi-brands-whatsapp",
  "fi-brands-slack",
  "fi-brands-telegram",
  "fi-brands-github",
  "fi-brands-discord",
] as const;

export function isFlaticonId(value: string) {
  return /^(fi-sr|fi-brands)-[a-z0-9-]+$/.test(value);
}

export function encodeProjectIcon(id: string) {
  const safe = isFlaticonId(id) ? id : DEFAULT_PROJECT_ICON;
  return `fi:${safe}`;
}

export function parseProjectMark(value: string | null | undefined):
  | { type: "flaticon"; id: string }
  | { type: "color"; color: string }
  | { type: "url"; src: string } {
  const raw = (value ?? "").trim();
  if (!raw) return { type: "flaticon", id: DEFAULT_PROJECT_ICON };
  if (raw.startsWith("fi:")) {
    const id = raw.slice(3);
    return { type: "flaticon", id: isFlaticonId(id) ? id : DEFAULT_PROJECT_ICON };
  }
  if (isFlaticonId(raw)) return { type: "flaticon", id: raw };
  if (/^https?:\/\//i.test(raw)) return { type: "url", src: raw };
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return { type: "color", color: raw };
  return { type: "flaticon", id: DEFAULT_PROJECT_ICON };
}
