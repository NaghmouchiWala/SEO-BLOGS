import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import type { ArticleMeta } from "@/lib/articles";
import { categoryLabel } from "@/lib/categories";
import { getDictionary, type Locale } from "@/lib/i18n";

export function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DateLine({ iso, locale }: { iso: string; locale: Locale }) {
  return (
    <span className="date-line">
      <Clock size={11} aria-hidden />
      <time dateTime={iso}>{formatDate(iso, locale)}</time>
    </span>
  );
}

const href = (locale: Locale, a: ArticleMeta) => `/${locale}/blog/${a.slug}`;

/** Photo with the headline on top (home hero). */
export function OverlayCard({
  article,
  locale,
  size = "small",
  priority = false,
}: {
  article: ArticleMeta;
  locale: Locale;
  size?: "large" | "small";
  priority?: boolean;
}) {
  const large = size === "large";
  return (
    <Link
      href={href(locale, article)}
      className="overlay-card group relative block h-full min-h-[220px] overflow-hidden bg-neutral-800"
    >
      <Image
        src={article.cover}
        alt={article.coverAlt}
        fill
        priority={priority}
        sizes={large ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw"}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
        <span className="cat-badge mb-2">{categoryLabel(article.categorySlug, locale)}</span>
        <h3 className={`font-medium leading-snug text-white ${large ? "text-xl sm:text-3xl" : "text-base sm:text-lg"}`}>
          {article.title}
        </h3>
        {large && <p className="mt-2 hidden max-w-2xl text-sm text-white/80 sm:block">{article.description}</p>}
      </div>
    </Link>
  );
}

/** List row: thumbnail left, text right. */
export function RowCard({ article, locale }: { article: ArticleMeta; locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <article className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-5">
      <Link href={href(locale, article)} className="relative block aspect-[16/10] overflow-hidden bg-surface sm:aspect-[7/5]" tabIndex={-1} aria-hidden>
        <Image src={article.cover} alt="" fill sizes="(max-width: 640px) 100vw, 220px" className="object-cover" />
      </Link>
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold leading-snug text-foreground">
          <Link href={href(locale, article)} className="hover:text-accent-dark">
            {article.title}
          </Link>
        </h3>
        <div className="mt-2">
          <DateLine iso={article.date} locale={locale} />
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{article.description}</p>
        <Link href={href(locale, article)} className="btn-outline mt-3">
          {dict.news.readMore}
        </Link>
      </div>
    </article>
  );
}

/** Plain card (image on top) for "related" blocks. */
export default function ArticleCard({ article, locale }: { article: ArticleMeta; locale: Locale }) {
  return (
    <article>
      <Link href={href(locale, article)} className="relative mb-3 block aspect-[16/10] overflow-hidden bg-surface">
        <Image src={article.cover} alt={article.coverAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
      </Link>
      <span className="cat-badge mb-2">{categoryLabel(article.categorySlug, locale)}</span>
      <h3 className="text-base font-bold leading-snug">
        <Link href={href(locale, article)} className="hover:text-accent-dark">
          {article.title}
        </Link>
      </h3>
      <div className="mt-2">
        <DateLine iso={article.date} locale={locale} />
      </div>
    </article>
  );
}
