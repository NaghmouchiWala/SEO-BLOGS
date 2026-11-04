import { NextRequest, NextResponse } from "next/server";
import { getSite } from "@/lib/sites";
import { analyzeInternalLinks } from "@/lib/internalLinks";

export const maxDuration = 180;

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteKey: string }> }) {
  const { siteKey } = await ctx.params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const force = req.nextUrl.searchParams.get("refresh") === "1";
  try {
    return NextResponse.json(await analyzeInternalLinks(site.domain, force));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
