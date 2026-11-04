// Google Search Console (Search Analytics API) via a service account.
// Setup: create a service account, download its JSON key to the server, set
// GSC_SERVICE_ACCOUNT_FILE=/path/to/key.json, then add the service account's
// email as a (Restricted/Full) user on every Search Console property.

import fs from "fs";
import { SignJWT, importPKCS8 } from "jose";
import { cached, HOUR } from "./cache";

export type SearchSummary = {
  domain: string;
  property: string | null;
  clicks: number;
  impressions: number;
  ctr: number; // 0-1
  position: number;
  days: number;
  error?: string;
};

export type SearchRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };

export function gscConfigured(): boolean {
  const f = process.env.GSC_SERVICE_ACCOUNT_FILE;
  return Boolean(f && fs.existsSync(f));
}

let tokenCache: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60000) return tokenCache.token;
  const creds = JSON.parse(fs.readFileSync(process.env.GSC_SERVICE_ACCOUNT_FILE!, "utf8"));
  const key = await importPKCS8(creds.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/webmasters.readonly" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(creds.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Google auth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

async function query(property: string, body: Record<string, unknown>) {
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const err = new Error(`GSC ${res.status}: ${(await res.text()).slice(0, 160)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as { rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
}

// Domain property first (sc-domain:), then URL-prefix variants.
async function withProperty<T>(domain: string, fn: (property: string) => Promise<T>): Promise<{ property: string; value: T }> {
  const candidates = [`sc-domain:${domain}`, `https://${domain}/`, `https://www.${domain}/`];
  let last: unknown;
  for (const p of candidates) {
    try {
      return { property: p, value: await fn(p) };
    } catch (e) {
      last = e;
      const status = (e as { status?: number }).status;
      if (status !== 403 && status !== 404) throw e;
    }
  }
  throw last instanceof Error ? last : new Error("No accessible Search Console property");
}

function range(days: number) {
  // GSC data lags ~2 days.
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { startDate: isoDay(start), endDate: isoDay(end) };
}

export async function gscSummary(domain: string, days = 28, force = false): Promise<SearchSummary> {
  try {
    return await cached(`gsc:sum:${domain}:${days}`, 6 * HOUR, force, async () => {
      const { property, value } = await withProperty(domain, (p) => query(p, { ...range(days), rowLimit: 1 }));
      const r = value.rows?.[0];
      // No dimensions => one aggregate row.
      return {
        domain,
        property,
        clicks: r?.clicks ?? 0,
        impressions: r?.impressions ?? 0,
        ctr: r?.ctr ?? 0,
        position: r?.position ?? 0,
        days,
      } satisfies SearchSummary;
    });
  } catch (e) {
    return { domain, property: null, clicks: 0, impressions: 0, ctr: 0, position: 0, days, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function gscDetail(domain: string, dimension: "query" | "page", days = 28, limit = 25): Promise<SearchRow[]> {
  return cached(`gsc:${dimension}:${domain}:${days}:${limit}`, 6 * HOUR, false, async () => {
    const { value } = await withProperty(domain, (p) => query(p, { ...range(days), dimensions: [dimension], rowLimit: limit }));
    return (value.rows ?? []).map((r) => ({ key: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  });
}
