import Link from "next/link";
import Container from "./Container";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = 2026;

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-surface/60">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <Container className="relative grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-xs font-black text-background">
              P
            </span>
            {dict.siteName}
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">{dict.footer.description}</p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">{dict.nav.blog}</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <Link href={`/${locale}/blog`} className="transition-colors hover:text-accent-2">
                {dict.nav.blog}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}`} className="transition-colors hover:text-accent-2">
                {dict.nav.home}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">{dict.footer.sitesTitle}</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <a href="https://galylio.com" target="_blank" rel="noopener" className="transition-colors hover:text-accent-2">
                Galylio — IA &amp; automatisation
              </a>
            </li>
            <li>
              <a href="https://go2code.tn" target="_blank" rel="noopener" className="transition-colors hover:text-accent-2">
                Go2Code — Formations tech
              </a>
            </li>
            <li>
              <a href="https://tdiscount.tn" target="_blank" rel="noopener" className="transition-colors hover:text-accent-2">
                Tdiscount.tn
              </a>
            </li>
            <li>
              <a href="https://1111.tn" target="_blank" rel="noopener" className="transition-colors hover:text-accent-2">
                1111.tn — Comparateur de prix
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="relative flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted-2 sm:flex-row">
        <p>
          © {year} {dict.siteName}. {dict.footer.legal}
        </p>
        <p>points.tn</p>
      </Container>
    </footer>
  );
}
