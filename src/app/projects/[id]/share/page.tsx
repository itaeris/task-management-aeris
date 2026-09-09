import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listGroupsForUser, listUsers } from "@/lib/queries";
import ShareFromWorkspace from "@/components/share-from-workspace";

export default async function SharePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const [people, groups] = await Promise.all([listUsers(), listGroupsForUser(user.id)]);
  return <ShareFromWorkspace people={people} groups={groups} />;
}
