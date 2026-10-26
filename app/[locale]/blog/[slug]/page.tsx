import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Container from "@/components/Container";
import ArticleCard from "@/components/ArticleCard";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import TagPill from "@/components/TagPill";
import ShareBar from "@/components/ShareBar";
import { getAllArticles, getAllSlugs, getArticle } from "@/lib/articles";
import { imageForCategory } from "@/lib/categories";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";

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
  const cover = imageForCategory(article.category);
  return {
    title: `${article.title} — Points.tn`,
    description: article.description,
    keywords: article.tags,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      languages: {
        fr: `${SITE_URL}/fr/blog/${slug}`,
        en: `${SITE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      tags: article.tags,
      images: [{ url: `${SITE_URL}${cover}` }],
      siteName: "Points.tn",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [`${SITE_URL}${cover}`],
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
    .slice(0, 2);
  const cover = imageForCategory(article.category);
  const pageUrl = `${SITE_URL}/${loc}/blog/${slug}`;

  const date = new Date(article.date).toLocaleDateString(loc === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const wordCount = article.content.split(/\s+/).filter(Boolean).length;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    headline: article.title,
    description: article.description,
    image: `${SITE_URL}${cover}`,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    inLanguage: loc === "fr" ? "fr-FR" : "en-US",
    wordCount,
    keywords: article.tags.join(", "),
    articleSection: article.category,
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

      <div className="border-b border-border bg-grid">
        <Container className="py-10 sm:py-12">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={`/${loc}/blog`}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              ← {dict.article.backToBlog}
            </Link>
            <LocaleSwitcher locale={loc} altSlug={slug} />
          </div>
          <span className="mb-4 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-2">
            {article.category}
          </span>
          <h1 className="font-[family-name:var(--font-display)] max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{article.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>
              {dict.article.publishedOn} <time dateTime={article.date}>{date}</time>
            </span>
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
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
          <h2 className="mb-8 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
            {dict.article.relatedTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} locale={loc} />
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}
