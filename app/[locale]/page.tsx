import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

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
    title: `${dict.siteName} — ${dict.tagline}`,
    description: dict.tagline,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const dict = getDictionary(loc);
  const articles = getAllArticles(loc);
  const [first, ...rest] = articles;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div className="glow absolute inset-0" />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-2">
              AI · Tech · Business
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{dict.home.heroSubtitle}</p>
            <Link
              href={`/${loc}/blog`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
            >
              {dict.home.heroCta}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <h2 className="mb-8 text-2xl font-bold text-foreground">{dict.home.latestArticles}</h2>
        {articles.length === 0 ? (
          <p className="text-muted">
            {loc === "fr" ? "Les premiers articles arrivent bientôt." : "First articles coming soon."}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {first && <ArticleCard article={first} locale={loc} featured />}
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} locale={loc} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
