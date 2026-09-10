import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listGroupsForUser, listProjectsForUser, listUsers } from "@/lib/queries";
import { HomeProjects } from "@/components/home-view";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const extrasPromise = Promise.all([listUsers(), listGroupsForUser(user.id)]);
  return (
    <HomeProjects
      user={user}
      projectsPromise={listProjectsForUser(user.id)}
      extrasPromise={extrasPromise}
    />
  );
}
