import { UsageGuide } from "@/components/usage-guide";

export default async function ProjectGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UsageGuide projectId={id} />;
}
