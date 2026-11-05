"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getDictionary, type Locale } from "@/lib/i18n";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const other: Locale = locale === "fr" ? "en" : "fr";

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(`/${locale}/blog${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  }

  const linkCls = "block border-b border-white/10 px-3 py-3.5 text-[15px] hover:text-accent";

  return (
    <>
      <header className="sticky top-0 z-40 bg-masthead text-white">
        <div className="mx-auto flex h-[52px] w-full max-w-[1240px] items-center justify-between px-4 sm:h-[60px] sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label={dict.news.menu}
            aria-expanded={menuOpen}
            className="-ml-2 flex h-11 w-11 items-center justify-center"
          >
            <Menu size={22} />
          </button>

          <Link href={`/${locale}`} className="flex items-start leading-none" aria-label="Points.tn">
            <span className="text-[28px] font-light tracking-tight sm:text-[32px]">points</span>
            <span className="ml-[3px] mt-[2px] rounded-full bg-accent px-[5px] py-[2px] text-[9px] font-bold leading-none text-black">
              tn
            </span>
          </Link>

          <div className="flex items-center">
            <Link href={`/${other}`} hrefLang={other} className="mr-1 px-2 text-xs font-medium uppercase text-white/70 hover:text-white">
              {other}
            </Link>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={dict.news.search}
              aria-expanded={searchOpen}
              className="-mr-2 flex h-11 w-11 items-center justify-center"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submit} className="border-t border-white/15 bg-masthead">
            <div className="mx-auto flex w-full max-w-[1240px] gap-2 px-4 py-3 sm:px-6">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={dict.news.searchPlaceholder}
                aria-label={dict.news.search}
                className="h-11 min-w-0 flex-1 border border-white/25 bg-transparent px-3 text-base text-white placeholder:text-white/50 focus:border-accent focus:outline-none"
              />
              <button type="submit" className="h-11 bg-accent px-5 text-sm font-medium text-black">
                {dict.news.search}
              </button>
            </div>
          </form>
        )}
      </header>

      {menuOpen && (
        <button aria-label={dict.news.close} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/60" />
      )}
      <aside
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-masthead text-white transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full invisible"
        }`}
      >
        <div className="flex h-[52px] items-center justify-between px-4 sm:h-[60px]">
          <span className="text-xs uppercase tracking-widest text-white/60">{dict.news.sections}</span>
          <button onClick={() => setMenuOpen(false)} aria-label={dict.news.close} className="-mr-2 flex h-11 w-11 items-center justify-center">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-6" aria-label={dict.news.sections}>
          <Link href={`/${locale}`} className={linkCls}>
            {dict.nav.home}
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/${locale}/category/${c.slug}`} className={linkCls}>
              {c[locale]}
            </Link>
          ))}
          <Link href={`/${locale}/blog`} className={linkCls}>
            {dict.news.allArticles}
          </Link>
          <Link href={`/${locale}/about`} className={linkCls}>
            {locale === "fr" ? "À propos" : "About"}
          </Link>
          <Link href={`/${locale}/faq`} className={linkCls}>
            FAQ
          </Link>
          <Link href={`/${locale}/ai-ecosystem`} className={linkCls}>
            {locale === "fr" ? "Écosystème IA en Tunisie" : "AI ecosystem in Tunisia"}
          </Link>
        </nav>
      </aside>
    </>
  );
}
