import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const origin = siteUrl() || "https://pipeline.aerisbeaute.com";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${origin}/`,
    name: "Task Management",
    short_name: "Tasks",
    description:
      "Product log, scrum log, daily check, kanban, calendar, dan kolaborasi tim.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#020617",
    theme_color: "#3b82f6",
    lang: "id",
    dir: "ltr",
    orientation: "any",
    categories: ["productivity", "business"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Beranda",
        short_name: "Beranda",
        description: "Dashboard project",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Settings",
        short_name: "Settings",
        url: "/settings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
