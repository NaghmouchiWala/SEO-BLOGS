import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isLocale, locales, type Locale } from "@/lib/i18n";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const SITE_URL = "https://points.tn";

// This layout is the root layout of the app so that <html lang> can follow
// the URL locale (/fr -> "fr", /en -> "en"). The bare "/" redirect to the
// default locale lives in next.config.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Points.tn — Actualité de la Tunisie et du monde",
    template: "%s",
  },
  description:
    "Points.tn suit l'actualité de la Tunisie et du monde : national, international, sport, culture, régions et tech.",
  robots: { index: true, follow: true },
  // Bing Webmaster Tools site verification (renders <meta name="msvalidate.01">).
  verification: { other: { "msvalidate.01": "570B7AC2B76698517D56D51334E68513" } },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "@id": `${SITE_URL}#organization`,
  name: "Points.tn",
  url: SITE_URL,
  logo: `${SITE_URL}/images/cover-tech.svg`,
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
    <html lang={locale} className={`${roboto.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <Header locale={locale as Locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} />
      </body>
    </html>
  );
}
