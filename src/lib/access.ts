export const PROJECT_ACCESS = ["personal", "group", "organization"] as const;
export type ProjectAccess = (typeof PROJECT_ACCESS)[number];
export type MembershipSource = "owner" | "invite" | "access";

export const ACCESS_OPTIONS = [
  {
    id: "personal",
    label: "Personal",
    hint: "Only you, plus people you invite with a share code.",
  },
  {
    id: "group",
    label: "Group",
    hint: "Everyone already in the group can open it. No share needed.",
  },
  {
    id: "organization",
    label: "Organization",
    hint: "Everyone in this workspace can open it.",
  },
] as const;

export const ACCESS_LABEL: Record<ProjectAccess, string> = {
  personal: "Personal",
  group: "Group",
  organization: "Organization",
};

export type ProjectAccessRow = {
  id: string;
  access?: string | null;
  group_id?: string | null;
  owner_id: string;
};

export type MembershipRow = {
  id: string;
  role: string;
  source?: string | null;
};

export function isProjectAccess(value: string): value is ProjectAccess {
  return (PROJECT_ACCESS as readonly string[]).includes(value);
}

export function parseProjectAccess(value: unknown): ProjectAccess {
  const next = String(value ?? "personal");
  return isProjectAccess(next) ? next : "personal";
}

export function canLeaveProject(
  access: ProjectAccess,
  role: string,
  membershipSource: string | null | undefined,
) {
  if (role === "owner") return false;
  if (access === "organization") return false;
  if (access === "group" && membershipSource !== "invite") return false;
  return true;
}

export function isMissingAccessSchema(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return /column .*?(access|group_id|source)|relation ["']?(public\.)?(groups|group_members)|could not find the (table|relationship).*group|schema cache/i.test(
    message,
  );
}

export function isMissingPinsSchema(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return /relation ["']?(public\.)?project_pins|could not find the (table|relationship).*project_pins|schema cache/i.test(
    message,
  );
}

export function isMissingAssigneesSchema(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return /relation ["']?(public\.)?task_assignees|could not find the (table|relationship).*task_assignees|schema cache/i.test(
    message,
  );
}
