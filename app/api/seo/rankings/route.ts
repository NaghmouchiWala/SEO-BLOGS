import { NextRequest, NextResponse } from "next/server";
import { SITE_LIST } from "@/lib/sites";
import { ahrefsConfigured, getDomainStats, getTopKeywords } from "@/lib/ahrefs";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!ahrefsConfigured()) return NextResponse.json({ configured: false });
  const force = req.nextUrl.searchParams.get("refresh") === "1";
  const domainParam = req.nextUrl.searchParams.get("keywords");

  if (domainParam) {
    const r = await getTopKeywords(domainParam, 25);
    return NextResponse.json(r);
  }

  const results = await Promise.all(
    [...SITE_LIST.map((s) => s.domain), "galylio.com"].map(async (d) => {
      const r = await getDomainStats(d, force);
      return r.configured && r.ok ? r.data : { domain: d, error: r.configured ? r.error : "not configured" };
    })
  );
  return NextResponse.json({ configured: true, rows: results });
}
