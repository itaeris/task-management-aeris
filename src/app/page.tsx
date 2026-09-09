import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listGroupsForUser, listProjectsForUser, listUsers } from "@/lib/queries";
import { HomeProjects } from "@/components/home-view";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [projects, people, groups] = await Promise.all([
    listProjectsForUser(user.id),
    listUsers(),
    listGroupsForUser(user.id),
  ]);
  return <HomeProjects user={user} projects={projects} people={people} groups={groups} />;
}
