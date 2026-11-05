import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import Sidebar from "@/components/Sidebar";
import ArticleSearchList from "@/components/ArticleSearchList";
import { getAllArticles } from "@/lib/articles";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";
import { seoDescription, seoTitle } from "@/lib/seo";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const title = seoTitle(dict.blog.title);
  const description = seoDescription(dict.blog.subtitle);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: { fr: `${SITE_URL}/fr/blog`, en: `${SITE_URL}/en/blog` },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/blog`,
      type: "website",
      siteName: "Points.tn",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const dict = getDictionary(loc);
  const articles = getAllArticles(loc);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: dict.blog.title,
    description: dict.blog.subtitle,
    url: `${SITE_URL}/${loc}/blog`,
    inLanguage: loc === "fr" ? "fr-FR" : "en-US",
    hasPart: articles.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `${SITE_URL}/${loc}/blog/${a.slug}`,
      datePublished: a.date,
    })),
  };

  return (
    <Container className="py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <h1 className="section-title mb-6 !text-xl">{dict.blog.title}</h1>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={null}>
          <ArticleSearchList articles={articles} locale={loc} />
        </Suspense>
        <Sidebar articles={articles} locale={loc} />
      </div>
    </Container>
  );
}
