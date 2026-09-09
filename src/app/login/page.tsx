import { redirect } from "next/navigation";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { LoginPage } from "@/components/login-page";

export const metadata = {
  title: "Sign in — Task Management",
};

export default async function LoginRoute({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(next);
  if (user) redirect(nextPath);
  return <LoginPage nextPath={nextPath} error={error} />;
}
