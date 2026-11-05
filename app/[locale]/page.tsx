import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import Sidebar from "@/components/Sidebar";
import { OverlayCard, RowCard } from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";
import { seoDescription } from "@/lib/seo";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const title =
    locale === "fr"
      ? `${dict.siteName} — Actualité de la Tunisie et du monde`
      : `${dict.siteName} — News from Tunisia and the world`;
  const description = seoDescription(dict.tagline);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: { fr: `${SITE_URL}/fr`, en: `${SITE_URL}/en` },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      type: "website",
      siteName: dict.siteName,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const dict = getDictionary(loc);
  const articles = getAllArticles(loc);

  const hero = articles.slice(0, 3);
  const shownSlugs = new Set(hero.map((a) => a.slug));

  // One block per section (newest first), skipping stories already in the hero.
  const sections = CATEGORIES.map((c) => ({
    ...c,
    items: articles.filter((a) => a.categorySlug === c.slug && !shownSlugs.has(a.slug)).slice(0, 4),
  })).filter((s) => s.items.length > 0);

  if (articles.length === 0) {
    return (
      <Container className="py-16">
        <p className="text-muted">{loc === "fr" ? "Les premiers articles arrivent bientôt." : "First articles coming soon."}</p>
      </Container>
    );
  }

  return (
    <Container className="py-5 sm:py-7">
      <h1 className="sr-only">{dict.tagline}</h1>

      {/* Top stories: one large story and two stacked */}
      <section aria-label={dict.news.topStories} className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:[&>*]:min-h-[260px]">
        <div className="min-h-[260px] lg:col-span-2 lg:row-span-2">
          <OverlayCard article={hero[0]} locale={loc} size="large" priority />
        </div>
        {hero[1] && <OverlayCard article={hero[1]} locale={loc} />}
        {hero[2] && <OverlayCard article={hero[2]} locale={loc} />}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.slug}>
              <h2 className="section-title mb-6">
                <Link href={`/${loc}/category/${s.slug}`} className="hover:text-accent-dark">
                  {s[loc]}
                </Link>
              </h2>
              <div className="space-y-8">
                {s.items.map((a) => (
                  <RowCard key={a.slug} article={a} locale={loc} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <Sidebar articles={articles} locale={loc} />
      </div>
    </Container>
  );
}
