// Bing Webmaster Tools API. Setup: in Bing Webmaster Tools → Settings → API
// access, generate an API key, then set BING_WEBMASTER_API_KEY. Each site must
// be added/verified in Bing Webmaster Tools under the same account.

import { cached, HOUR } from "./cache";
import type { SearchRow, SearchSummary } from "./gsc";

const BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export function bingConfigured(): boolean {
  return Boolean(process.env.BING_WEBMASTER_API_KEY);
}

async function call<T>(method: string, siteUrl: string): Promise<T[]> {
  const url = `${BASE}/${method}?apikey=${encodeURIComponent(process.env.BING_WEBMASTER_API_KEY!)}&siteUrl=${encodeURIComponent(siteUrl)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bing ${res.status}: ${text.slice(0, 160)}`);
  const j = JSON.parse(text) as { d?: T[]; Message?: string };
  if (!j.d) throw new Error(`Bing: ${j.Message ?? "unexpected response"}`);
  return j.d;
}

// The same site can be registered as https://x/ or https://www.x/.
async function withSite<T>(domain: string, fn: (siteUrl: string) => Promise<T>): Promise<T> {
  let last: unknown;
  for (const s of [`https://${domain}/`, `https://www.${domain}/`]) {
    try {
      return await fn(s);
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error("Site not found in Bing Webmaster Tools");
}

export async function bingSummary(domain: string, days = 28, force = false): Promise<SearchSummary> {
  try {
    return await cached(`bing:sum:${domain}:${days}`, 6 * HOUR, force, async () => {
      const stats = await withSite(domain, (s) => call<{ Date: string; Clicks: number; Impressions: number }>("GetRankAndTrafficStats", s));
      const cutoff = Date.now() - days * 86400000;
      const recent = stats.filter((r) => {
        const ms = Number(r.Date.match(/\d+/)?.[0] ?? 0);
        return ms >= cutoff;
      });
      const clicks = recent.reduce((s, r) => s + r.Clicks, 0);
      const impressions = recent.reduce((s, r) => s + r.Impressions, 0);
      return { domain, property: domain, clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: 0, days } satisfies SearchSummary;
    });
  } catch (e) {
    return { domain, property: null, clicks: 0, impressions: 0, ctr: 0, position: 0, days, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function bingQueries(domain: string, limit = 25): Promise<SearchRow[]> {
  return cached(`bing:q:${domain}:${limit}`, 6 * HOUR, false, async () => {
    const rows = await withSite(domain, (s) =>
      call<{ Query: string; Clicks: number; Impressions: number; AvgImpressionPosition: number }>("GetQueryStats", s)
    );
    return rows
      .sort((a, b) => b.Impressions - a.Impressions)
      .slice(0, limit)
      .map((r) => ({
        key: r.Query,
        clicks: r.Clicks,
        impressions: r.Impressions,
        ctr: r.Impressions ? r.Clicks / r.Impressions : 0,
        position: r.AvgImpressionPosition,
      }));
  });
}
