import { revalidatePath } from "next/cache";
import { invalidateHomeCache, invalidateProjectCache } from "@/lib/backend";

export async function revalidateHome() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  await invalidateHomeCache();
}

export async function revalidateProject(projectId: string) {
  await revalidateHome();
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath(`/projects/${projectId}`, "page");
  await invalidateProjectCache(projectId);
}
