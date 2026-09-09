import { NextResponse } from "next/server";
import { supabase, unwrap } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { isProjectMember } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = unwrap(
    await supabase
      .from("attachments")
      .select("filename, mime_type, stored_name, task_id, tasks (project_id)")
      .eq("id", id)
      .maybeSingle(),
  ) as {
    filename: string;
    mime_type: string;
    stored_name: string;
    tasks: { project_id: string } | { project_id: string }[] | null;
  } | null;
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = Array.isArray(file.tasks) ? file.tasks[0] : file.tasks;
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isProjectMember(task.project_id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const downloaded = await supabase.storage.from("attachments").download(file.stored_name);
  if (downloaded.error || !downloaded.data) {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
  const buffer = Buffer.from(await downloaded.data.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
    },
  });
}
