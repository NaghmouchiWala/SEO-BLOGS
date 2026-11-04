import { NextRequest, NextResponse } from "next/server";
import { getSite } from "@/lib/sites";
import { auditSite } from "@/lib/seoAudit";

export const maxDuration = 120;

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteKey: string }> }) {
  const { siteKey } = await ctx.params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const pages = Math.min(25, Math.max(1, Number(req.nextUrl.searchParams.get("pages") ?? 10)));
  const audit = await auditSite(site.domain, pages);
  return NextResponse.json(audit);
}
