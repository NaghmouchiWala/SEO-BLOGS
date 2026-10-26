import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";

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

  return (
    <Container className="py-16 sm:py-20">
      <div className="mb-12 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {dict.blog.title}
        </h1>
        <p className="mt-3 text-lg text-muted">{dict.blog.subtitle}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} locale={loc} />
        ))}
      </div>
    </Container>
  );
}
