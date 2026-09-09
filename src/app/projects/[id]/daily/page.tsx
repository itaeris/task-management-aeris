import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/queries";
import { DailyView } from "@/components/daily-view";

export default async function DailyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const workspace = await getProjectWorkspace(id, user.id);
  if (!workspace) notFound();
  return (
    <DailyView
      projectId={id}
      currentUserId={user.id}
      logs={workspace.dailyLogs}
      members={workspace.members}
    />
  );
}
