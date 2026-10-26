import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/articles";
import { locales } from "@/lib/i18n";

const BASE_URL = "https://points.tn";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${BASE_URL}/${locale}`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/${locale}/blog`, changeFrequency: "weekly", priority: 0.8 },
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
