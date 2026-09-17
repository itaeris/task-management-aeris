const API_URL = process.env.NEST_API_URL?.trim().replace(/\/$/, "");
const SECRET = process.env.NEST_INTERNAL_SECRET?.trim();
const TIMEOUT_MS = 1500;

export type CacheScope =
  | { kind: "workspace" | "shell"; projectId: string; userId: string }
  | { kind: "switcher" | "home"; userId: string };

function pathFor(scope: CacheScope) {
  if (scope.kind === "workspace") return `/v1/projects/${scope.projectId}/workspace/${scope.userId}`;
  if (scope.kind === "shell") return `/v1/projects/${scope.projectId}/shell/${scope.userId}`;
  if (scope.kind === "switcher") return `/v1/users/${scope.userId}/switcher`;
  return `/v1/users/${scope.userId}/home`;
}

function configured() {
  return Boolean(API_URL && SECRET);
}

async function api(path: string, init?: RequestInit) {
  if (!configured()) return null;
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    return null;
  }
}

export async function readBackendCache<T>(scope: CacheScope): Promise<{ hit: true; data: T } | { hit: false }> {
  const response = await api(pathFor(scope));
  if (!response || response.status === 404 || !response.ok) return { hit: false };
  const payload = (await response.json().catch(() => null)) as { data?: T } | null;
  if (!payload || !("data" in payload)) return { hit: false };
  return { hit: true, data: payload.data as T };
}

export async function writeBackendCache<T>(scope: CacheScope, data: T) {
  await api(pathFor(scope), { method: "PUT", body: JSON.stringify({ data }) });
}

export async function withBackendCache<T>(scope: CacheScope, load: () => Promise<T>): Promise<T> {
  const cached = await readBackendCache<T>(scope);
  if (cached.hit) return cached.data;
  const data = await load();
  if (data !== null && data !== undefined) void writeBackendCache(scope, data);
  return data;
}

export async function invalidateProjectCache(projectId: string) {
  await api(`/v1/projects/${projectId}`, { method: "DELETE" });
}

export async function invalidateHomeCache() {
  await api("/v1/home", { method: "DELETE" });
}
