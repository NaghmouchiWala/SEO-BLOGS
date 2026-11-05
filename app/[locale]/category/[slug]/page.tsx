import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import Sidebar from "@/components/Sidebar";
import { RowCard } from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { CATEGORIES, categoryLabel, isCategorySlug } from "@/lib/categories";
import { isLocale, locales, getDictionary, type Locale } from "@/lib/i18n";
import { seoDescription } from "@/lib/seo";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.flatMap((locale) => CATEGORIES.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategorySlug(slug)) return {};
  const label = categoryLabel(slug, locale);
  const title = `${label} — Points.tn`;
  const description = seoDescription(
    locale === "fr"
      ? `Toute l'actualité ${label.toLowerCase()} de la Tunisie et du monde : les derniers articles de Points.tn.`
      : `All the latest ${label.toLowerCase()} stories from Tunisia and the world on Points.tn.`
  );
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/category/${slug}`,
      languages: { fr: `${SITE_URL}/fr/category/${slug}`, en: `${SITE_URL}/en/category/${slug}` },
    },
    openGraph: { title, description, url: `${SITE_URL}/${locale}/category/${slug}`, type: "website", siteName: "Points.tn" },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategorySlug(slug)) notFound();
  const loc = locale as Locale;
  const dict = getDictionary(loc);
  const all = getAllArticles(loc);
  const items = all.filter((a) => a.categorySlug === slug);

  return (
    <Container className="py-6 sm:py-8">
      <h1 className="section-title mb-6 !text-xl">{categoryLabel(slug, loc)}</h1>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          {items.length === 0 ? (
            <p className="text-muted">{loc === "fr" ? "Aucun article dans cette rubrique pour le moment." : "No articles in this section yet."}</p>
          ) : (
            items.map((a) => <RowCard key={a.slug} article={a} locale={loc} />)
          )}
        </div>
        <Sidebar articles={all} locale={loc} />
      </div>
      <span className="sr-only">{dict.news.inCategory}</span>
    </Container>
  );
}
