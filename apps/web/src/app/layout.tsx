import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Rail } from "@/components/shell/Rail";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://iconsdb.app"),
  title: { default: "IconsDB — search 100,000+ open source icons & emoji", template: "%s · IconsDB" },
  description:
    "Instant, semantic search across Lucide, Heroicons, Tabler, Phosphor, Material Symbols, Twemoji, Noto Emoji and 18 more open source sets. Copy as SVG, React, Vue or CSS.",
  openGraph: { type: "website", siteName: "IconsDB", images: ["/logo.png"] },
  icons: { icon: "/logo.svg", apple: "/logo.png" },
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark";if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full">
        <Rail />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
