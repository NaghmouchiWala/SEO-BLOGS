"use client";

import { useMemo, useState } from "react";
import ArticleCard from "./ArticleCard";
import type { ArticleMeta } from "@/lib/articles";
import type { Locale } from "@/lib/i18n";

export default function BlogFilterGrid({
  articles,
  tags,
  locale,
}: {
  articles: ArticleMeta[];
  tags: string[];
  locale: Locale;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeTag) return articles;
    return articles.filter((a) => a.tags.includes(activeTag));
  }, [articles, activeTag]);

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-12 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`tag-pill ${activeTag === null ? "border-accent-2/60 text-accent-2" : ""}`}
          >
            {locale === "fr" ? "Tous" : "All"}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`tag-pill ${activeTag === tag ? "border-accent-2/60 text-accent-2" : ""}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {filtered.map((article) => (
          <ArticleCard key={article.slug} article={article} locale={locale} />
        ))}
      </div>
    </div>
  );
}
