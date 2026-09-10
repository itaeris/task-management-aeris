import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/lib/queries";
import { HomeProjectList } from "@/components/home-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const projects = await listProjectsForUser(user.id);
  return <HomeProjectList projects={projects} />;
}
