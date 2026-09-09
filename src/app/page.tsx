import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/lib/queries";
import { HomeProjects } from "@/components/home-view";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const projects = await listProjectsForUser(user.id);
  return <HomeProjects user={user} projects={projects} />;
}
