import { revalidatePath } from "next/cache";

export function revalidateHome() {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
}

export function revalidateProject(projectId: string) {
  revalidateHome();
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath(`/projects/${projectId}`, "page");
}
