import { NextRequest, NextResponse } from "next/server";
import { getSite } from "@/lib/sites";
import { listPointsArticles } from "@/lib/pointsArticles";
import { listStaticArticles } from "@/lib/staticArticles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteKey: string }> }
) {
  const { siteKey } = await params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

  if (site.kind === "points") {
    const articles = listPointsArticles().map((a) => ({
      id: `${a.locale}:${a.slug}`,
      locale: a.locale,
      slug: a.slug,
      title: a.title,
      description: a.description,
      date: a.date,
      category: a.category,
      tags: a.tags,
      url: a.url,
      reviewed: a.reviewed,
      published: true,
    }));
    return NextResponse.json({ articles });
  }

  const articles = listStaticArticles(siteKey).map((a) => ({
    id: a.slug,
    locale: null,
    slug: a.slug,
    title: a.title,
    description: a.excerpt,
    date: a.date,
    category: null,
    tags: [],
    url: a.url,
    reviewed: a.reviewed,
    published: a.published,
  }));
  return NextResponse.json({ articles });
}
