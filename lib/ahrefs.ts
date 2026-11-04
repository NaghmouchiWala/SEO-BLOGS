// Ahrefs API v3 client (server-side only). Needs AHREFS_API_TOKEN in
// .env.local — an Ahrefs plan with API access. Without it every function
// returns { configured: false } and the UI shows a setup card instead.
//
// Results are cached on disk for 12h so reloading the dashboard never burns
// API units twice for the same domain.

import fs from "fs";
import path from "path";

const BASE = "https://api.ahrefs.com/v3";
const CACHE_FILE = path.join(process.cwd(), ".ahrefs-cache.json");
const TTL_MS = 12 * 3600 * 1000;

export type AhrefsDomainStats = {
  domain: string;
  fetchedAt: string;
  domainRating: number | null;
  ahrefsRank: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
  organicKeywordsTop3: number | null;
  trafficValueUsd: number | null;
  error?: string;
};

export type AhrefsResult<T> =
  | { configured: false }
  | { configured: true; ok: true; data: T }
  | { configured: true; ok: false; error: string };

export function ahrefsConfigured(): boolean {
  return Boolean(process.env.AHREFS_API_TOKEN);
}

type Cache = Record<string, { at: number; value: unknown }>;

function readCache(): Cache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(c: Cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(c));
  } catch {
    /* cache is best-effort */
  }
}

async function call<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = `${BASE}/${endpoint}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.AHREFS_API_TOKEN}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ahrefs ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

const today = () => new Date().toISOString().slice(0, 10);

export async function getDomainStats(domain: string, force = false): Promise<AhrefsResult<AhrefsDomainStats>> {
  if (!ahrefsConfigured()) return { configured: false };

  const cache = readCache();
  const hit = cache[domain];
  if (!force && hit && Date.now() - hit.at < TTL_MS) {
    return { configured: true, ok: true, data: hit.value as AhrefsDomainStats };
  }

  try {
    const date = today();
    const base = { target: domain, date, mode: "subdomains" };
    const [dr, bl, metrics] = await Promise.all([
      call<{ domain_rating?: { domain_rating: number; ahrefs_rank: number } }>("site-explorer/domain-rating", { target: domain, date }),
      call<{ metrics?: { live: number; all_time: number; live_refdomains: number; all_time_refdomains: number } }>(
        "site-explorer/backlinks-stats",
        base
      ),
      call<{ metrics?: { org_keywords: number; org_keywords_1_3: number; org_traffic: number; org_cost: number | null } }>(
        "site-explorer/metrics",
        base
      ),
    ]);

    const data: AhrefsDomainStats = {
      domain,
      fetchedAt: new Date().toISOString(),
      domainRating: dr.domain_rating?.domain_rating ?? null,
      ahrefsRank: dr.domain_rating?.ahrefs_rank ?? null,
      backlinks: bl.metrics?.live ?? null,
      referringDomains: bl.metrics?.live_refdomains ?? null,
      organicTraffic: metrics.metrics?.org_traffic ?? null,
      organicKeywords: metrics.metrics?.org_keywords ?? null,
      organicKeywordsTop3: metrics.metrics?.org_keywords_1_3 ?? null,
      trafficValueUsd: metrics.metrics?.org_cost != null ? Math.round(metrics.metrics.org_cost / 100) : null,
    };
    cache[domain] = { at: Date.now(), value: data };
    writeCache(cache);
    return { configured: true, ok: true, data };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type AhrefsKeyword = { keyword: string; position: number | null; volume: number | null; traffic: number | null; url: string | null };

export async function getTopKeywords(domain: string, limit = 25): Promise<AhrefsResult<AhrefsKeyword[]>> {
  if (!ahrefsConfigured()) return { configured: false };
  const key = `kw:${domain}:${limit}`;
  const cache = readCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.at < TTL_MS) return { configured: true, ok: true, data: hit.value as AhrefsKeyword[] };
  try {
    const res = await call<{ keywords?: { keyword: string; best_position: number; volume: number; sum_traffic: number; best_position_url: string }[] }>(
      "site-explorer/organic-keywords",
      {
        target: domain,
        mode: "subdomains",
        date: today(),
        select: "keyword,best_position,volume,sum_traffic,best_position_url",
        order_by: "sum_traffic:desc",
        limit: String(limit),
      }
    );
    const data = (res.keywords ?? []).map((k) => ({
      keyword: k.keyword,
      position: k.best_position ?? null,
      volume: k.volume ?? null,
      traffic: k.sum_traffic ?? null,
      url: k.best_position_url ?? null,
    }));
    cache[key] = { at: Date.now(), value: data };
    writeCache(cache);
    return { configured: true, ok: true, data };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
