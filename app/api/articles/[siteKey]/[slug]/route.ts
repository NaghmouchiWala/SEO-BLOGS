import { NextRequest, NextResponse } from "next/server";
import { getSite } from "@/lib/sites";
import {
  getPointsArticle,
  updatePointsArticle,
  markPointsReviewed,
} from "@/lib/pointsArticles";
import {
  getStaticArticle,
  updateStaticArticleBody,
  markStaticReviewed,
  setStaticArticlePublished,
} from "@/lib/staticArticles";

function parsePointsId(id: string): { locale: "fr" | "en"; slug: string } | null {
  const [locale, ...rest] = id.split(":");
  if (locale !== "fr" && locale !== "en") return null;
  return { locale, slug: rest.join(":") };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteKey: string; slug: string }> }
) {
  const { siteKey, slug: id } = await params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

  if (site.kind === "points") {
    const parsed = parsePointsId(decodeURIComponent(id));
    if (!parsed) return NextResponse.json({ error: "Invalid article id" }, { status: 400 });
    const article = getPointsArticle(parsed.locale, parsed.slug);
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ article, editableField: "body" });
  }

  const article = getStaticArticle(siteKey, decodeURIComponent(id));
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article, editableField: "bodyHtml" });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteKey: string; slug: string }> }
) {
  const { siteKey, slug: id } = await params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

  const body = await req.json();
  const action = body.action as string;

  try {
    if (site.kind === "points") {
      const parsed = parsePointsId(decodeURIComponent(id));
      if (!parsed) return NextResponse.json({ error: "Invalid article id" }, { status: 400 });

      if (action === "update") {
        updatePointsArticle(parsed.locale, parsed.slug, {
          title: body.title,
          description: body.description,
          body: body.body,
          category: body.category,
          tags: body.tags,
        });
      } else if (action === "review") {
        markPointsReviewed(parsed.locale, parsed.slug, Boolean(body.reviewed));
      } else {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    const slug = decodeURIComponent(id);
    if (action === "update") {
      updateStaticArticleBody(siteKey, slug, { title: body.title, bodyHtml: body.bodyHtml });
    } else if (action === "review") {
      markStaticReviewed(siteKey, slug, Boolean(body.reviewed));
    } else if (action === "publish") {
      setStaticArticlePublished(siteKey, slug, Boolean(body.published));
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
