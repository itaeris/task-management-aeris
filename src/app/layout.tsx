import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { PwaRoot } from "@/components/pwa";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl() || "https://pipeline.aerisbeaute.com"),
  title: "Task Management",
  description:
    "Product log, scrum log, daily check, kanban, calendar, dan kolaborasi tim.",
  applicationName: "Task Management",
  appleWebApp: {
    capable: true,
    title: "Task Management",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${poppins.className} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.6.0/uicons-brands/css/uicons-brands.css"
        />
      </head>
      <body className="relative min-h-full font-sans text-ink">
        <PwaRoot />
        {children}
      </body>
    </html>
  );
}
