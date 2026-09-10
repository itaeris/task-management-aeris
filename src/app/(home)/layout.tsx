import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listGroupsForUser, listUsers } from "@/lib/queries";
import { HomeFrame } from "@/components/home-view";

export const dynamic = "force-dynamic";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [people, groups] = await Promise.all([listUsers(), listGroupsForUser(user.id)]);
  return (
    <HomeFrame user={user} people={people} groups={groups}>
      {children}
    </HomeFrame>
  );
}
