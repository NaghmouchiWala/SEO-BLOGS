import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Container from "@/components/Container";
import ArticleCard from "@/components/ArticleCard";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import TagPill from "@/components/TagPill";
import { DateLine } from "@/components/ArticleCard";
import { categoryLabel } from "@/lib/categories";
import ShareBar from "@/components/ShareBar";
import { getAllArticles, getAllSlugs, getArticle, getTranslationSlug } from "@/lib/articles";
import { coverForArticle } from "@/lib/covers";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";
import { seoDescription, seoTitle } from "@/lib/seo";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getAllSlugs(locale).map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = getArticle(locale, slug);
  if (!article) return {};
  const cover = coverForArticle(article.slug, article.category);
  // Social networks and search engines do not accept SVG share images.
  const shareImage = cover.endsWith(".svg") ? "/images/og-default.png" : cover;
  return {
    title: { absolute: seoTitle(article.title) },
    description: seoDescription(article.description),
    keywords: article.tags,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      // hreflang only for pages that really exist: each language has its own slug.
      languages: (() => {
        const alt = getTranslationSlug(locale, slug);
        const other = locale === "fr" ? "en" : "fr";
        return alt
          ? { [locale]: `${SITE_URL}/${locale}/blog/${slug}`, [other]: `${SITE_URL}/${other}/blog/${alt}` }
          : { [locale]: `${SITE_URL}/${locale}/blog/${slug}` };
      })(),
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      tags: article.tags,
      images: [{ url: `${SITE_URL}${shareImage}` }],
      siteName: "Points.tn",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [`${SITE_URL}${shareImage}`],
    },
  };
}

const mdxComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = props.href?.startsWith("http");
    return (
      <a
        {...props}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener" : undefined}
      />
    );
  },
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const article = getArticle(loc, slug);
  if (!article) notFound();

  const dict = getDictionary(loc);
  const related = getAllArticles(loc)
    .filter((a) => a.slug !== slug)
    .slice(0, 3);
  const cover = coverForArticle(article.slug, article.category);
  // Social networks and search engines do not accept SVG share images.
  const shareImage = cover.endsWith(".svg") ? "/images/og-default.png" : cover;
  const pageUrl = `${SITE_URL}/${loc}/blog/${slug}`;

  const wordCount = article.content.split(/\s+/).filter(Boolean).length;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    headline: article.title,
    description: article.description,
    image: `${SITE_URL}${shareImage}`,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    inLanguage: loc === "fr" ? "fr-FR" : "en-US",
    wordCount,
    keywords: article.tags.join(", "),
    articleSection: categoryLabel(article.categorySlug, loc),
    author: {
      "@type": "Organization",
      name: "Points.tn",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Points.tn",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/cover-ai.svg`,
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.nav.home, item: `${SITE_URL}/${loc}` },
      { "@type": "ListItem", position: 2, name: dict.nav.blog, item: `${SITE_URL}/${loc}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="border-b border-border">
        <Container className="py-8 sm:py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={`/${loc}/blog`}
              className="text-sm font-medium text-muted transition-colors hover:text-accent-dark"
            >
              ← {dict.article.backToBlog}
            </Link>
            <LocaleSwitcher locale={loc} altSlug={getTranslationSlug(loc, slug) ?? undefined} />
          </div>
          <Link href={`/${loc}/category/${article.categorySlug}`} className="cat-badge mb-4">
            {categoryLabel(article.categorySlug, loc)}
          </Link>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{article.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted">
            <DateLine iso={article.date} locale={loc} />
            <span aria-hidden>·</span>
            <span>
              {article.readingMinutes} {dict.blog.minRead}
            </span>
          </div>
        </Container>
      </div>

      <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-border sm:aspect-[3/1]">
        <Image
          src={cover}
          alt={article.coverAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <Container className="py-14 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="prose-points">
            <MDXRemote source={article.content} components={mdxComponents} />
          </div>

          {article.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
              {article.tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}

          <ShareBar url={pageUrl} title={article.title} locale={loc} />
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="border-t border-border py-14 sm:py-16">
          <h2 className="section-title mb-8">
            {dict.article.relatedTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} locale={loc} />
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}
