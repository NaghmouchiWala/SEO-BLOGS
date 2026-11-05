import Link from "next/link";
import Container from "./Container";
import { CATEGORIES } from "@/lib/categories";
import { getDictionary, type Locale } from "@/lib/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = 2026;

  return (
    <footer className="mt-16 bg-masthead text-white/80">
      <Container className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-start leading-none text-white">
            <span className="text-[28px] font-light tracking-tight">points</span>
            <span className="ml-[3px] mt-[2px] rounded-full bg-accent px-[5px] py-[2px] text-[9px] font-bold leading-none text-black">
              tn
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">{dict.footer.description}</p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">{dict.news.sections}</h3>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/${locale}/category/${c.slug}`} className="hover:text-accent">
                  {c[locale]}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${locale}/about`} className="hover:text-accent">
                {locale === "fr" ? "À propos" : "About"}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/faq`} className="hover:text-accent">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">{dict.footer.sitesTitle}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://galylio.com" target="_blank" rel="noopener" className="hover:text-accent">
                Galylio — IA &amp; automatisation
              </a>
            </li>
            <li>
              <a href="https://go2code.tn" target="_blank" rel="noopener" className="hover:text-accent">
                Go2Code — Formations tech
              </a>
            </li>
            <li>
              <a href="https://tdiscount.tn" target="_blank" rel="noopener" className="hover:text-accent">
                Tdiscount.tn
              </a>
            </li>
            <li>
              <a href="https://1111.tn" target="_blank" rel="noopener" className="hover:text-accent">
                1111.tn — Comparateur de prix
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col items-center justify-between gap-2 border-t border-white/10 py-5 text-xs text-white/50 sm:flex-row">
        <p>
          © {year} {dict.siteName}. {dict.footer.legal}
        </p>
        <p>points.tn</p>
      </Container>
    </footer>
  );
}
