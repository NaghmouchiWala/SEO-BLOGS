"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Globe2, ScanSearch, TrendingUp, Bot, LogOut, Menu, X, Gauge, Network, Lightbulb, Link2 } from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sites", label: "Sites & articles", icon: Globe2 },
  { href: "/seo", label: "SEO audit", icon: ScanSearch },
  { href: "/geo", label: "GEO / AI visibility", icon: Bot },
  { href: "/rankings", label: "Rankings", icon: TrendingUp },
  { href: "/authority", label: "Authority (DR/UR)", icon: Gauge },
  { href: "/links", label: "Internal links", icon: Network },
  { href: "/keywords", label: "Keyword ideas", icon: Lightbulb },
  { href: "/opportunities", label: "Link opportunities", icon: Link2 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation, and lock page scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pathname.startsWith("/login")) return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[64px_1fr] min-[1100px]:grid-cols-[248px_1fr]">
      {/* Phone: top bar with a menu button */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label="Galylio Blogs home">
          <Image src="/galylio-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-accent">Galylio Blogs</span>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="btn-ghost !h-10 !w-10 !px-0">
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </header>
      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col border-r border-border bg-sidebar transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-auto md:max-w-none md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button onClick={() => setOpen(false)} aria-label="Close menu" className="btn-ghost absolute right-3 top-3 !h-9 !w-9 !px-0 md:hidden">
          <X size={18} strokeWidth={1.5} />
        </button>
        <Link href="/" className="flex items-center gap-2 px-5 pt-5 pb-6 md:max-[1099px]:justify-center md:max-[1099px]:px-0">
          <Image
            src="/logo_transparent.webp"
            alt="Galylio"
            width={739}
            height={276}
            priority
            className="h-10 w-auto md:max-[1099px]:hidden"
          />
          <Image
            src="/galylio-mark.svg"
            alt="Galylio"
            width={28}
            height={28}
            className="hidden h-7 w-7 md:max-[1099px]:block"
          />
        </Link>
        <div className="px-5 pb-3 font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-accent md:max-[1099px]:hidden">
          Blogs
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              title={label}
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground aria-[current=page]:bg-accent/10 aria-[current=page]:text-foreground aria-[current=page]:shadow-[inset_2px_0_0_var(--color-accent)] md:max-[1099px]:justify-center"
            >
              <Icon size={18} strokeWidth={1.5} className={isActive(href) ? "text-accent" : ""} />
              <span className="md:max-[1099px]:hidden">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            title="Sign out"
            className="btn-ghost w-full !h-9 !px-3 text-muted md:max-[1099px]:!px-0"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span className="md:max-[1099px]:hidden">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
