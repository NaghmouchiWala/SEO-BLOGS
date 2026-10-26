import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import BlogFilterGrid from "@/components/BlogFilterGrid";
import { getAllArticles } from "@/lib/articles";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.blog.title} — Points.tn`,
    description: dict.blog.subtitle,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: { fr: `${SITE_URL}/fr/blog`, en: `${SITE_URL}/en/blog` },
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const dict = getDictionary(loc);
  const articles = getAllArticles(loc);

  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).slice(0, 14);

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
    <Container className="py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {dict.blog.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{dict.blog.subtitle}</p>
      </div>

      <BlogFilterGrid articles={articles} tags={allTags} locale={loc} />
    </Container>
  );
}
