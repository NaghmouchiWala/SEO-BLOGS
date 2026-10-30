import { NextResponse } from "next/server";
import { SITE_LIST } from "@/lib/sites";
import { getCronHealth } from "@/lib/cronHealth";
import { listPointsArticles } from "@/lib/pointsArticles";
import { listStaticArticles } from "@/lib/staticArticles";

export async function GET() {
  const sites = SITE_LIST.map((site) => {
    const health = getCronHealth(site.key);
    let articleCount = 0;
    let unreviewedCount = 0;

    try {
      if (site.kind === "points") {
        const articles = listPointsArticles();
        articleCount = articles.length;
        unreviewedCount = articles.filter((a) => !a.reviewed).length;
      } else {
        const articles = listStaticArticles(site.key);
        articleCount = articles.length;
        unreviewedCount = articles.filter((a) => !a.reviewed).length;
      }
    } catch (err) {
      console.error(`Failed to list articles for ${site.key}:`, err);
    }

    return {
      key: site.key,
      domain: site.domain,
      displayName: site.displayName,
      kind: site.kind,
      articleCount,
      unreviewedCount,
      cronHealth: health,
    };
  });

  return NextResponse.json({ sites });
}
