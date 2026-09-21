import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Rail } from "@/components/shell/Rail";
import { OG_IMAGE } from "@/lib/seo";
import { DevTools } from "@/components/DevTools";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://iconsdb.app"),
  title: { default: "IconsDB — search 200,000+ open source icons, logos & emoji", template: "%s · IconsDB" },
  description:
    "Instant, semantic search across Lucide, Heroicons, Tabler, Phosphor, Material Symbols, Font Awesome, Twemoji, Noto Emoji and 74 more open source sets. Copy as SVG, React, Vue or CSS.",
  openGraph: {
    type: "website",
    siteName: "IconsDB",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", site: "@haxzie_", creator: "@haxzie_", images: [OG_IMAGE.url] },
  icons: { icon: "/logo.svg", apple: "/logo.png" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
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
        <DevTools />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
