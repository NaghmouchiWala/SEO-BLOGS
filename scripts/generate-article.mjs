#!/usr/bin/env node
// Generates one new FR+EN article pair via the Groq API, writes them under
// content/{fr,en}/, commits, and pushes to origin main. The existing
// deploy-points-tn-blog.sh cron (every 15 min) picks the push up, builds,
// and restarts the site — this script does not touch the build or PM2.
//
// Points.tn is a news portal. Each article belongs to one section (national,
// international, sport, culture, regions, tech, divers). The section rotates
// so every section keeps getting fresh stories, and the article is grounded
// in a real, recent story from that section's RSS feeds and always cites its
// source. Never invents facts.
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

// One category per generated article = one section of the site (see lib/categories.ts).
const CATEGORIES = [
  { slug: "national", fr: "Actualité nationale", en: "National news" },
  { slug: "international", fr: "International", en: "International" },
  { slug: "sport", fr: "Sport", en: "Sport" },
  { slug: "culture", fr: "Culture", en: "Culture" },
  { slug: "regions", fr: "Régions", en: "Regions" },
  { slug: "tech", fr: "Tech", en: "Tech" },
  { slug: "divers", fr: "Divers", en: "Miscellaneous" },
];

// RSS feeds per section. Feeds are RSS 2.0 (<item>) unless listed under atom.
const SECTION_FEEDS = {
  national: ["https://www.mosaiquefm.net/fr/rss", "https://lapresse.tn/feed/", "https://www.leconomistemaghrebin.com/feed/"],
  international: ["https://www.france24.com/fr/rss", "https://www.rfi.fr/fr/monde/rss"],
  sport: ["https://www.france24.com/fr/sports/rss", "https://www.rfi.fr/fr/sports/rss"],
  culture: ["https://www.france24.com/fr/culture/rss", "https://www.rfi.fr/fr/culture/rss"],
  regions: ["https://www.mosaiquefm.net/fr/rss", "https://lapresse.tn/feed/"],
  tech: [
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.wired.com/feed/rss",
  ],
  divers: ["https://www.mosaiquefm.net/fr/rss", "https://www.france24.com/fr/rss"],
};
const SECTION_ATOM_FEEDS = {
  tech: ["https://www.cnet.com/rss/tech/", "https://www.cnet.com/rss/home/"],
};

// What the model should look for in each section.
const SECTION_BRIEF = {
  national: "une actualité nationale tunisienne (politique, économie, société, institutions)",
  international: "une actualité internationale importante pour un lectorat tunisien et francophone",
  sport: "une actualité sportive (football, tennis, jeux, compétitions), idéalement avec un lien avec la Tunisie ou le Maghreb",
  culture: "une actualité culturelle (cinéma, musique, festivals, livres, patrimoine)",
  regions: "une actualité qui concerne clairement une région ou une ville de Tunisie (Sfax, Sousse, Gabès, Bizerte, Kairouan, etc.)",
  tech: "une actualité technologique (IA, informatique, gadgets, électroménager connecté, e-commerce)",
  divers: "un fait de société, un fait divers, la météo ou une actualité insolite, sans sujet politique sensible",
};

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

// Section with the fewest of the last 14 French articles (ties: site order),
// so the home page keeps a balanced mix like a real newsroom.
function pickSection() {
  const counts = new Map(CATEGORIES.map((c) => [c.fr, 0]));
  if (fs.existsSync(CONTENT_FR)) {
    const files = fs
      .readdirSync(CONTENT_FR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(CONTENT_FR, f), "utf8");
        return {
          date: raw.match(/^date:\s*"([^"]+)"/m)?.[1] ?? "",
          category: raw.match(/^category:\s*"([^"]+)"/m)?.[1] ?? "",
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
    for (const f of files) {
      // Articles written before the news redesign were all tech/AI.
      const label = counts.has(f.category) ? f.category : "Tech";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...CATEGORIES].sort((a, b) => counts.get(a.fr) - counts.get(b.fr))[0];
}

async function fetchRecentNews(section) {
  const sourceName = (url) => new URL(url).hostname.replace(/^www\./, "");
  const grab = (urls, parse) =>
    (urls ?? []).map(async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (compatible; PointsTnBot/1.0)" } });
      if (!res.ok) throw new Error(`${url} returned ${res.status}`);
      return parse(await res.text(), sourceName(url));
    });
  const results = await Promise.allSettled([
    ...grab(SECTION_FEEDS[section.slug], parseRssItems),
    ...grab(SECTION_ATOM_FEEDS[section.slug], parseAtomItems),
  ]);

  let allItems = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
    else console.error(`Feed fetch failed: ${r.reason}`);
  }

  const cutoff = Date.now() - 48 * 3600 * 1000;
  allItems = allItems.filter((item) => !item.pubDate || item.pubDate.getTime() >= cutoff);

  const usedSources = readUsedSources();
  allItems = allItems.filter((item) => !usedSources.has(item.link));

  allItems.sort((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0));

  if (allItems.length === 0) {
    throw new Error(`No recent, not-yet-covered news items found for section ${section.slug}`);
  }
  return allItems.slice(0, 30);
}

function styleGuide(section) {
  const tech = section.slug === "tech";
  return `Tu écris pour Points.tn, un média d'actualité tunisien en ligne (rubrique : ${section.fr}).
Style : article d'actualité en français, ${tech ? "600 à 850" : "350 à 550"} mots, ton journalistique, factuel et neutre, jamais putaclic.
Structure : un premier paragraphe qui donne l'essentiel (qui, quoi, quand, où), puis 2 à 4 sections avec
des titres H2 (##) descriptifs (pas de numérotation), et un dernier paragraphe de mise en perspective
(contexte, enjeux, suite attendue) sans titre "Conclusion".
Cet article est basé sur une vraie actualité dont les faits (titre, résumé, source) te sont fournis
ci-dessous — reste strictement fidèle à ces faits. N'invente AUCUN fait, chiffre, date, nom, déclaration
ou citation absent du résumé fourni. Si une information manque, ne la comble pas. Tu peux rappeler le
contexte général connu et expliquer les enjeux, sans affirmer de nouveaux faits sur l'événement lui-même.
Sur les sujets politiques, judiciaires ou sensibles : aucune prise de position, pas de jugement,
présomption d'innocence respectée.
Évite les tournures artificielles typiques de l'IA ("dans le monde d'aujourd'hui", "à l'ère du numérique").`;
}

async function pickNewsAngle(newsItems, existingTitles, section) {
  const newsListing = newsItems
    .map((item, i) => `${i + 1}. [${item.source}] ${item.title} — ${item.description}`)
    .join("\n");
  const tech = section.slug === "tech";

  const prompt = `${styleGuide(section)}

Voici les titres déjà publiés sur le site, à ne pas répéter ni reformuler légèrement :
${existingTitles.slice(-40).map((t) => `- ${t}`).join("\n")}

Voici une liste d'actualités réelles et récentes (dernières 48h), numérotées :
${newsListing}

Choisis UNE de ces actualités (par son numéro) : ${SECTION_BRIEF[section.slug]}.
Elle doit être suffisamment différente des titres déjà publiés ci-dessus.
${tech ? `Choisis aussi deux projets différents à mentionner dans l'article : 1111.tn, Tdiscount.tn, Galylio, go2code, geo4seo. Il y a toujours un angle plausible — ne réponds jamais "aucun".` : ""}
Donne aussi "image_query" : 2 à 3 mots-clés EN ANGLAIS décrivant une photo d'illustration générique et
neutre (un lieu, un objet, une scène : "tunis medina", "football stadium", "cinema screen"), jamais un
nom de personne.

Réponds uniquement en JSON avec ce format exact :
{"chosen_number": 0, "image_query": "mots clés"${tech ? `, "project_links": ["premier projet", "deuxième projet, différent"]` : ""}}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  const parsed = JSON.parse(raw);
  const chosen = newsItems[parsed.chosen_number - 1];
  if (!chosen) throw new Error(`Model picked an invalid news item number: ${parsed.chosen_number}`);
  return { newsItem: chosen, projectLinkNames: parsed.project_links, imageQuery: String(parsed.image_query ?? "").slice(0, 60) };
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

async function writeArticle({ locale, newsItem, projectLinks, todayISO, section }) {
  const sourceLinkMd = `[${newsItem.source}](${newsItem.link})`;
  const withProjects = section.slug === "tech" && projectLinks.length >= 2;
  const fr = locale === "fr";

  const projectBlock = !withProjects
    ? ""
    : fr
      ? `
Intègre aussi ces deux liens, chacun une seule fois, naturellement et à des endroits différents de
l'article (pas l'un juste après l'autre, pas collé au lien source) :
- ${projectLinks[0].fr} (${projectLinks[0].about_fr})
- ${projectLinks[1].fr} (${projectLinks[1].about_fr})
Ces deux liens sont obligatoires. Décris uniquement ce que ces services font de façon générale —
n'invente jamais un événement, un chiffre ou une citation à leur sujet.
`
      : `
Work both of these links in naturally, each once, at different points in the article (not back to back,
not right next to the source link):
- ${projectLinks[0].en} (${projectLinks[0].about_en})
- ${projectLinks[1].en} (${projectLinks[1].about_en})
Both links are required. Describe only what these services do in general terms — never invent an event,
figure or quote about them.
`;

  const prompt = fr
    ? `${styleGuide(section)}

Actualité réelle sur laquelle baser l'article :
- Titre original : ${newsItem.title}
- Résumé original : ${newsItem.description}
- Source : ${newsItem.source}

Mentionne la source une fois dans l'article avec ce lien markdown exact, inséré naturellement (par
exemple "selon ${sourceLinkMd}" ou "rapporté par ${sourceLinkMd}") : ${sourceLinkMd}
Reformule avec tes propres mots : ne recopie pas de phrases de la source.
${projectBlock}
Réponds UNIQUEMENT en JSON, et le JSON entier (y compris "body") doit être rédigé en FRANÇAIS,
avec ce format exact (le champ "body" contient le markdown complet de l'article SANS le frontmatter,
en commençant directement par le premier paragraphe, sans titre H1 en double) :
{
  "title": "titre factuel de type presse, 50-70 caractères, en français, basé sur l'actualité fournie (pas une simple traduction du titre original)",
  "description": "chapô en une phrase, 140-160 caractères, en français, pour la balise meta description",
  "coverAlt": "description courte de l'image de couverture pour l'attribut alt, en français",
  "tags": ["4 à 6 tags courts en CamelCase, pertinents au sujet"],
  "body": "le markdown complet de l'article, en français"
}`
    : `Write in English, for Points.tn, a Tunisian online news outlet (section: ${section.en}).
Same structure as the French edition (${section.slug === "tech" ? "600-850" : "350-550"} words), journalistic, factual and neutral tone,
no clickbait. First paragraph gives the essentials (who, what, when, where), then 2-4 H2 sections (##),
then a closing paragraph with context and what to expect next (no "Conclusion" heading).
This article is based on a real, recent story whose facts (title, summary, source) are given below —
stay strictly faithful to them. Do NOT invent any fact, figure, date, name, statement or quote absent
from the summary given. If information is missing, do not fill the gap. On political, judicial or
sensitive topics: take no side, no judgement, presumption of innocence.
No AI-sounding filler phrases ("in today's world", "in the digital age").

Real news story this article is based on:
- Original title: ${newsItem.title}
- Original summary: ${newsItem.description}
- Source: ${newsItem.source}

Mention the source once in the article with this exact markdown link, inserted naturally (e.g. "according
to ${sourceLinkMd}" or "reported by ${sourceLinkMd}") : ${sourceLinkMd}
Rewrite in your own words: do not copy sentences from the source.
${projectBlock}
Respond ONLY in JSON, and the ENTIRE JSON (including "body") must be written in ENGLISH, with this
exact format ("body" is the full article markdown WITHOUT the frontmatter, starting directly with the
first paragraph, no duplicate H1 title):
{
  "title": "factual newspaper-style title, 50-70 characters, in English, based on the real story given (not a plain translation of the original title)",
  "description": "one-sentence standfirst, 140-160 characters, in English, for the meta description tag",
  "coverAlt": "short cover image description for the alt attribute, in English",
  "tags": ["4 to 6 short CamelCase tags relevant to the topic"],
  "body": "the full article markdown, in English"
}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  const parsed = JSON.parse(raw);

  // The model doesn't always cite the source (soft prompt rule) — if it
  // skipped it, append an attribution line so the source is never missing.
  let body = parsed.body.trim();
  if (!body.includes(newsItem.link)) {
    body = `${body}\n\n${fr ? "Source : " : "Source: "}${sourceLinkMd}`;
  }

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(parsed.title)}`,
    `description: ${JSON.stringify(parsed.description)}`,
    `date: "${todayISO}"`,
    `category: ${JSON.stringify(section[locale])}`,
    `coverAlt: ${JSON.stringify(parsed.coverAlt)}`,
    `tags: [${parsed.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    "---",
    "",
    body,
    "",
  ].join("\n");

  return { title: parsed.title, frontmatter };
}

// Optional cover photo from Unsplash (needs UNSPLASH_ACCESS_KEY in the
// generator environment). Without a key, or if nothing is found, the article
// simply uses its section's cover (public/images/cover-<section>.svg).
async function fetchCoverPhoto(query, destPaths) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) return false;
  try {
    const search = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&client_id=${key}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!search.ok) return false;
    const hit = (await search.json()).results?.[0];
    if (!hit) return false;
    const img = await fetch(hit.urls.regular, { signal: AbortSignal.timeout(30000) });
    if (!img.ok) return false;
    const buf = Buffer.from(await img.arrayBuffer());
    for (const dest of destPaths) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
    }
    const credits = path.join(REPO_ROOT, "public", "images", "photos", "CREDITS.txt");
    fs.appendFileSync(
      credits,
      `\n${path.basename(destPaths[0])}: Photo by ${hit.user?.name ?? "Unsplash contributor"} on Unsplash (${hit.links?.html ?? "https://unsplash.com"})`
    );
    return true;
  } catch (err) {
    console.error(`Cover photo skipped: ${err.message}`);
    return false;
  }
}

const MIN_DAYS_BETWEEN_ARTICLES = 1;

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
  // what actually enforces the daily cadence, since cron's day-of-month
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

  const section = pickSection();
  console.log(`Section of the day: ${section.fr}`);
  console.log("Fetching recent news for this section...");
  const newsItems = await fetchRecentNews(section);
  console.log(`Found ${newsItems.length} recent not-yet-covered items.`);

  console.log("Picking a news angle...");
  const { newsItem, projectLinkNames, imageQuery } = await pickNewsAngle(newsItems, existingTitles, section);

  const resolvedLinks = (projectLinkNames ?? [])
    .map((name) => PROJECT_LINKS.find((p) => p.name.toLowerCase() === String(name).toLowerCase()))
    .filter(Boolean);
  // Project links are only used in the Tech section (see writeArticle).
  const projectLinks = [...new Set(resolvedLinks)];
  if (section.slug === "tech") {
    for (const candidate of PROJECT_LINKS) {
      if (projectLinks.length >= 2) break;
      if (!projectLinks.includes(candidate)) projectLinks.push(candidate);
    }
  }

  console.log(`Source story: [${newsItem.source}] ${newsItem.title}`);
  console.log(`Section: ${section.fr}` + (projectLinks.length && section.slug === "tech" ? ` / Project links: ${projectLinks.map((p) => p.name).join(", ")}` : ""));

  const todayISO = new Date().toISOString().slice(0, 10);

  console.log("Writing FR article...");
  const frArticle = await writeArticle({ locale: "fr", newsItem, projectLinks, todayISO, section });
  let slug = slugify(frArticle.title);
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${slugify(frArticle.title)}-${suffix}`;
    suffix += 1;
  }

  console.log("Writing EN article...");
  const enArticle = await writeArticle({ locale: "en", newsItem, projectLinks, todayISO, section });
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

  const photoFr = path.join(REPO_ROOT, "public", "images", "photos", `${slug}.jpg`);
  const photoEn = path.join(REPO_ROOT, "public", "images", "photos", `${enSlug}.jpg`);
  const gotPhoto = await fetchCoverPhoto(imageQuery, [photoFr, photoEn]);

  const relFr = path.relative(REPO_ROOT, frPath);
  const relEn = path.relative(REPO_ROOT, enPath);
  const toAdd = [relFr, relEn];
  if (gotPhoto) toAdd.push(path.relative(REPO_ROOT, photoFr), path.relative(REPO_ROOT, photoEn), path.join("public", "images", "photos", "CREDITS.txt"));
  if (process.env.GENERATE_DRY_RUN) {
    console.log("Dry run: files written, nothing committed or pushed.");
    return;
  }
  execFileSync("git", ["add", ...toAdd], { cwd: REPO_ROOT, stdio: "inherit" });
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
