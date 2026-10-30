import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getSite } from "./sites";

export type PointsArticle = {
  locale: "fr" | "en";
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  body: string;
  filePath: string;
  reviewed: boolean;
  url: string;
};

function contentDir(locale: "fr" | "en") {
  const site = getSite("points");
  return path.join(site!.repoRoot!, "content", locale);
}

export function listPointsArticles(): PointsArticle[] {
  const reviewed = readReviewedSet();
  const articles: PointsArticle[] = [];
  for (const locale of ["fr", "en"] as const) {
    const dir = contentDir(locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".mdx")) continue;
      const slug = file.replace(/\.mdx$/, "");
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      articles.push({
        locale,
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        body: content,
        filePath,
        reviewed: reviewed.has(`${locale}:${slug}`),
        url: `https://points.tn/${locale}/blog/${slug}`,
      });
    }
  }
  articles.sort((a, b) => (a.date < b.date ? 1 : -1));
  return articles;
}

export function getPointsArticle(locale: "fr" | "en", slug: string): PointsArticle | null {
  const filePath = path.join(contentDir(locale), `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const reviewed = readReviewedSet();
  return {
    locale,
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    category: data.category ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    body: content,
    filePath,
    reviewed: reviewed.has(`${locale}:${slug}`),
    url: `https://points.tn/${locale}/blog/${slug}`,
  };
}

export function updatePointsArticle(
  locale: "fr" | "en",
  slug: string,
  updates: { title?: string; description?: string; body?: string; category?: string; tags?: string[] }
) {
  const filePath = path.join(contentDir(locale), `${slug}.mdx`);
  if (!fs.existsSync(filePath)) throw new Error("Article not found");
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const nextData: Record<string, unknown> = {
    ...data,
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.category !== undefined ? { category: updates.category } : {}),
    ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
  };
  const nextBody = updates.body !== undefined ? updates.body : content;

  const frontmatterLines = [
    "---",
    `title: ${JSON.stringify(nextData.title)}`,
    `description: ${JSON.stringify(nextData.description)}`,
    `date: "${nextData.date}"`,
    `category: ${JSON.stringify(nextData.category)}`,
    `coverAlt: ${JSON.stringify(nextData.coverAlt ?? nextData.title)}`,
    `tags: [${((nextData.tags as string[] | undefined) ?? []).map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
    nextBody.trim(),
    "",
  ].join("\n");

  fs.writeFileSync(filePath, frontmatterLines, "utf8");
}

function reviewedLogPath() {
  const site = getSite("points");
  return path.join(site!.repoRoot!, ".dashboard-reviewed.json");
}

function readReviewedSet(): Set<string> {
  const p = reviewedLogPath();
  if (!fs.existsSync(p)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(p, "utf8")));
  } catch {
    return new Set();
  }
}

export function markPointsReviewed(locale: "fr" | "en", slug: string, reviewed: boolean) {
  const set = readReviewedSet();
  const key = `${locale}:${slug}`;
  if (reviewed) set.add(key);
  else set.delete(key);
  fs.writeFileSync(reviewedLogPath(), JSON.stringify([...set], null, 2), "utf8");
}
