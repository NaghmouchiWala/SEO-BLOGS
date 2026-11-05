import { getAllArticles } from "@/lib/articles";
import { categoryLabel } from "@/lib/categories";
import { isLocale, getDictionary, locales } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// RSS 2.0 feed of the 30 newest articles: /fr/feed.xml and /en/feed.xml.
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const dict = getDictionary(locale);
  const articles = getAllArticles(locale).slice(0, 30);

  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/${locale}/blog/${a.slug}`;
      const photo = a.cover.endsWith(".jpg") ? `<enclosure url="${SITE_URL}${a.cover}" type="image/jpeg" length="0"/>` : "";
      return `<item>
<title>${esc(a.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${new Date(a.date).toUTCString()}</pubDate>
<category>${esc(categoryLabel(a.categorySlug, locale))}</category>
<description>${esc(a.description)}</description>
${photo}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(dict.siteName)}</title>
<link>${SITE_URL}/${locale}</link>
<atom:link href="${SITE_URL}/${locale}/feed.xml" rel="self" type="application/rss+xml"/>
<description>${esc(dict.tagline)}</description>
<language>${locale === "fr" ? "fr-FR" : "en-US"}</language>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
