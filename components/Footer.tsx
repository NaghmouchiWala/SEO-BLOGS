import Link from "next/link";
import Container from "./Container";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-border bg-surface/50">
      <Container className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-black text-background">
              P
            </span>
            {dict.siteName}
          </div>
          <p className="text-sm leading-relaxed text-muted">{dict.footer.description}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{dict.nav.blog}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={`/${locale}/blog`} className="transition-colors hover:text-foreground">
                {dict.nav.blog}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}`} className="transition-colors hover:text-foreground">
                {dict.nav.home}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{dict.footer.sitesTitle}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a href="https://galylio.com" target="_blank" rel="noopener" className="transition-colors hover:text-foreground">
                Galylio — IA &amp; automatisation
              </a>
            </li>
            <li>
              <a href="https://go2code.tn" target="_blank" rel="noopener" className="transition-colors hover:text-foreground">
                Go2Code — Formations tech
              </a>
            </li>
            <li>
              <a href="https://tdiscount.tn" target="_blank" rel="noopener" className="transition-colors hover:text-foreground">
                Tdiscount.tn
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted sm:flex-row">
        <p>
          © {year} {dict.siteName}. {dict.footer.legal}
        </p>
        <p>points.tn</p>
      </Container>
    </footer>
  );
}
