import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/articles";
import { coverForArticle } from "@/lib/covers";
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
  const cover = coverForArticle(article.slug, article.category);

  return (
    <Link
      href={`/${locale}/blog/${article.slug}`}
      className={`card-glow group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-border-strong ${
        featured ? "sm:col-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${featured ? "aspect-[21/9]" : "aspect-[16/9]"}`}
      >
        <Image
          src={cover}
          alt={article.coverAlt}
          fill
          sizes={featured ? "100vw" : "(max-width: 640px) 100vw, 50vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <span className="absolute left-4 top-4 inline-flex w-fit items-center rounded-full border border-accent/30 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-2 backdrop-blur-sm">
          {article.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3
          className={`mb-2 font-[family-name:var(--font-display)] font-bold text-foreground transition-colors group-hover:text-accent-2 ${
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          }`}
        >
          {article.title}
        </h3>
        <p className="mb-5 flex-1 text-sm leading-relaxed text-muted">{article.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-2">
          <span>{date}</span>
          <span>
            {article.readingMinutes} {dict.blog.minRead}
          </span>
        </div>
      </div>
    </Link>
  );
}
