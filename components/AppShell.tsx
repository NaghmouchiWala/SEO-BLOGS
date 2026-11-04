"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Globe2, ScanSearch, TrendingUp, Bot, LogOut } from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sites", label: "Sites & articles", icon: Globe2 },
  { href: "/seo", label: "SEO audit", icon: ScanSearch },
  { href: "/rankings", label: "Rankings", icon: TrendingUp },
  { href: "/geo", label: "GEO / AI visibility", icon: Bot },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/login")) return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr] max-[1100px]:grid-cols-[64px_1fr]">
      <aside className="sticky top-0 flex h-screen flex-col border-r border-border bg-sidebar">
        <Link href="/" className="flex items-center gap-2 px-5 pt-5 pb-6 max-[1100px]:justify-center max-[1100px]:px-0">
          <Image
            src="/logo_transparent.webp"
            alt="Galylio"
            width={739}
            height={276}
            priority
            className="h-10 w-auto max-[1100px]:hidden"
          />
          <Image
            src="/galylio-mark.svg"
            alt="Galylio"
            width={28}
            height={28}
            className="hidden h-7 w-7 max-[1100px]:block"
          />
        </Link>
        <div className="px-5 pb-3 font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-accent max-[1100px]:hidden">
          Blogs
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              title={label}
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground aria-[current=page]:bg-accent/10 aria-[current=page]:text-foreground aria-[current=page]:shadow-[inset_2px_0_0_var(--color-accent)] max-[1100px]:justify-center"
            >
              <Icon size={18} strokeWidth={1.5} className={isActive(href) ? "text-accent" : ""} />
              <span className="max-[1100px]:hidden">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            title="Sign out"
            className="btn-ghost w-full !h-9 !px-3 text-muted max-[1100px]:!px-0"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span className="max-[1100px]:hidden">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
