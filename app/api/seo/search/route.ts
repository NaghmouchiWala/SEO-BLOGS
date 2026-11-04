import { NextRequest, NextResponse } from "next/server";
import { SITE_LIST } from "@/lib/sites";
import { gscConfigured, gscDetail, gscSummary } from "@/lib/gsc";
import { bingConfigured, bingQueries, bingSummary } from "@/lib/bing";
import { getAuthority, oprConfigured } from "@/lib/openPageRank";

export const maxDuration = 120;

const DOMAINS = [...SITE_LIST.map((s) => s.domain), "galylio.com"];

// Run sequentially in small batches so Google/Bing rate limits are respected.
async function inBatches<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const source = p.get("source");
  const force = p.get("refresh") === "1";
  const domain = p.get("domain");

  try {
    if (source === "status") {
      return NextResponse.json({ gsc: gscConfigured(), bing: bingConfigured(), authority: oprConfigured() });
    }

    if (source === "authority") {
      if (!oprConfigured()) return NextResponse.json({ configured: false });
      return NextResponse.json({ configured: true, rows: await getAuthority(DOMAINS, force) });
    }

    if (source === "google") {
      if (!gscConfigured()) return NextResponse.json({ configured: false });
      if (domain) {
        const dim = p.get("dimension") === "page" ? "page" : "query";
        return NextResponse.json({ configured: true, rows: await gscDetail(domain, dim) });
      }
      return NextResponse.json({ configured: true, rows: await inBatches(DOMAINS, 3, (d) => gscSummary(d, 28, force)) });
    }

    if (source === "bing") {
      if (!bingConfigured()) return NextResponse.json({ configured: false });
      if (domain) return NextResponse.json({ configured: true, rows: await bingQueries(domain) });
      return NextResponse.json({ configured: true, rows: await inBatches(DOMAINS, 2, (d) => bingSummary(d, 28, force)) });
    }

    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
