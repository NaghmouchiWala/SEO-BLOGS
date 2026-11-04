import { getAllArticles } from "@/lib/articles";
import { locales } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

// /llms.txt — plain-text site summary for LLM crawlers (llmstxt.org format).
// Rebuilt on every deploy, so new articles appear automatically.
export function GET() {
  const lines: string[] = [
    "# Points.tn",
    "",
    "> Points.tn is a Tunisian blog on artificial intelligence, tech, appliances, SEO automation and digital business. Articles are published in French and English and are based on real, sourced news with a local angle.",
    "",
    "## About",
    "",
    "- Publisher: Points.tn (part of the Galylio network: https://galylio.com)",
    "- Languages: French (/fr), English (/en)",
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ];

  for (const locale of locales) {
    lines.push(locale === "fr" ? "## Articles (français)" : "## Articles (English)", "");
    for (const a of getAllArticles(locale).slice(0, 40)) {
      const desc = a.description ? `: ${a.description.replace(/\s+/g, " ").trim()}` : "";
      lines.push(`- [${a.title}](${SITE_URL}/${locale}/blog/${a.slug})${desc}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
