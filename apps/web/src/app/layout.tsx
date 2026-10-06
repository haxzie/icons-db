import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import NextTopLoader from "nextjs-toploader";
import { JsonLd, OG_IMAGE, siteJsonLd, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import { DevTools } from "@/components/DevTools";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://iconsdb.app"),
  title: { default: SITE_TITLE, template: "%s · IconsDB" },
  description: SITE_DESCRIPTION,
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
        {/* Publisher and site nodes, once for the whole app: every page's own
            JSON-LD refers to these by `@id` instead of repeating them. */}
        <JsonLd data={siteJsonLd()} />
      </head>
      {/* No rail here: each browsing section supplies its own chrome via
          AppChrome, so the (auth) pages can render bare — a consent screen
          shouldn't offer navigation out of the flow. */}
      <body className="flex min-h-full">
        <NextTopLoader color="#1a73e8" height={3} shadow="0 0 8px #1a73e8" showSpinner={false} />
        <DevTools />
        {children}
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
