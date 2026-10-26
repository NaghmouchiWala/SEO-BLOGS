import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { getDictionary, type Locale } from "@/lib/i18n";

export default function ArticleCard({
  article,
  locale,
  featured = false,
}: {
  article: ArticleMeta;
  locale: Locale;
  featured?: boolean;
}) {
  const dict = getDictionary(locale);
  const date = new Date(article.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/${locale}/blog/${article.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:border-accent/50 hover:bg-surface-2 ${
        featured ? "sm:col-span-2 sm:p-8" : ""
      }`}
    >
      <span className="mb-4 inline-flex w-fit items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-2">
        {article.category}
      </span>
      <h3
        className={`mb-2 font-bold text-foreground transition-colors group-hover:text-accent-2 ${
          featured ? "text-2xl sm:text-3xl" : "text-xl"
        }`}
      >
        {article.title}
      </h3>
      <p className="mb-5 flex-1 text-sm leading-relaxed text-muted">{article.description}</p>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{date}</span>
        <span>
          {article.readingMinutes} {dict.blog.minRead}
        </span>
      </div>
    </Link>
  );
}
