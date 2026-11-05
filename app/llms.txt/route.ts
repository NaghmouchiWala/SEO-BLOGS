import { getAllArticles } from "@/lib/articles";
import { locales } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

// /llms.txt — plain-text site summary for LLM crawlers (llmstxt.org format).
// Rebuilt on every deploy, so new articles appear automatically.
export function GET() {
  const lines: string[] = [
    "# Points.tn",
    "",
    "> Points.tn is a Tunisian online news outlet covering national news, international news, sport, culture, regions and tech. Articles are published in French and English; each one is based on a real story and cites its source.",
    "",
    "## About",
    "",
    "- Publisher: Points.tn (part of the Galylio network: https://galylio.com)",
    "- Languages: French (/fr), English (/en)",
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    `- FAQ: ${SITE_URL}/fr/faq (français), ${SITE_URL}/en/faq (English)`,
    `- About and editorial policy: ${SITE_URL}/fr/about`,
    `- Directory of the AI ecosystem in Tunisia: ${SITE_URL}/en/ai-ecosystem (français: ${SITE_URL}/fr/ai-ecosystem)`,
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
