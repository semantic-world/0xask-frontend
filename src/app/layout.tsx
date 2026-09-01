import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ModeSync } from "@/components/layout/ModeSync";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { getProfile } from "@/lib/server-api";
import { SEARCH, SITE } from "@/lib/site";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-face",
});

/**
 * Titles carry the owner's name, not only the handle he works under.
 *
 * Someone who knows him searches the name on his passport. Someone who has
 * seen his code searches the handle. The site was answering only the second:
 * the name appeared in no title, no description, and once on the home page,
 * which is a poor showing for the query most likely to be typed by a recruiter
 * who was given a name and nothing else.
 *
 * Read from the profile rather than written here, so it stays whatever he says
 * it is, and falls back to the handle if the API is unreachable at build or
 * request time. A title is not worth failing a page over.
 */
export async function generateMetadata(): Promise<Metadata> {
  let fullName = "";
  let headline = "";

  try {
    const profile = await getProfile();
    fullName = profile.full_name;
    headline = profile.headline;
  } catch {
    // Unpublished or unreachable. The handle alone is still a correct title.
  }

  const name = fullName ? `${fullName} (${SITE.name})` : SITE.name;
  const subject = fullName || SITE.name;

  // The headline names four roles, which is right on the page and far too long
  // for a title: a search result shows roughly sixty characters and discards
  // the rest, so everything after the first role is written and never read.
  // The first is the one he leads with. The others are in the description,
  // which has room for them.
  const leadRole = headline.split(",")[0]?.trim() ?? "";

  return {
    metadataBase: new URL(SITE.origin),
    title: {
      default: leadRole ? `${name}, ${leadRole}` : `${name}, ${SITE.tagline}`,
      // The name is in every title, because every page is a page about him and
      // a search engine reading one in isolation should be able to tell.
      template: `%s | ${name}`,
    },
    description: headline
      ? `${subject}. ${headline}. Browse the work, or ask about it directly through ${SITE.product}.`
      : SITE.description,
    alternates: { canonical: "/" },
    applicationName: SITE.product,
    appleWebApp: {
      capable: true,
      title: SITE.product,
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${SITE.name}, ${SITE.tagline}`,
      description: SITE.description,
      url: SITE.origin,
    },
    twitter: { card: "summary_large_image" },
    // Ownership proofs, and only when configured. An empty verification value
    // renders an empty tag, which reads to a crawler as a claim that failed
    // rather than as a claim that was never made.
    verification: {
      ...(SEARCH.google ? { google: SEARCH.google } : {}),
      ...(SEARCH.bing ? { other: { "msvalidate.01": SEARCH.bing } } : {}),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The on screen keyboard resizes the layout instead of covering it, which
  // is what makes the composer feel native on a phone.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Runs before paint so the correct palette is never flashed. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, build time constant with no interpolation */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-sm)] focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
        >
          Skip to content
        </a>
        <ModeSync />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <InstallPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
