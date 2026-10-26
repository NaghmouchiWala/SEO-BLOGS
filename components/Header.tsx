import Link from "next/link";
import Container from "./Container";
import LocaleSwitcher from "./LocaleSwitcher";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-black text-background">
            P
          </span>
          {dict.siteName}
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
          >
            {dict.nav.home}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
          >
            {dict.nav.blog}
          </Link>
          <a
            href="https://galylio.com"
            target="_blank"
            rel="noopener"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
          >
            Galylio
          </a>
          <LocaleSwitcher locale={locale} />
        </nav>
      </Container>
    </header>
  );
}
