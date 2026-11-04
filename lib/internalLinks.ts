// Internal-link analyzer. Crawls a site's sitemap and counts, for every page,
// how many OTHER pages link to it from their content (menus/footers excluded
// when the page has <main>/<article>). Pages with no inbound content links are
// "orphans": search engines and visitors reach them with difficulty and they
// receive no link strength, which holds UR down. Also reports broken internal
// links.
import { cached, HOUR } from "./cache";

const UA = "GalylioBlogsLinks/1.0 (+https://galylio.com)";

export type PageLinks = { url: string; path: string; inbound: number; outbound: number };
export type BrokenLink = { target: string; status: number; from: string[] };

export type LinkReport = {
  domain: string;
  crawledAt: string;
  pages: number;
  avgInbound: number;
  orphans: PageLinks[];
  weak: PageLinks[]; // exactly 1 inbound
  top: PageLinks[];
  fewOutbound: PageLinks[]; // pages that link to fewer than 2 other pages
  broken: BrokenLink[];
  truncated: boolean;
};

async function fetchText(url: string, timeoutMs = 15000): Promise<{ status: number; text: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    return { status: res.status, text: res.ok ? await res.text() : "" };
  } catch {
    return { status: 0, text: "" };
  }
}

async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&");

async function sitemapUrls(base: string): Promise<string[]> {
  const root = await fetchText(`${base}/sitemap.xml`);
  if (!root.text) return [];
  let locs = [...root.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(root.text)) {
    const kids = await pool(locs.slice(0, 6), 3, (u) => fetchText(u));
    locs = kids.flatMap((k) => [...k.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1])));
  }
  return [...new Set(locs.filter((u) => !/\.(xml|jpe?g|png|webp|gif|pdf|svg)(\?|$)/i.test(u)))];
}

export async function analyzeInternalLinks(domain: string, force = false): Promise<LinkReport> {
  return cached(`links:${domain}`, 6 * HOUR, force, async () => {
    const base = `https://${domain}`;
    const hosts = new Set([domain, `www.${domain}`]);
    const key = (u: URL) => {
      const p = u.pathname.replace(/\/+$/, "");
      return decodeURIComponent(p || "/");
    };

    const MAX = 250;
    const all = await sitemapUrls(base);
    const urls = all.slice(0, MAX);
    const truncated = all.length > MAX;
    const keyOf = new Map<string, string>(); // key -> canonical url
    for (const u of urls) {
      try {
        keyOf.set(key(new URL(u)), u);
      } catch {
        /* skip */
      }
    }

    const inbound = new Map<string, Set<string>>();
    const outbound = new Map<string, number>();
    const unknownTargets = new Map<string, Set<string>>(); // target url -> source keys
    for (const k of keyOf.keys()) inbound.set(k, new Set());

    await pool([...keyOf.entries()], 8, async ([srcKey, url]) => {
      const { text } = await fetchText(url);
      if (!text) return;
      const region = text.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? text.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? text;
      const seen = new Set<string>();
      for (const m of region.matchAll(/<a\b[^>]*?href=["']([^"'#]+)["']/gi)) {
        const href = decode(m[1].trim());
        if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
        let target: URL;
        try {
          target = new URL(href, url);
        } catch {
          continue;
        }
        if (!hosts.has(target.hostname)) continue;
        if (/\.(css|js|jpe?g|png|webp|gif|svg|ico|pdf|xml|txt|woff2?)$/i.test(target.pathname)) continue;
        const tk = key(target);
        if (tk === srcKey || seen.has(tk)) continue;
        seen.add(tk);
        if (inbound.has(tk)) inbound.get(tk)!.add(srcKey);
        else {
          const full = `${base}${target.pathname}`;
          if (!unknownTargets.has(full)) unknownTargets.set(full, new Set());
          unknownTargets.get(full)!.add(srcKey);
        }
      }
      outbound.set(srcKey, seen.size);
    });

    const rows: PageLinks[] = [...keyOf.entries()].map(([k, url]) => ({
      url,
      path: k,
      inbound: inbound.get(k)?.size ?? 0,
      outbound: outbound.get(k) ?? 0,
    }));
    // Homepages ("/" and per-language roots like "/fr") and archive pages are hubs, not articles.
    const nonHome = rows.filter((r) => r.path !== "/" && !/^\/[a-z]{2}$/.test(r.path) && !/\/category(\/|$)|\/page\/\d+/.test(r.path));

    // Broken internal links: targets that are not in the sitemap, checked once each.
    const toCheck = [...unknownTargets.keys()].slice(0, 80);
    const checked = await pool(toCheck, 8, async (t) => {
      try {
        const res = await fetch(t, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(10000), cache: "no-store" });
        return { t, status: res.status };
      } catch {
        return { t, status: 0 };
      }
    });
    const broken: BrokenLink[] = checked
      .filter((c) => c.status === 0 || c.status >= 400)
      .map((c) => ({ target: c.t, status: c.status, from: [...(unknownTargets.get(c.t) ?? [])].slice(0, 3).map((k) => keyOf.get(k) ?? k) }));

    const sum = nonHome.reduce((s, r) => s + r.inbound, 0);
    return {
      domain,
      crawledAt: new Date().toISOString(),
      pages: rows.length,
      avgInbound: nonHome.length ? sum / nonHome.length : 0,
      orphans: nonHome.filter((r) => r.inbound === 0).slice(0, 60),
      weak: nonHome.filter((r) => r.inbound === 1).slice(0, 60),
      top: [...nonHome].sort((a, b) => b.inbound - a.inbound).slice(0, 15),
      fewOutbound: nonHome.filter((r) => r.outbound < 2).slice(0, 40),
      broken,
      truncated,
    } satisfies LinkReport;
  });
}
