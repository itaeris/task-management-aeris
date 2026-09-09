import { NextRequest, NextResponse } from "next/server";
import catalog from "@/lib/flaticon-icons.json";
import { FEATURED_PROJECT_ICONS } from "@/lib/project-icon";

type FlatIcon = { id: string; name: string; family: string };

const icons = catalog as FlatIcon[];
const byId = new Map(icons.map((icon) => [icon.id, icon]));

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  const limit = Math.min(80, Math.max(12, Number(request.nextUrl.searchParams.get("limit") ?? 48) || 48));

  if (!q) {
    return NextResponse.json({
      icons: FEATURED_PROJECT_ICONS.map((id) => byId.get(id)).filter(Boolean),
    });
  }

  const scored = icons
    .map((icon) => {
      if (icon.name === q || icon.id === q) return { icon, score: 0 };
      if (icon.name.startsWith(q)) return { icon, score: 1 };
      if (icon.name.includes(q)) return { icon, score: 2 };
      return null;
    })
    .filter((row): row is { icon: FlatIcon; score: number } => row !== null)
    .sort((a, b) => a.score - b.score || a.icon.name.localeCompare(b.icon.name))
    .slice(0, limit)
    .map((row) => row.icon);

  return NextResponse.json({ icons: scored });
}
