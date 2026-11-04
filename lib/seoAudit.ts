// Live on-page SEO + GEO (AI-search readiness) audit. Fetches the public site
// over HTTPS, so it measures exactly what Google and AI crawlers see. No
// external API needed — Ahrefs data lives separately in lib/ahrefs.ts.

export type Severity = "error" | "warning" | "notice" | "pass";

export type Issue = {
  id: string;
  severity: Severity;
  category: "seo" | "geo" | "technical";
  title: string;
  detail?: string;
  url?: string;
};

export type PageAudit = {
  url: string;
  status: number;
  ms: number;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  h1Count: number;
  canonical: string | null;
  lang: string | null;
  wordCount: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  hasViewport: boolean;
  hasOg: boolean;
  jsonLdTypes: string[];
  hreflangCount: number;
  noindex: boolean;
  internalLinks: number;
  externalLinks: number;
  issues: Issue[];
};

export type GeoSignals = {
  llmsTxt: boolean;
  llmsFullTxt: boolean;
  robotsFound: boolean;
  robotsBlocksAllBots: boolean;
  aiBots: Record<string, "allowed" | "blocked" | "unspecified">;
  sitemapFound: boolean;
  sitemapUrlCount: number;
  structuredDataTypes: string[];
  hasOrganizationSchema: boolean;
  hasArticleSchema: boolean;
  hasFaqSchema: boolean;
};

export type SiteAudit = {
  domain: string;
  auditedAt: string;
  score: number; // 0-100 overall
  seoScore: number;
  geoScore: number;
  pages: PageAudit[];
  geo: GeoSignals;
  issues: Issue[]; // site-level + de-duplicated page issues
  counts: Record<Severity, number>;
};

const UA = "GalylioBlogsAudit/1.0 (+https://galylio.com)";
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended"];

async function fetchText(url: string, timeoutMs = 15000): Promise<{ status: number; text: string; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xml,text/plain,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const text = await res.text();
    return { status: res.status, text, ms: Date.now() - start };
  } catch {
    return { status: 0, text: "", ms: Date.now() - start };
  }
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function metaContent(html: string, attr: "name" | "property", value: string): string | null {
  const re = new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const c = tag.match(/content=["']([^"']*)["']/i)?.[1];
  return c != null ? decode(c) : null;
}

function jsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: unknown) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          const t = o["@type"];
          if (typeof t === "string") types.add(t);
          else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x));
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
    } catch {
      types.add("InvalidJSON");
    }
  }
  return [...types];
}

function auditPage(url: string, status: number, ms: number, html: string, host: string): PageAudit {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const titleText = title ? decode(title.replace(/\s+/g, " ")) : null;
  const description = metaContent(html, "name", "description");
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0].match(/href=["']([^"']*)["']/i)?.[1] ?? null;
  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null;
  const robotsMeta = metaContent(html, "name", "robots") ?? "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const wordCount = body.split(/\s+/).filter((w) => w.length > 1).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imagesMissingAlt = imgs.filter((t) => !/\balt=["'][^"']+["']/i.test(t)).length;
  let internal = 0;
  let external = 0;
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    const href = m[1];
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    if (href.startsWith("/") || href.includes(host)) internal++;
    else if (/^https?:/i.test(href)) external++;
  }
  const types = jsonLdTypes(html);
  const page: PageAudit = {
    url,
    status,
    ms,
    title: titleText,
    titleLength: titleText?.length ?? 0,
    description,
    descriptionLength: description?.length ?? 0,
    h1Count,
    canonical,
    lang,
    wordCount,
    imagesTotal: imgs.length,
    imagesMissingAlt,
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasOg: /<meta[^>]+property=["']og:title["']/i.test(html),
    jsonLdTypes: types,
    hreflangCount: (html.match(/<link[^>]+rel=["']alternate["'][^>]+hreflang=/gi) || []).length,
    noindex: /noindex/i.test(robotsMeta),
    internalLinks: internal,
    externalLinks: external,
    issues: [],
  };

  const add = (severity: Severity, id: string, title: string, detail?: string) =>
    page.issues.push({ id, severity, category: id.startsWith("geo") ? "geo" : "seo", title, detail, url });

  if (status >= 400 || status === 0) add("error", "http-error", `Page returned HTTP ${status || "no response"}`);
  if (!page.title) add("error", "title-missing", "Missing <title>");
  else if (page.titleLength < 25) add("warning", "title-short", "Title is too short", `${page.titleLength} chars (aim 30-60)`);
  else if (page.titleLength > 65) add("warning", "title-long", "Title is too long", `${page.titleLength} chars (aim 30-60)`);
  if (!page.description) add("error", "description-missing", "Missing meta description");
  else if (page.descriptionLength < 70) add("warning", "description-short", "Meta description is short", `${page.descriptionLength} chars (aim 120-160)`);
  else if (page.descriptionLength > 165) add("warning", "description-long", "Meta description is long", `${page.descriptionLength} chars (aim 120-160)`);
  if (h1Count === 0) add("error", "h1-missing", "No <h1> heading");
  else if (h1Count > 1) add("warning", "h1-multiple", "More than one <h1>", `${h1Count} found`);
  if (!page.canonical) add("warning", "canonical-missing", "No canonical link");
  if (!page.lang) add("warning", "lang-missing", "<html> has no lang attribute");
  if (!page.hasViewport) add("warning", "viewport-missing", "No mobile viewport meta tag");
  if (!page.hasOg) add("notice", "og-missing", "No Open Graph tags (poor social sharing previews)");
  if (page.noindex) add("warning", "noindex", "Page is set to noindex");
  if (imagesMissingAlt > 0) add("warning", "img-alt", `${imagesMissingAlt} image(s) without alt text`, `${imgs.length} images on page`);
  if (wordCount < 300 && status === 200) add("notice", "thin-content", "Thin content", `${wordCount} words`);
  if (ms > 2500) add("warning", "slow", "Slow server response", `${ms} ms`);
  if (types.length === 0) add("warning", "geo-no-schema", "No JSON-LD structured data", "AI and search engines cannot read entity facts");
  if (internal < 3) add("notice", "few-internal-links", "Very few internal links", `${internal} found`);
  return page;
}

function parseRobots(txt: string) {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const [k, ...rest] = line.split(":");
    const key = k.toLowerCase().trim();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && cur) {
      cur.rules.push({ allow: key === "allow", path: val });
      lastWasAgent = false;
    } else lastWasAgent = false;
  }
  return groups;
}

function botStatus(groups: ReturnType<typeof parseRobots>, bot: string): "allowed" | "blocked" | "unspecified" {
  const b = bot.toLowerCase();
  const specific = groups.find((g) => g.agents.includes(b));
  const group = specific ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return "unspecified";
  const blocksRoot = group.rules.some((r) => !r.allow && r.path === "/");
  const allowsRoot = group.rules.some((r) => r.allow && (r.path === "/" || r.path === ""));
  if (blocksRoot && !allowsRoot) return "blocked";
  return specific ? "allowed" : "unspecified";
}

async function sampleSitemapUrls(base: string, limit: number): Promise<{ found: boolean; total: number; urls: string[] }> {
  const candidates = [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`];
  for (const c of candidates) {
    const r = await fetchText(c);
    if (r.status !== 200 || !r.text.includes("<")) continue;
    let locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
    // Sitemap index: follow the first child sitemaps.
    if (/<sitemapindex/i.test(r.text)) {
      const children: string[] = [];
      for (const child of locs.slice(0, 3)) {
        const cr = await fetchText(child);
        children.push(...[...cr.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1])));
      }
      locs = children;
    }
    const pages = locs.filter((u) => !/\.(xml|jpg|jpeg|png|webp|gif|pdf)(\?|$)/i.test(u));
    // Newest-looking first: dashboard-generated slugs sit at the end of most sitemaps.
    const picked = [...pages.slice(-Math.ceil(limit / 2)), ...pages.slice(0, Math.floor(limit / 2))];
    return { found: true, total: pages.length, urls: [...new Set(picked)].slice(0, limit) };
  }
  return { found: false, total: 0, urls: [] };
}

function scoreOf(issues: Issue[], category?: Issue["category"]): number {
  const relevant = category ? issues.filter((i) => i.category === category) : issues;
  const penalty = relevant.reduce((s, i) => s + (i.severity === "error" ? 12 : i.severity === "warning" ? 5 : i.severity === "notice" ? 1.5 : 0), 0);
  return Math.max(0, Math.round(100 - penalty));
}

export async function auditSite(domain: string, maxPages = 10): Promise<SiteAudit> {
  const base = `https://${domain}`;
  const [home, robots, llms, llmsFull, sitemap] = await Promise.all([
    fetchText(base + "/"),
    fetchText(base + "/robots.txt"),
    fetchText(base + "/llms.txt"),
    fetchText(base + "/llms-full.txt"),
    sampleSitemapUrls(base, maxPages),
  ]);

  const pageUrls = [base + "/", ...sitemap.urls.filter((u) => u.replace(/\/$/, "") !== base)].slice(0, maxPages);
  const pages: PageAudit[] = [];
  pages.push(auditPage(pageUrls[0], home.status, home.ms, home.text, domain));
  const rest = await Promise.all(
    pageUrls.slice(1).map(async (u) => {
      const r = await fetchText(u);
      return auditPage(u, r.status, r.ms, r.text, domain);
    })
  );
  pages.push(...rest);

  const groups = robots.status === 200 ? parseRobots(robots.text) : [];
  const aiBots: GeoSignals["aiBots"] = {};
  for (const b of AI_BOTS) aiBots[b] = botStatus(groups, b);
  const allTypes = [...new Set(pages.flatMap((p) => p.jsonLdTypes))];
  const geo: GeoSignals = {
    llmsTxt: llms.status === 200 && llms.text.length > 20 && !/<html/i.test(llms.text),
    llmsFullTxt: llmsFull.status === 200 && llmsFull.text.length > 20 && !/<html/i.test(llmsFull.text),
    robotsFound: robots.status === 200,
    robotsBlocksAllBots: botStatus(groups, "*") === "blocked",
    aiBots,
    sitemapFound: sitemap.found,
    sitemapUrlCount: sitemap.total,
    structuredDataTypes: allTypes,
    hasOrganizationSchema: allTypes.some((t) => /Organization|LocalBusiness|WebSite/i.test(t)),
    hasArticleSchema: allTypes.some((t) => /Article|BlogPosting|NewsArticle/i.test(t)),
    hasFaqSchema: allTypes.some((t) => /FAQPage|HowTo/i.test(t)),
  };

  const site: Issue[] = [];
  const add = (severity: Severity, category: Issue["category"], id: string, title: string, detail?: string) =>
    site.push({ id, severity, category, title, detail });

  if (home.status === 0) add("error", "technical", "site-down", "Site did not respond over HTTPS");
  if (!geo.robotsFound) add("warning", "technical", "robots-missing", "robots.txt not found");
  if (geo.robotsBlocksAllBots) add("error", "technical", "robots-blocks-all", "robots.txt blocks all crawlers (Disallow: /)");
  if (!geo.sitemapFound) add("error", "technical", "sitemap-missing", "sitemap.xml not found");
  if (!geo.llmsTxt) add("warning", "geo", "geo-llms-txt", "No llms.txt", "A plain-text site summary helps LLM crawlers understand and cite you");
  const blocked = Object.entries(aiBots).filter(([, v]) => v === "blocked").map(([k]) => k);
  if (blocked.length) add("warning", "geo", "geo-ai-blocked", "AI crawlers blocked in robots.txt", blocked.join(", "));
  if (!geo.hasOrganizationSchema) add("warning", "geo", "geo-org-schema", "No Organization / WebSite schema", "Entity facts are what AI answers cite");
  if (!geo.hasArticleSchema) add("warning", "geo", "geo-article-schema", "No Article / BlogPosting schema on sampled pages");
  if (!geo.hasFaqSchema) add("notice", "geo", "geo-faq-schema", "No FAQPage / HowTo schema", "Q&A markup is heavily reused by AI answer engines");

  // De-duplicate page issues by id, keeping a count + example URLs.
  const grouped = new Map<string, Issue & { n: number; urls: string[] }>();
  for (const p of pages) {
    for (const i of p.issues) {
      const g = grouped.get(i.id);
      if (g) {
        g.n++;
        if (g.urls.length < 3) g.urls.push(i.url!);
      } else grouped.set(i.id, { ...i, n: 1, urls: [i.url!] });
    }
  }
  const pageIssues: Issue[] = [...grouped.values()].map((g) => ({
    id: g.id,
    severity: g.severity,
    category: g.category,
    title: g.n > 1 ? `${g.title} (${g.n} of ${pages.length} pages)` : g.title,
    detail: g.detail,
    url: g.urls[0],
  }));

  const issues = [...site, ...pageIssues].sort((a, b) => order(a.severity) - order(b.severity));
  const counts: SiteAudit["counts"] = { error: 0, warning: 0, notice: 0, pass: 0 };
  for (const i of issues) counts[i.severity]++;

  return {
    domain,
    auditedAt: new Date().toISOString(),
    score: scoreOf(issues),
    seoScore: scoreOf(issues.filter((i) => i.category !== "geo")),
    geoScore: scoreOf(issues, "geo"),
    pages,
    geo,
    issues,
    counts,
  };
}

function order(s: Severity) {
  return s === "error" ? 0 : s === "warning" ? 1 : s === "notice" ? 2 : 3;
}
