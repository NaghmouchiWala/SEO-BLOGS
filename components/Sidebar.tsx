import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { CATEGORIES } from "@/lib/categories";
import { getDictionary, type Locale } from "@/lib/i18n";

/** Right column: numbered list of the newest stories, then the section list. */
export default function Sidebar({ articles, locale }: { articles: ArticleMeta[]; locale: Locale }) {
  const dict = getDictionary(locale);
  const top = articles.slice(0, 6);
  return (
    <aside className="space-y-10">
      <section>
        <h2 className="side-title">{dict.news.recent}</h2>
        <ol className="mt-1">
          {top.map((a, i) => (
            <li key={a.slug} className="flex gap-4 border-b border-border py-4 last:border-0">
              <span className="w-6 shrink-0 text-3xl font-light leading-none text-border-strong">{i + 1}</span>
              <Link href={`/${locale}/blog/${a.slug}`} className="text-sm font-medium leading-snug text-foreground hover:text-accent-dark">
                {a.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="side-title">{dict.news.sections}</h2>
        <ul className="mt-1">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="border-b border-border last:border-0">
              <Link href={`/${locale}/category/${c.slug}`} className="block py-3 text-sm text-foreground hover:text-accent-dark">
                {c[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
