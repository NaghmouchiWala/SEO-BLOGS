"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/articles";
import { categoryLabel } from "@/lib/categories";
import { getDictionary, type Locale } from "@/lib/i18n";

function fmt(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** All-articles list, filtered by the ?q= search term from the masthead. */
export default function ArticleSearchList({ articles, locale }: { articles: ArticleMeta[]; locale: Locale }) {
  const dict = getDictionary(locale);
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();

  const shown = useMemo(() => {
    if (!q) return articles;
    return articles.filter((a) => `${a.title} ${a.description} ${a.tags.join(" ")} ${a.category}`.toLowerCase().includes(q));
  }, [articles, q]);

  if (shown.length === 0) return <p className="text-muted">{dict.news.noResults}</p>;

  return (
    <div className="space-y-8">
      {shown.map((a) => (
        <article key={a.slug} className="grid gap-4 border-b border-border pb-8 last:border-0 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-5">
          <Link href={`/${locale}/blog/${a.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface sm:aspect-[7/5]" tabIndex={-1} aria-hidden>
            <Image src={a.cover} alt="" fill sizes="(max-width: 640px) 100vw, 220px" className="object-cover" />
          </Link>
          <div className="min-w-0">
            <span className="cat-badge mb-2">{categoryLabel(a.categorySlug, locale)}</span>
            <h3 className="text-[17px] font-bold leading-snug">
              <Link href={`/${locale}/blog/${a.slug}`} className="hover:text-accent-dark">
                {a.title}
              </Link>
            </h3>
            <p className="date-line mt-2">{fmt(a.date, locale)}</p>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{a.description}</p>
            <Link href={`/${locale}/blog/${a.slug}`} className="btn-outline mt-3">
              {dict.news.readMore}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
