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
      <section className="hero-bg relative overflow-hidden border-b border-border">
        <Container className="relative py-24 sm:py-36">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-background/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-2 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-2" />
              AI · Tech · Business
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{dict.home.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={`/${loc}/blog`}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-soft px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,92,255,0.35)] transition-transform hover:scale-[1.03]"
              >
                {dict.home.heroCta}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="https://galylio.com"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-accent-2/50 hover:text-accent-2"
              >
                Galylio.com
                <span aria-hidden className="text-xs opacity-60">↗</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
            {dict.home.latestArticles}
          </h2>
          <Link
            href={`/${loc}/blog`}
            className="hidden text-sm font-medium text-accent-2 transition-colors hover:text-accent-soft sm:block"
          >
            {dict.nav.blog} →
          </Link>
        </div>
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
