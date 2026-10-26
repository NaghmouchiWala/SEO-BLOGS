import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export default function LocaleSwitcher({
  locale,
  altSlug,
}: {
  locale: Locale;
  altSlug?: string;
}) {
  const other: Locale = locale === "fr" ? "en" : "fr";
  const href = altSlug ? `/${other}/blog/${altSlug}` : `/${other}`;

  return (
    <Link
      href={href}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:border-accent hover:text-foreground"
    >
      {other}
    </Link>
  );
}
