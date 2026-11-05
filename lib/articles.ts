import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Locale } from "./i18n";
import { categorySlug, type CategorySlug } from "./categories";
import { coverForArticle } from "./covers";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type ArticleMeta = {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  coverAlt: string;
  readingMinutes: number;
  tags: string[];
  categorySlug: CategorySlug;
  cover: string;
};

export type Article = ArticleMeta & {
  content: string;
};

function dirFor(locale: Locale) {
  return path.join(CONTENT_DIR, locale);
}

export function getAllSlugs(locale: Locale): string[] {
  const dir = dirFor(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getArticle(locale: Locale, slug: string): Article | null {
  const filePath = path.join(dirFor(locale), `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);
  return {
    slug,
    locale,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated,
    category: data.category,
    coverAlt: data.coverAlt ?? data.title,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
    tags: Array.isArray(data.tags) ? data.tags : [],
    categorySlug: categorySlug(data.category),
    cover: coverForArticle(slug, data.category),
    content,
  };
}

/**
 * The article in the other language that was generated with this one.
 * French and English articles are written together on the same day but get
 * different slugs, so they are paired by publication date. Returns null when
 * there is not exactly one match (never guess, a wrong hreflang is worse than none).
 */
export function getTranslationSlug(locale: Locale, slug: string): string | null {
  const article = getArticle(locale, slug);
  if (!article) return null;
  const other: Locale = locale === "fr" ? "en" : "fr";
  const matches = getAllSlugs(other)
    .map((s) => getArticle(other, s))
    .filter((a): a is Article => a !== null && a.date === article.date);
  return matches.length === 1 ? matches[0].slug : null;
}

export function getAllArticles(locale: Locale): ArticleMeta[] {
  return getAllSlugs(locale)
    .map((slug) => getArticle(locale, slug))
    .filter((a): a is Article => a !== null)
    .map(({ content, ...meta }) => meta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
