import { revalidatePath } from "next/cache";
import { invalidateHomeCache, invalidateProjectCache } from "@/lib/backend";

export function revalidateHome() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  void invalidateHomeCache();
}

export function revalidateProject(projectId: string) {
  revalidateHome();
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath(`/projects/${projectId}`, "page");
  void invalidateProjectCache(projectId);
}
