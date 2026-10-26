import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Container from "@/components/Container";
import ArticleCard from "@/components/ArticleCard";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getAllArticles, getAllSlugs, getArticle } from "@/lib/articles";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";

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
  return {
    title: `${article.title} — Points.tn`,
    description: article.description,
    alternates: {
      languages: {
        fr: `/fr/blog/${slug}`,
        en: `/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
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

  const date = new Date(article.date).toLocaleDateString(loc === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    author: { "@type": "Organization", name: "Points.tn" },
    publisher: { "@type": "Organization", name: "Points.tn" },
    inLanguage: loc,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="border-b border-border bg-grid">
        <Container className="py-14 sm:py-16">
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
          <h1 className="font-[family-name:var(--font-display)] max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-5 flex items-center gap-3 text-sm text-muted">
            <span>
              {dict.article.publishedOn} {date}
            </span>
            <span aria-hidden>·</span>
            <span>
              {article.readingMinutes} {dict.blog.minRead}
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-14 sm:py-16">
        <div className="prose-points mx-auto max-w-2xl">
          <MDXRemote source={article.content} components={mdxComponents} />
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="border-t border-border py-14 sm:py-16">
          <h2 className="mb-8 text-2xl font-bold text-foreground">{dict.article.relatedTitle}</h2>
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
