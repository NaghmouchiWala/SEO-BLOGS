import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";
import { locales } from "@/lib/i18n";

const BASE_URL = "https://points.tn";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${BASE_URL}/${locale}`, changeFrequency: "daily" as const, priority: 1 },
    { url: `${BASE_URL}/${locale}/blog`, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE_URL}/${locale}/about`, changeFrequency: "yearly" as const, priority: 0.4 },
    { url: `${BASE_URL}/${locale}/faq`, changeFrequency: "monthly" as const, priority: 0.5 },
    ...CATEGORIES.map((c) => ({
      url: `${BASE_URL}/${locale}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]);

  const articleEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllSlugs(locale).map((slug) => ({
      url: `${BASE_URL}/${locale}/blog/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  return [...staticEntries, ...articleEntries];
}
