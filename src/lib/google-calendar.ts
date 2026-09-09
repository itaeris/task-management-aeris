import { supabase, unwrap } from "@/lib/supabase";
import { siteUrl } from "@/lib/site";
import type { TaskRow } from "@/lib/mappers";
import type { CalendarConnectionPublic } from "@/lib/types";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_CALENDAR_SCOPE = `${CALENDAR_SCOPE} openid email profile`;

type ConnectionRow = {
  user_id: string;
  google_email: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  last_synced_at: string | null;
};

type GoogleTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export function isMissingCalendarTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /google_calendar_/i.test(message);
}

export async function getCalendarConnection(userId: string): Promise<CalendarConnectionPublic> {
  try {
    const row = unwrap(
      await supabase.from("google_calendar_connections").select("google_email, last_synced_at").eq("user_id", userId).maybeSingle(),
    ) as { google_email: string; last_synced_at: string | null } | null;
    if (!row) return { connected: false, email: null, lastSyncedAt: null };
    return { connected: true, email: row.google_email, lastSyncedAt: row.last_synced_at };
  } catch (error) {
    if (isMissingCalendarTable(error)) return { connected: false, email: null, lastSyncedAt: null };
    throw error;
  }
}

export async function saveCalendarConnection(input: {
  userId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}) {
  const existing = unwrap(
    await supabase.from("google_calendar_connections").select("refresh_token").eq("user_id", input.userId).maybeSingle(),
  ) as { refresh_token: string } | null;
  const refreshToken = input.refreshToken || existing?.refresh_token;
  if (!refreshToken) throw new Error("Google did not send a refresh token. Try connecting again.");

  const expiry = new Date(Date.now() + Math.max(60, input.expiresIn ?? 3600) * 1000).toISOString();
  unwrap(
    await supabase.from("google_calendar_connections").upsert({
      user_id: input.userId,
      google_email: input.googleEmail,
      calendar_id: "primary",
      access_token: input.accessToken,
      refresh_token: refreshToken,
      token_expiry: expiry,
    }),
  );
}

export async function disconnectCalendar(userId: string) {
  const row = unwrap(
    await supabase.from("google_calendar_connections").select("access_token, refresh_token").eq("user_id", userId).maybeSingle(),
  ) as { access_token: string; refresh_token: string } | null;
  if (row?.access_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.access_token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).catch(() => undefined);
  }
  unwrap(await supabase.from("google_calendar_events").delete().eq("user_id", userId));
  unwrap(await supabase.from("google_calendar_connections").delete().eq("user_id", userId));
}

async function getValidAccessToken(userId: string) {
  const row = unwrap(
    await supabase.from("google_calendar_connections").select("*").eq("user_id", userId).maybeSingle(),
  ) as ConnectionRow | null;
  if (!row) return null;

  const stillValid = new Date(row.token_expiry).getTime() - Date.now() > 60_000;
  if (stillValid) return row;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google Calendar is not configured.");

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!tokenRes.ok) {
    unwrap(await supabase.from("google_calendar_connections").delete().eq("user_id", userId));
    throw new Error("Google Calendar session expired. Connect again.");
  }
  const tokens = (await tokenRes.json()) as GoogleTokens;
  if (!tokens.access_token) throw new Error("Could not refresh the Google Calendar token.");

  const expiry = new Date(Date.now() + Math.max(60, tokens.expires_in ?? 3600) * 1000).toISOString();
  unwrap(
    await supabase
      .from("google_calendar_connections")
      .update({ access_token: tokens.access_token, token_expiry: expiry })
      .eq("user_id", userId),
  );
  return { ...row, access_token: tokens.access_token, token_expiry: expiry };
}

function dateKeyJakarta(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function addOneDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

function eventBody(task: TaskRow, projectName: string) {
  const dueKey = task.due_date ? dateKeyJakarta(task.due_date) : null;
  const startKey = task.start_date ? dateKeyJakarta(task.start_date) : dueKey;
  if (!dueKey || !startKey) return null;
  const endKey = addOneDay(dueKey < startKey ? startKey : dueKey);
  const app = siteUrl() || "https://pipeline.aerisbeaute.com";
  const lines = [
    task.description?.trim() || "",
    `Status: ${task.status} · Priority: ${task.priority}`,
    `Project: ${projectName}`,
    `${app}/projects/${task.project_id}/calendar`,
  ].filter(Boolean);

  return {
    summary: task.title,
    description: lines.join("\n"),
    start: { date: startKey },
    end: { date: endKey },
    extendedProperties: {
      private: { naraTaskId: task.id },
    },
  };
}

async function calendarRequest(accessToken: string, path: string, init?: RequestInit) {
  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: { message?: string } }).error?.message ?? response.status)
        : `Google Calendar error ${response.status}`;
    throw new Error(message);
  }
  return payload as { id?: string };
}

async function mappedEvent(userId: string, taskId: string) {
  return unwrap(
    await supabase
      .from("google_calendar_events")
      .select("event_id, calendar_id")
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .maybeSingle(),
  ) as { event_id: string; calendar_id: string } | null;
}

export async function upsertTaskOnGoogleCalendar(userId: string, taskId: string) {
  const connection = await getValidAccessToken(userId);
  if (!connection) return;

  const task = unwrap(await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle()) as TaskRow | null;
  if (!task) {
    await deleteTaskOnGoogleCalendar(userId, taskId);
    return;
  }

  const project = unwrap(
    await supabase.from("projects").select("name").eq("id", task.project_id).maybeSingle(),
  ) as { name: string } | null;
  const body = eventBody(task, project?.name ?? "Task Management");
  const existing = await mappedEvent(userId, taskId);

  if (!body) {
    if (existing) await deleteTaskOnGoogleCalendar(userId, taskId);
    return;
  }

  if (existing) {
    try {
      await calendarRequest(
        connection.access_token,
        `/calendars/${encodeURIComponent(existing.calendar_id)}/events/${encodeURIComponent(existing.event_id)}`,
        { method: "PUT", body: JSON.stringify(body) },
      );
      return;
    } catch {
      unwrap(
        await supabase.from("google_calendar_events").delete().eq("user_id", userId).eq("task_id", taskId),
      );
    }
  }

  const created = await calendarRequest(
    connection.access_token,
    `/calendars/${encodeURIComponent(connection.calendar_id)}/events`,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (!created?.id) return;
  unwrap(
    await supabase.from("google_calendar_events").upsert(
      {
        user_id: userId,
        task_id: taskId,
        event_id: created.id,
        calendar_id: connection.calendar_id,
      },
      { onConflict: "user_id,task_id" },
    ),
  );
}

export async function deleteTaskOnGoogleCalendar(userId: string, taskId: string) {
  const connection = await getValidAccessToken(userId).catch(() => null);
  const existing = await mappedEvent(userId, taskId);
  if (connection && existing) {
    await calendarRequest(
      connection.access_token,
      `/calendars/${encodeURIComponent(existing.calendar_id)}/events/${encodeURIComponent(existing.event_id)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  }
  unwrap(await supabase.from("google_calendar_events").delete().eq("user_id", userId).eq("task_id", taskId));
}

export async function syncProjectToGoogleCalendar(userId: string, projectId: string) {
  const connection = await getValidAccessToken(userId);
  if (!connection) throw new Error("Google Calendar is not connected.");

  const tasks = unwrap(
    await supabase.from("tasks").select("id, due_date").eq("project_id", projectId),
  ) as Array<{ id: string; due_date: string | null }>;

  let synced = 0;
  for (const task of tasks) {
    await upsertTaskOnGoogleCalendar(userId, task.id);
    if (task.due_date) synced += 1;
  }

  unwrap(
    await supabase
      .from("google_calendar_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId),
  );
  return synced;
}

export async function notifyGoogleCalendarTaskChanged(taskId: string) {
  try {
    const task = unwrap(
      await supabase.from("tasks").select("project_id").eq("id", taskId).maybeSingle(),
    ) as { project_id: string } | null;
    if (!task) return;

    const members = unwrap(
      await supabase.from("project_members").select("user_id").eq("project_id", task.project_id),
    ) as Array<{ user_id: string }>;
    const memberIds = new Set(members.map((row) => row.user_id));
    const connections = unwrap(
      await supabase.from("google_calendar_connections").select("user_id"),
    ) as Array<{ user_id: string }>;
    const userIds = connections.map((row) => row.user_id).filter((id) => memberIds.has(id));
    await Promise.all(userIds.map((userId) => upsertTaskOnGoogleCalendar(userId, taskId).catch(() => undefined)));
  } catch (error) {
    if (isMissingCalendarTable(error)) return;
  }
}

export async function notifyGoogleCalendarTaskDeleted(taskId: string) {
  try {
    const maps = unwrap(
      await supabase.from("google_calendar_events").select("user_id").eq("task_id", taskId),
    ) as Array<{ user_id: string }>;
    await Promise.all(maps.map((row) => deleteTaskOnGoogleCalendar(row.user_id, taskId).catch(() => undefined)));
  } catch (error) {
    if (isMissingCalendarTable(error)) return;
  }
}
