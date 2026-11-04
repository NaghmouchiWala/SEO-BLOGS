// Open PageRank — free domain authority (0-10 scale, comparable in spirit to
// Ahrefs DR) for any domain, ours or competitors'. Free API key:
// https://www.domcop.com/openpagerank/ → set OPEN_PAGERANK_API_KEY.

import { cached, HOUR } from "./cache";

export type AuthorityRow = { domain: string; pageRank: number | null; rank: number | null; status: number };

export function oprConfigured(): boolean {
  return Boolean(process.env.OPEN_PAGERANK_API_KEY);
}

export async function getAuthority(domains: string[], force = false): Promise<AuthorityRow[]> {
  const key = `opr:${[...domains].sort().join(",")}`;
  return cached(key, 24 * HOUR, force, async () => {
    const qs = domains.map((d, i) => `domains[${i}]=${encodeURIComponent(d)}`).join("&");
    const res = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?${qs}`, {
      headers: { "API-OPR": process.env.OPEN_PAGERANK_API_KEY! },
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Open PageRank ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const j = (await res.json()) as {
      response?: { domain: string; page_rank_decimal: number | null; rank: string | null; status_code: number }[];
    };
    return (j.response ?? []).map((r) => ({
      domain: r.domain,
      pageRank: r.page_rank_decimal ?? null,
      rank: r.rank ? Number(r.rank) : null,
      status: r.status_code,
    }));
  });
}
