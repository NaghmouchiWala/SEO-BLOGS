import Link from "next/link";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-black text-background shadow-[0_0_20px_rgba(124,92,255,0.5)] transition-transform group-hover:scale-105">
            P
          </span>
          <span className="font-[family-name:var(--font-display)]">{dict.siteName}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href={`/${locale}`}
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground sm:block"
          >
            {dict.nav.home}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground sm:block"
          >
            {dict.nav.blog}
          </Link>
          <a
            href="https://galylio.com"
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground sm:flex"
          >
            Galylio
            <span aria-hidden className="text-xs opacity-60">↗</span>
          </a>
          <div className="ml-1 border-l border-border pl-2 sm:ml-2">
            <LocaleSwitcher locale={locale} />
          </div>
        </nav>
      </Container>
    </header>
  );
}
