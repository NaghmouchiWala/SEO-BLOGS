#!/usr/bin/env node
// Generates one new FR+EN article pair via the Groq API, writes them under
// content/{fr,en}/, commits, and pushes to origin main. The existing
// deploy-points-tn-blog.sh cron (every 15 min) picks the push up, builds,
// and restarts the site — this script does not touch the build or PM2.
//
// The article is grounded in a real, recent story pulled from tech/gadget/
// appliance RSS feeds (TechCrunch, The Verge, Ars Technica, Wired, CNET
// Tech, CNET Home), not an invented topic — same approach as the satellite
// sites' generator at /home/ubuntu/multisite-generator/generate-article.mjs.
//
// Run manually:   node scripts/generate-article.mjs
// Run via cron:    see /home/ubuntu/generate-points-tn-article.sh
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_FR = path.join(REPO_ROOT, "content", "fr");
const CONTENT_EN = path.join(REPO_ROOT, "content", "en");
const USED_SOURCES_PATH = path.join(REPO_ROOT, "scripts", "used-sources.json");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY is not set");
  process.exit(1);
}

const MODEL = "openai/gpt-oss-120b";

// RSS 2.0 feeds (<item>/<title>/<link>/<pubDate>/<description>).
const RSS_FEEDS = [
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://feeds.arstechnica.com/arstechnica/index",
  "https://www.wired.com/feed/rss",
];
// Atom feeds (<entry>/<title>/<link href>/<published>/<summary>) — CNET's
// Tech and Home sections, the closest real-news match to "informatique" and
// "électroménager": appliance reviews, smart-home gadgets, computer/phone news.
const ATOM_FEEDS = [
  "https://www.cnet.com/rss/tech/",
  "https://www.cnet.com/rss/home/",
];

// One category per generated article, matched 1:1 with the buckets
// lib/categories.ts knows how to map to a fallback SVG cover.
const CATEGORIES = [
  { fr: "Intelligence Artificielle", en: "Artificial Intelligence" },
  { fr: "SEO & E-commerce", en: "SEO & E-commerce" },
  { fr: "Business & Innovation", en: "Business & Innovation" },
  { fr: "E-commerce & Bons plans", en: "E-commerce & Deals" },
  { fr: "Électroménager & High-Tech", en: "Appliances & Gadgets" },
];

// Rotated through articles so no single project gets linked every time.
// Each entry is a markdown link exactly as it should appear inline.
const PROJECT_LINKS = [
  { name: "1111.tn", fr: "[1111.tn](https://1111.tn)", en: "[1111.tn](https://1111.tn)", about_fr: "la plateforme tunisienne de comparaison et de prédiction de prix", about_en: "the Tunisian price comparison and prediction platform" },
  { name: "Tdiscount.tn", fr: "[Tdiscount.tn](https://tdiscount.tn)", en: "[Tdiscount.tn](https://tdiscount.tn)", about_fr: "une plateforme de shopping en ligne à prix réduits", about_en: "a discount online shopping platform" },
  { name: "Galylio", fr: "[Galylio](https://galylio.com)", en: "[Galylio](https://galylio.com)", about_fr: "une entreprise tunisienne d'automatisation et d'IA sur mesure", about_en: "a Tunisian AI automation and custom AI company" },
  { name: "go2code", fr: "[go2code](https://go2code.tn)", en: "[go2code](https://go2code.tn)", about_fr: "un centre de formation tech basé en Tunisie", about_en: "a Tunisia-based tech training center" },
  { name: "geo4seo", fr: "[geo4seo](https://geo4seo.com)", en: "[geo4seo](https://geo4seo.com)", about_fr: "un outil d'automatisation SEO pour catalogues produits", about_en: "an SEO automation tool for product catalogs" },
];

function readExistingSlugs() {
  const slugs = new Set();
  for (const dir of [CONTENT_FR, CONTENT_EN]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(".mdx")) slugs.add(f.replace(/\.mdx$/, ""));
    }
  }
  return slugs;
}

function readExistingTitles() {
  const titles = [];
  if (!fs.existsSync(CONTENT_FR)) return titles;
  for (const f of fs.readdirSync(CONTENT_FR)) {
    if (!f.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(CONTENT_FR, f), "utf8");
    const m = raw.match(/^title:\s*"([^"]+)"/m);
    if (m) titles.push(m[1]);
  }
  return titles;
}

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70)
    .replace(/-$/, "");
}

function readUsedSources() {
  if (!fs.existsSync(USED_SOURCES_PATH)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(USED_SOURCES_PATH, "utf8")));
  } catch {
    return new Set();
  }
}

function recordUsedSource(link) {
  const used = readUsedSources();
  used.add(link);
  const trimmed = [...used].slice(-200);
  fs.writeFileSync(USED_SOURCES_PATH, JSON.stringify(trimmed, null, 2), "utf8");
}

function decodeXmlEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml, sourceName) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1];
    if (!title || !link) continue;
    items.push({
      title: decodeXmlEntities(title),
      link: decodeXmlEntities(link),
      pubDate: pubDate ? new Date(pubDate) : null,
      description: description ? decodeXmlEntities(description).replace(/<[^>]+>/g, "").slice(0, 400) : "",
      source: sourceName,
    });
  }
  return items;
}

function parseAtomItems(xml, sourceName) {
  const items = [];
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  for (const block of blocks) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]*)"/)?.[1]
      ?? block.match(/<link[^>]*href="([^"]*)"/)?.[1];
    const published = block.match(/<published>([\s\S]*?)<\/published>/)?.[1]
      ?? block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1];
    const summary = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1];
    if (!title || !link) continue;
    items.push({
      title: decodeXmlEntities(title),
      link: decodeXmlEntities(link),
      pubDate: published ? new Date(published) : null,
      description: summary ? decodeXmlEntities(summary).replace(/<[^>]+>/g, "").slice(0, 400) : "",
      source: sourceName,
    });
  }
  return items;
}

async function fetchRecentTechNews() {
  const sourceName = (url) => new URL(url).hostname.replace(/^www\./, "");
  const rssResults = await Promise.allSettled(
    RSS_FEEDS.map(async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`${url} returned ${res.status}`);
      return parseRssItems(await res.text(), sourceName(url));
    })
  );
  const atomResults = await Promise.allSettled(
    ATOM_FEEDS.map(async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`${url} returned ${res.status}`);
      return parseAtomItems(await res.text(), sourceName(url));
    })
  );

  let allItems = [];
  for (const r of [...rssResults, ...atomResults]) {
    if (r.status === "fulfilled") allItems.push(...r.value);
    else console.error(`Feed fetch failed: ${r.reason}`);
  }

  const cutoff = Date.now() - 48 * 3600 * 1000;
  allItems = allItems.filter((item) => !item.pubDate || item.pubDate.getTime() >= cutoff);

  const usedSources = readUsedSources();
  allItems = allItems.filter((item) => !usedSources.has(item.link));

  allItems.sort((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0));

  if (allItems.length === 0) {
    throw new Error("No recent, not-yet-covered tech/gadget/appliance news items found across any feed");
  }
  return allItems.slice(0, 30);
}

const STYLE_GUIDE = `Tu écris pour le blog Points.tn, un blog tunisien sur la tech, l'informatique,
l'électroménager connecté, l'IA et l'e-commerce.
Style : articles de fond en français, 700 à 950 mots, ton informatif et direct, jamais putaclic.
Structure : une introduction qui pose un problème concret, puis 3 à 5 sections avec des titres H2 (##)
descriptifs (pas de numérotation du type "1. ..."), et un dernier paragraphe de conclusion qui ouvre sur
une recommandation pratique — sans titre "Conclusion" séparé, il s'enchaîne juste après la dernière
section comme un paragraphe normal.
Cet article est basé sur une vraie actualité dont les faits (titre, résumé, source) te sont fournis
ci-dessous — reste fidèle à ces faits, ne les déforme pas, et n'invente pas de nouveaux faits, chiffres,
déclarations ou événements absents du résumé fourni. Tu peux développer le contexte, l'angle
tunisien/francophone et l'analyse, mais toute affirmation factuelle sur l'actualité elle-même doit venir
du résumé fourni.
Pour toute entreprise autre que celle de l'actualité elle-même (y compris les deux projets qu'on te
demande de lier) : décris uniquement ce qu'elle fait de façon générale, n'invente jamais un événement, un
chiffre ou une citation à son sujet.
Évite les tournures artificielles typiques de l'IA ("dans le monde d'aujourd'hui", "à l'ère du numérique").`;

async function pickNewsAngle(newsItems, existingTitles) {
  const newsListing = newsItems
    .map((item, i) => `${i + 1}. [${item.source}] ${item.title} — ${item.description}`)
    .join("\n");

  const prompt = `${STYLE_GUIDE}

Voici les titres déjà publiés sur le blog, à ne pas répéter ni reformuler légèrement :
${existingTitles.map((t) => `- ${t}`).join("\n")}

Voici une liste d'actualités réelles et récentes (dernières 48h) en tech, informatique, gadgets et
électroménager connecté, numérotées :
${newsListing}

Choisis UNE de ces actualités (par son numéro) qui est la plus pertinente pour un lectorat
tunisien/francophone, et suffisamment différente des titres déjà publiés ci-dessus.

Choisis TOUJOURS deux projets différents parmi cette liste à mentionner dans l'article, même si le lien
avec le sujet demande un angle un peu plus large : 1111.tn, Tdiscount.tn, Galylio, go2code, geo4seo.
Il y a toujours un angle plausible — ne réponds jamais "aucun".

Réponds uniquement en JSON avec ce format exact :
{"chosen_number": 0, "category": "une parmi: Intelligence Artificielle, SEO & E-commerce, Business & Innovation, E-commerce & Bons plans, Électroménager & High-Tech", "project_links": ["premier nom de projet, parmi: 1111.tn, Tdiscount.tn, Galylio, go2code, geo4seo", "deuxième nom de projet, différent du premier, parmi la même liste"]}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  const chosen = newsItems[parsed.chosen_number - 1];
  if (!chosen) throw new Error(`Model picked an invalid news item number: ${parsed.chosen_number}`);
  return { newsItem: chosen, categoryLabelFr: parsed.category, projectLinkNames: parsed.project_links };
}

async function callGroq(messages, { json = false, maxTokens = 6000 } = {}) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
      // gpt-oss-120b is a reasoning model; "low" keeps hidden reasoning
      // tokens small so max_tokens is spent on the actual article/JSON
      // instead of being silently eaten by chain-of-thought.
      reasoning_effort: "low",
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const choice = data.choices[0];
  if (choice.finish_reason === "length") {
    throw new Error("Groq response was truncated (hit max_tokens) — raise maxTokens or shorten the prompt");
  }
  return choice.message.content;
}

async function writeArticle({ locale, newsItem, projectLinks, todayISO, category }) {
  const sourceLinkMd = `[${newsItem.source}](${newsItem.link})`;
  const prompt =
    locale === "fr"
      ? `${STYLE_GUIDE}

Actualité réelle sur laquelle baser l'article :
- Titre original : ${newsItem.title}
- Résumé original : ${newsItem.description}
- Source : ${newsItem.source}

Mentionne la source une fois dans l'article avec ce lien markdown exact, inséré naturellement (par
exemple "selon ${sourceLinkMd}" ou "rapporté par ${sourceLinkMd}") : ${sourceLinkMd}

Intègre aussi ces deux liens, chacun une seule fois, naturellement et à des endroits différents de
l'article (pas l'un juste après l'autre, pas collé au lien source) :
- ${projectLinks[0].fr} (${projectLinks[0].about_fr})
- ${projectLinks[1].fr} (${projectLinks[1].about_fr})
Ces deux liens sont obligatoires dans le corps de l'article.
Quand tu mentionnes ${projectLinks[0].name} ou ${projectLinks[1].name}, décris uniquement ce que ce
service fait de façon générale — n'invente jamais un événement, un chiffre ou une citation à son sujet.

Réponds UNIQUEMENT en JSON, et le JSON entier (y compris "body") doit être rédigé en FRANÇAIS,
avec ce format exact (le champ "body" contient le markdown complet de l'article SANS le frontmatter,
en commençant directement par le premier paragraphe, sans titre H1 en double) :
{
  "title": "titre accrocheur mais factuel, 50-70 caractères, en français, basé sur l'actualité fournie (pas une simple traduction du titre original)",
  "description": "résumé en une phrase, 140-160 caractères, en français, pour la balise meta description",
  "coverAlt": "description courte de l'image de couverture pour l'attribut alt, en français",
  "tags": ["5 à 7 tags courts en CamelCase, pertinents au sujet"],
  "body": "le markdown complet de l'article, en français"
}`
      : `Write in English. This is for Points.tn, a Tunisian tech/informatique/appliances/AI/e-commerce blog.
Same structure and length as the French edition (700-950 words), non-clickbait tone, 3-5 H2 sections (##).
This article is based on a real, recent story whose facts (title, summary, source) are given below —
stay faithful to those facts, don't distort them, and don't invent new facts, figures, statements or
events absent from the summary given. You can develop context, the Tunisian/francophone angle, and
analysis, but any factual claim about the news itself must come from the summary provided.
For any company other than the one in the news story itself (including the two projects you're asked to
link): describe only what it does in general terms — never invent an event, figure, or quote about it.
No AI-sounding filler phrases ("in today's world", "in the digital age").

Real news story this article is based on:
- Original title: ${newsItem.title}
- Original summary: ${newsItem.description}
- Source: ${newsItem.source}

Mention the source once in the article with this exact markdown link, inserted naturally (e.g. "according
to ${sourceLinkMd}" or "reported by ${sourceLinkMd}") : ${sourceLinkMd}

Work both of these links in naturally, each once, at different points in the article (not back to back,
not right next to the source link):
- ${projectLinks[0].en} (${projectLinks[0].about_en})
- ${projectLinks[1].en} (${projectLinks[1].about_en})
Both links are required in the article body.

Respond ONLY in JSON, and the ENTIRE JSON (including "body") must be written in ENGLISH, with this
exact format ("body" is the full article markdown WITHOUT the frontmatter, starting directly with the
first paragraph, no duplicate H1 title):
{
  "title": "catchy but factual title, 50-70 characters, in English, based on the real story given (not a plain translation of the original title)",
  "description": "one-sentence summary, 140-160 characters, in English, for the meta description tag",
  "coverAlt": "short cover image description for the alt attribute, in English",
  "tags": ["5 to 7 short CamelCase tags relevant to the topic"],
  "body": "the full article markdown, in English"
}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  const parsed = JSON.parse(raw);

  // The model doesn't always follow the "cite the source" instruction (it's
  // a soft prompt rule, not code-enforced like the two project links) — if
  // it skipped it, append a short attribution line so the source is never
  // silently missing.
  let body = parsed.body.trim();
  if (!body.includes(newsItem.link)) {
    const sourceLine =
      locale === "fr" ? `Source : ${sourceLinkMd}` : `Source: ${sourceLinkMd}`;
    body = `${body}\n\n${sourceLine}`;
  }

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(parsed.title)}`,
    `description: ${JSON.stringify(parsed.description)}`,
    `date: "${todayISO}"`,
    `category: ${JSON.stringify(category[locale])}`,
    `coverAlt: ${JSON.stringify(parsed.coverAlt)}`,
    `tags: [${parsed.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
    body,
    "",
  ].join("\n");

  return { title: parsed.title, frontmatter };
}

const MIN_DAYS_BETWEEN_ARTICLES = 2;

function mostRecentArticleDate() {
  let latest = null;
  if (!fs.existsSync(CONTENT_FR)) return null;
  for (const f of fs.readdirSync(CONTENT_FR)) {
    if (!f.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(CONTENT_FR, f), "utf8");
    const m = raw.match(/^date:\s*"([^"]+)"/m);
    if (!m) continue;
    const d = new Date(m[1]);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

async function main() {
  // Cron runs this daily (see generate-points-tn-article.sh); this check is
  // what actually enforces the 2-day cadence, since cron's day-of-month
  // field can't express "every N days" reliably across month boundaries.
  const latest = mostRecentArticleDate();
  if (latest) {
    const daysSince = (Date.now() - latest.getTime()) / 86400000;
    if (daysSince < MIN_DAYS_BETWEEN_ARTICLES) {
      console.log(
        `Last article was ${daysSince.toFixed(1)} days ago, under the ${MIN_DAYS_BETWEEN_ARTICLES}-day minimum. Skipping.`
      );
      return;
    }
  }

  const existingSlugs = readExistingSlugs();
  const existingTitles = readExistingTitles();

  console.log("Fetching recent tech/informatique/électroménager news...");
  const newsItems = await fetchRecentTechNews();
  console.log(`Found ${newsItems.length} recent not-yet-covered items.`);

  console.log("Picking a news angle...");
  const { newsItem, categoryLabelFr, projectLinkNames } = await pickNewsAngle(newsItems, existingTitles);
  const category = CATEGORIES.find((c) => c.fr === categoryLabelFr) ?? CATEGORIES[0];

  const resolvedLinks = (projectLinkNames ?? [])
    .map((name) => PROJECT_LINKS.find((p) => p.name.toLowerCase() === String(name).toLowerCase()))
    .filter(Boolean);
  // Always need exactly two distinct links; pad from PROJECT_LINKS (in
  // order) if the model returned fewer than two or any duplicates/unknowns,
  // so a bad model response can never silently fall back to zero links.
  const projectLinks = [...new Set(resolvedLinks)];
  for (const candidate of PROJECT_LINKS) {
    if (projectLinks.length >= 2) break;
    if (!projectLinks.includes(candidate)) projectLinks.push(candidate);
  }

  console.log(`Source story: [${newsItem.source}] ${newsItem.title}`);
  console.log(`Category: ${category.fr} / Project links: ${projectLinks.map((p) => p.name).join(", ")}`);

  const todayISO = new Date().toISOString().slice(0, 10);

  console.log("Writing FR article...");
  const frArticle = await writeArticle({ locale: "fr", newsItem, projectLinks, todayISO, category });
  let slug = slugify(frArticle.title);
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${slugify(frArticle.title)}-${suffix}`;
    suffix += 1;
  }

  console.log("Writing EN article...");
  const enArticle = await writeArticle({ locale: "en", newsItem, projectLinks, todayISO, category });
  let enSlug = slugify(enArticle.title);
  suffix = 2;
  while (existingSlugs.has(enSlug)) {
    enSlug = `${slugify(enArticle.title)}-${suffix}`;
    suffix += 1;
  }

  fs.mkdirSync(CONTENT_FR, { recursive: true });
  fs.mkdirSync(CONTENT_EN, { recursive: true });
  const frPath = path.join(CONTENT_FR, `${slug}.mdx`);
  const enPath = path.join(CONTENT_EN, `${enSlug}.mdx`);
  fs.writeFileSync(frPath, frArticle.frontmatter, "utf8");
  fs.writeFileSync(enPath, enArticle.frontmatter, "utf8");
  console.log(`Wrote ${frPath}`);
  console.log(`Wrote ${enPath}`);

  const relFr = path.relative(REPO_ROOT, frPath);
  const relEn = path.relative(REPO_ROOT, enPath);
  execFileSync("git", ["add", relFr, relEn], { cwd: REPO_ROOT, stdio: "inherit" });
  execFileSync(
    "git",
    [
      "commit",
      "-m",
      `Auto-generated article: ${frArticle.title}`,
      "-m",
      "Generated by scripts/generate-article.mjs via the Groq API.",
    ],
    { cwd: REPO_ROOT, stdio: "inherit" }
  );
  const branch = process.env.GENERATE_ARTICLE_PUSH_BRANCH || "main";
  execFileSync("git", ["push", "origin", `HEAD:${branch}`], { cwd: REPO_ROOT, stdio: "inherit" });
  console.log(`Pushed to ${branch}.` + (branch === "main" ? " The existing deploy cron will pick this up within 15 minutes." : ""));

  recordUsedSource(newsItem.link);
}

main().catch((err) => {
  console.error("Article generation failed:", err);
  process.exit(1);
});
