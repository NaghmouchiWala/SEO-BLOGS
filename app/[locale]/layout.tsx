import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isLocale, locales, type Locale } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const SITE_URL = "https://points.tn";

// This layout is the root layout of the app so that <html lang> can follow
// the URL locale (/fr -> "fr", /en -> "en"). The bare "/" redirect to the
// default locale lives in next.config.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Points.tn — AI, Tech & Business Insights",
    template: "%s",
  },
  description:
    "Points.tn covers artificial intelligence, SEO automation and digital business, from Tunisia to the world.",
  robots: { index: true, follow: true },
  // Bing Webmaster Tools site verification (renders <meta name="msvalidate.01">).
  verification: { other: { "msvalidate.01": "570B7AC2B76698517D56D51334E68513" } },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: "Points.tn",
  url: SITE_URL,
  logo: `${SITE_URL}/images/cover-ai.svg`,
  sameAs: ["https://galylio.com", "https://go2code.tn", "https://tdiscount.tn", "https://1111.tn"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Points.tn",
  publisher: { "@id": `${SITE_URL}#organization` },
  inLanguage: ["fr-FR", "en-US"],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Header locale={locale as Locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} />
      </body>
    </html>
  );
}
