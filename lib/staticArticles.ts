import fs from "fs";
import path from "path";
import { getSite, type SiteConfig } from "./sites";

export type StaticArticle = {
  siteKey: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  date: string;
  url: string;
  reviewed: boolean;
  published: boolean; // whether it's still linked from homepage/category listing
  filePath: string;
};

function pagesDir(site: SiteConfig) {
  return path.join(site.siteRoot!, "pages");
}

function categoryIndexPath(site: SiteConfig) {
  return path.join(site.siteRoot!, "pages", "category", site.categorySlug!, "index.html");
}

function homepagePath(site: SiteConfig) {
  return path.join(site.siteRoot!, "index.html");
}

function reviewedLogPath(site: SiteConfig) {
  return path.join(site.siteRoot!, ".dashboard-reviewed.json");
}

function readReviewedSet(site: SiteConfig): Set<string> {
  const p = reviewedLogPath(site);
  if (!fs.existsSync(p)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(p, "utf8")));
  } catch {
    return new Set();
  }
}

export function markStaticReviewed(siteKey: string, slug: string, reviewed: boolean) {
  const site = getSite(siteKey);
  if (!site) throw new Error("Unknown site");
  const set = readReviewedSet(site);
  if (reviewed) set.add(slug);
  else set.delete(slug);
  fs.writeFileSync(reviewedLogPath(site), JSON.stringify([...set], null, 2), "utf8");
}

// Auto-generated post folders are named after their slug and contain a
// .dashboard-meta.json written by the generator-adjacent dashboard code
// the first time the dashboard sees them (lazily backfilled from the HTML
// itself on first read, so this works for posts generated before the
// dashboard existed too).
function metaPath(site: SiteConfig, slug: string) {
  return path.join(pagesDir(site), slug, ".dashboard-meta.json");
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return m ? m[1] : "";
}

function extractExcerpt(html: string): string {
  const m = html.match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&") : "";
}

// Extract the article body between the known entry-content opening and the
// GO2CODE_ARTICLE_END marker, tolerant of each theme's exact whitespace —
// same markers every generator already relies on.
function extractBody(html: string): string {
  const endIdx = html.indexOf("<!-- GO2CODE_ARTICLE_END -->");
  if (endIdx === -1) return "";
  const beforeEnd = html.slice(0, endIdx);
  const startIdx = beforeEnd.lastIndexOf('<div class="entry-content');
  if (startIdx === -1) return "";
  const openTagEnd = beforeEnd.indexOf(">", startIdx) + 1;
  return html.slice(openTagEnd, endIdx).trim();
}

function isPublished(site: SiteConfig, slug: string): boolean {
  const homepage = fs.readFileSync(homepagePath(site), "utf8");
  return homepage.includes(`/pages/${slug}/`);
}

// Only folders that were auto-generated (tracked via a marker file written
// at generation time, or — for posts generated before the dashboard
// existed — any post folder currently linked from the syndicated
// (go2code-managed) block) are listed, not the site's original ~130-170
// pre-existing WordPress-export posts.
function listGeneratedSlugs(site: SiteConfig): string[] {
  const homepage = fs.readFileSync(homepagePath(site), "utf8");
  const start = homepage.indexOf("<!-- GO2CODE_SYNDICATED_START -->");
  const end = homepage.indexOf("<!-- GO2CODE_SYNDICATED_END -->");
  const block = start !== -1 && end !== -1 ? homepage.slice(start, end) : "";
  const slugs = new Set(
    [...block.matchAll(/\/pages\/([a-z0-9-]+)\//g)].map((m) => m[1])
  );

  // Also include any post folder with a .dashboard-meta.json (covers posts
  // unpublished from the homepage strip, which would otherwise disappear
  // from this list entirely).
  const dir = pagesDir(site);
  if (fs.existsSync(dir)) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (fs.existsSync(metaPath(site, entry.name))) slugs.add(entry.name);
    }
  }
  return [...slugs];
}

export function listStaticArticles(siteKey: string): StaticArticle[] {
  const site = getSite(siteKey);
  if (!site || site.kind !== "static") return [];
  const reviewed = readReviewedSet(site);
  const slugs = listGeneratedSlugs(site);

  const articles: StaticArticle[] = [];
  for (const slug of slugs) {
    const postDir = path.join(pagesDir(site), slug);
    const indexPath = path.join(postDir, "index.html");
    if (!fs.existsSync(indexPath)) continue;
    const html = fs.readFileSync(indexPath, "utf8");

    let date = "";
    try {
      date = fs.statSync(indexPath).mtime.toISOString();
    } catch {
      // ignore
    }
    if (fs.existsSync(metaPath(site, slug))) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath(site, slug), "utf8"));
        if (meta.date) date = meta.date;
      } catch {
        // ignore
      }
    }

    articles.push({
      siteKey,
      slug,
      title: extractTitle(html),
      excerpt: extractExcerpt(html),
      bodyHtml: extractBody(html),
      date,
      url: `https://${site.domain}/pages/${slug}/`,
      reviewed: reviewed.has(slug),
      published: isPublished(site, slug),
      filePath: indexPath,
    });
  }

  articles.sort((a, b) => (a.date < b.date ? 1 : -1));
  return articles;
}

export function getStaticArticle(siteKey: string, slug: string): StaticArticle | null {
  const site = getSite(siteKey);
  if (!site || site.kind !== "static") return null;
  const indexPath = path.join(pagesDir(site), slug, "index.html");
  if (!fs.existsSync(indexPath)) return null;
  const html = fs.readFileSync(indexPath, "utf8");
  const reviewed = readReviewedSet(site);

  let date = "";
  try {
    date = fs.statSync(indexPath).mtime.toISOString();
  } catch {
    // ignore
  }

  return {
    siteKey,
    slug,
    title: extractTitle(html),
    excerpt: extractExcerpt(html),
    bodyHtml: extractBody(html),
    date,
    url: `https://${site.domain}/pages/${slug}/`,
    reviewed: reviewed.has(slug),
    published: isPublished(site, slug),
    filePath: indexPath,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

// Replaces title (both <title> and <h1>) and the article body, leaving
// every other part of the page (meta tags, JSON-LD, header/nav/footer,
// theme chrome) untouched. Does NOT touch the homepage/category listings —
// those keep showing the OLD title/excerpt until the next generation run,
// which is an acceptable, clearly-labelled limitation (the dashboard UI
// says so) rather than trying to safely reverse-engineer every theme's
// listing markup for a live patch.
export function updateStaticArticleBody(
  siteKey: string,
  slug: string,
  updates: { title?: string; bodyHtml?: string }
) {
  const site = getSite(siteKey);
  if (!site) throw new Error("Unknown site");
  const indexPath = path.join(pagesDir(site), slug, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error("Article not found");
  let html = fs.readFileSync(indexPath, "utf8");

  if (updates.title !== undefined) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(updates.title)}</title>`);
    // Any <h1> that isn't the site's own site-title/branding heading gets
    // the new title — matches on being outside a "site-title" class, same
    // reasoning the generators use per theme.
    html = html.replace(
      /(<h1 class="(?:entry-title|page-title|wp-block-post-title[^"]*)">)[^<]*(<\/h1>)/,
      `$1${escapeHtml(updates.title)}$2`
    );
  }

  if (updates.bodyHtml !== undefined) {
    const endMarker = "<!-- GO2CODE_ARTICLE_END -->";
    const endIdx = html.indexOf(endMarker);
    if (endIdx === -1) throw new Error("Could not find article end marker in this post's HTML");
    const beforeEnd = html.slice(0, endIdx);
    const startIdx = beforeEnd.lastIndexOf('<div class="entry-content');
    if (startIdx === -1) throw new Error("Could not find article body start in this post's HTML");
    const openTagEnd = beforeEnd.indexOf(">", startIdx) + 1;
    html = html.slice(0, openTagEnd) + "\n" + updates.bodyHtml.trim() + "\n" + html.slice(endIdx);
  }

  fs.writeFileSync(indexPath, html, "utf8");

  // Record a dashboard-meta marker so this post stays listed even if it
  // later gets unpublished from the homepage strip.
  const metaFile = metaPath(site, slug);
  const existing = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
  fs.writeFileSync(
    metaFile,
    JSON.stringify({ ...existing, lastEditedAt: new Date().toISOString() }, null, 2),
    "utf8"
  );
}

// Soft-unpublish: removes the post's <li>/<article> item from the
// homepage's featured strip and the category archive's syndicated block,
// WITHOUT deleting the post folder/page itself — the URL keeps resolving
// (avoids a fresh 404 on anything already indexed/linked), it's just no
// longer discoverable from site navigation. Re-publish re-inserts it at
// the top of both lists. "sento" theme posts use masonry math instead of
// simple syndicated-block strings — those aren't un/re-publishable from
// here (flagged in the API layer) since reversing the position-shift
// safely needs the same care the generator's own masonry code has.
function readMeta(site: SiteConfig, slug: string): Record<string, unknown> {
  const metaFile = metaPath(site, slug);
  if (!fs.existsSync(metaFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaFile, "utf8"));
  } catch {
    return {};
  }
}

function writeMeta(site: SiteConfig, slug: string, patch: Record<string, unknown>) {
  const metaFile = metaPath(site, slug);
  const existing = readMeta(site, slug);
  fs.mkdirSync(path.dirname(metaFile), { recursive: true });
  fs.writeFileSync(metaFile, JSON.stringify({ ...existing, ...patch }, null, 2), "utf8");
}

const ITEM_REGEXES = (slug: string) => [
  new RegExp(`<li class="wp-block-post[\\s\\S]*?/pages/${slug}/[\\s\\S]*?<\\/li>`),
  new RegExp(`<article class="[^"]*go2code-managed-post"[\\s\\S]*?/pages/${slug}/[\\s\\S]*?<\\/article>`),
  new RegExp(`<div id="post-go2code-\\d+" class="post go2code-managed-post">[\\s\\S]*?/pages/${slug}/[\\s\\S]*?<\\/div>(?=\\s*(?:<div id="post-go2code-|<!-- GO2CODE_SYNDICATED_END))`),
];

// Soft-unpublish removes the post's <li>/<article> item from the homepage's
// featured strip and the category archive's syndicated block, WITHOUT
// deleting the post folder/page — the URL keeps resolving (no fresh 404 on
// anything already indexed/linked), it's just no longer discoverable from
// site navigation. The exact removed snippet is saved per-file in the meta
// marker so re-publish can re-insert precisely what was taken out, rather
// than reconstructing theme-specific markup from scratch. "sento" theme
// posts use masonry position math instead of simple syndicated-block
// strings — those aren't un/re-publishable from here (the generator's own
// masonry code is the only safe way to shift positions).
export function setStaticArticlePublished(siteKey: string, slug: string, published: boolean) {
  const site = getSite(siteKey);
  if (!site) throw new Error("Unknown site");
  if (site.themeFamily === "sento") {
    throw new Error("This site's masonry layout doesn't support publish/unpublish from the dashboard yet.");
  }

  const files: Array<["homepage" | "category", string]> = [
    ["homepage", homepagePath(site)],
    ["category", categoryIndexPath(site)],
  ];

  const meta = readMeta(site, slug);
  const removedSnippets = (meta.removedSnippets as Record<string, string>) ?? {};

  for (const [fileKind, file] of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    const start = html.indexOf("<!-- GO2CODE_SYNDICATED_START -->");
    const end = html.indexOf("<!-- GO2CODE_SYNDICATED_END -->");
    if (start === -1 || end === -1) continue;

    if (!published) {
      const before = html.slice(0, start);
      const block = html.slice(start, end);
      const after = html.slice(end);

      let newBlock = block;
      let removed: string | null = null;
      for (const re of ITEM_REGEXES(slug)) {
        const match = newBlock.match(re);
        if (match) {
          removed = match[0];
          newBlock = newBlock.replace(re, "");
          break;
        }
      }
      if (removed) removedSnippets[fileKind] = removed;
      html = before + newBlock + after;
    } else {
      const snippet = removedSnippets[fileKind];
      if (snippet && !html.includes(snippet)) {
        html = html.replace(
          "<!-- GO2CODE_SYNDICATED_START -->",
          `<!-- GO2CODE_SYNDICATED_START -->\n${snippet}`
        );
        delete removedSnippets[fileKind];
      }
    }

    fs.writeFileSync(file, html, "utf8");
  }

  writeMeta(site, slug, {
    removedSnippets,
    ...(published ? { unpublishedAt: null } : { unpublishedAt: new Date().toISOString() }),
  });
}
