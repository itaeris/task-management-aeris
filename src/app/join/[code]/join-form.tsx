"use client";

import { joinProjectByCode } from "@/lib/actions/projects";
import { PendingSubmit } from "@/components/pending-submit";
import { notifyChange } from "@/components/toast";

export function JoinProjectForm({ code }: { code: string }) {
  return (
    <form
      className="mt-6"
      action={async () => {
        await notifyChange(joinProjectByCode(code), "Joined project");
      }}
    >
      <PendingSubmit idle="Join project" busy="Joining…" />
    </form>
  );
}
