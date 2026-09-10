import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { PwaRoot } from "@/components/pwa";
import { ToastHost } from "@/components/toast";
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
    "Product log, scrum log, daily check, kanban, calendar, and team collaboration.",
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
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${poppins.className} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem("nara_theme");const d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(t==="light")document.documentElement.classList.remove("dark");else if(d)document.documentElement.classList.add("dark");if(d&&t!=="light"){const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#0b1220")}}catch(e){}})();`,
          }}
        />
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
        <ToastHost />
        {children}
      </body>
    </html>
  );
}
