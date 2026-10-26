#!/usr/bin/env node
// Generates one new FR+EN article pair via the Groq API, writes them under
// content/{fr,en}/, commits, and pushes to origin main. The existing
// deploy-points-tn-blog.sh cron (every 15 min) picks the push up, builds,
// and restarts the site — this script does not touch the build or PM2.
//
// Run manually:   node scripts/generate-article.mjs
// Run via cron:    see /home/ubuntu/generate-points-tn-article.sh
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_FR = path.join(REPO_ROOT, "content", "fr");
const CONTENT_EN = path.join(REPO_ROOT, "content", "en");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY is not set");
  process.exit(1);
}

const MODEL = "openai/gpt-oss-120b";

// One category per generated article, matched 1:1 with the four buckets
// lib/categories.ts already knows how to map to a fallback SVG cover.
const CATEGORIES = [
  { fr: "Intelligence Artificielle", en: "Artificial Intelligence" },
  { fr: "SEO & E-commerce", en: "SEO & E-commerce" },
  { fr: "Business & Innovation", en: "Business & Innovation" },
  { fr: "E-commerce & Bons plans", en: "E-commerce & Deals" },
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

const STYLE_GUIDE = `Tu écris pour le blog Points.tn, un blog tunisien sur la tech, l'IA et l'e-commerce.
Style : articles de fond en français, 700 à 950 mots, ton informatif et direct, jamais putaclic.
Structure : une introduction qui pose un problème concret, puis 3 à 5 sections avec des titres H2 (##)
descriptifs (pas de numérotation du type "1. ..."), et un dernier paragraphe de conclusion qui ouvre sur
une recommandation pratique — sans titre "Conclusion" séparé, il s'enchaîne juste après la dernière
section comme un paragraphe normal.
N'invente et ne cite JAMAIS le nom d'une entreprise, d'un produit, d'un outil ou d'une marque réelle
ou fictive — y compris pour illustrer un exemple — SAUF si le prompt te fournit explicitement un lien
précis à utiliser. Si aucun lien ne t'est fourni, n'en mentionne aucun, même un nom générique inventé
comme exemple plausible ("une plateforme comme X") : décris le concept sans l'attribuer à une marque.
N'invente aucun chiffre, aucune statistique, aucun pourcentage, aucune fourchette de prix ou de délai,
aucune citation attribuée à une personne réelle. Reste sur des affirmations qualitatives et générales
que tu peux justifier sans donnée chiffrée précise.
Évite les tournures artificielles typiques de l'IA ("dans le monde d'aujourd'hui", "à l'ère du numérique").`;

async function pickTopic(existingTitles) {
  const prompt = `${STYLE_GUIDE}

Voici les titres déjà publiés sur le blog, à ne pas répéter ni reformuler légèrement :
${existingTitles.map((t) => `- ${t}`).join("\n")}

Propose UN nouveau sujet d'article sur une tendance tech récente et concrète (IA, automatisation,
e-commerce, cybersécurité, ou transformation digitale), pertinent pour un lectorat tunisien/francophone.
Le sujet doit être différent des titres ci-dessus, pas une simple reformulation.

Réponds uniquement en JSON avec ce format exact :
{"topic": "description du sujet en une phrase", "category": "une parmi: Intelligence Artificielle, SEO & E-commerce, Business & Innovation, E-commerce & Bons plans", "project_link": "nom du projet le plus pertinent parmi: 1111.tn, Tdiscount.tn, Galylio, go2code, geo4seo, ou none si aucun ne convient naturellement"}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  return JSON.parse(raw);
}

async function writeArticle({ locale, topic, category, projectLink, todayISO }) {
  const prompt =
    locale === "fr"
      ? `${STYLE_GUIDE}

Sujet : ${topic}
${
  projectLink
    ? `Intègre ce lien une seule fois, naturellement : ${projectLink.fr} (${projectLink.about_fr}).`
    : "N'inclus aucun lien vers un projet externe dans cet article."
}

Réponds UNIQUEMENT en JSON, et le JSON entier (y compris "body") doit être rédigé en FRANÇAIS,
avec ce format exact (le champ "body" contient le markdown complet de l'article SANS le frontmatter,
en commençant directement par le premier paragraphe, sans titre H1 en double) :
{
  "title": "titre accrocheur mais factuel, 50-70 caractères, en français",
  "description": "résumé en une phrase, 140-160 caractères, en français, pour la balise meta description",
  "coverAlt": "description courte de l'image de couverture pour l'attribut alt, en français",
  "tags": ["5 à 7 tags courts en CamelCase, pertinents au sujet"],
  "body": "le markdown complet de l'article, en français"
}`
      : `Write in English. This is for Points.tn, a Tunisian tech/AI/e-commerce blog. Same structure and
length as the French edition (700-950 words), non-clickbait tone, 3-5 H2 sections (##). Never invent or
name a real or fictional company, product, tool, or brand — even as a plausible-sounding example —
UNLESS the prompt explicitly gives you one to use below. If none is given, describe concepts generically
without attributing them to any named entity. Never invent statistics, percentages, price ranges,
timeframes, or quotes attributed to a real person — stick to qualitative claims you can defend without
a precise figure. No AI-sounding filler phrases ("in today's world", "in the digital age").

Topic (translate this into a proper English article, do not write in French): ${topic}
${
  projectLink
    ? `Work this link in once, naturally: ${projectLink.en} (${projectLink.about_en}).`
    : "Do not include any external project link in this article."
}

Respond ONLY in JSON, and the ENTIRE JSON (including "body") must be written in ENGLISH, with this
exact format ("body" is the full article markdown WITHOUT the frontmatter, starting directly with the
first paragraph, no duplicate H1 title):
{
  "title": "catchy but factual title, 50-70 characters, in English",
  "description": "one-sentence summary, 140-160 characters, in English, for the meta description tag",
  "coverAlt": "short cover image description for the alt attribute, in English",
  "tags": ["5 to 7 short CamelCase tags relevant to the topic"],
  "body": "the full article markdown, in English"
}`;

  const raw = await callGroq([{ role: "user", content: prompt }], { json: true });
  const parsed = JSON.parse(raw);

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
    parsed.body.trim(),
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

  console.log("Picking a topic...");
  const { topic, category: categoryLabelFr, project_link } = await pickTopic(existingTitles);
  const category = CATEGORIES.find((c) => c.fr === categoryLabelFr) ?? CATEGORIES[0];
  const projectLink =
    project_link && project_link !== "none"
      ? PROJECT_LINKS.find((p) => p.name.toLowerCase() === project_link.toLowerCase())
      : null;

  console.log(`Topic: ${topic}`);
  console.log(`Category: ${category.fr} / Project link: ${projectLink?.name ?? "none"}`);

  const todayISO = new Date().toISOString().slice(0, 10);

  console.log("Writing FR article...");
  const frArticle = await writeArticle({ locale: "fr", topic, category, projectLink, todayISO });
  let slug = slugify(frArticle.title);
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${slugify(frArticle.title)}-${suffix}`;
    suffix += 1;
  }

  console.log("Writing EN article...");
  const enArticle = await writeArticle({ locale: "en", topic, category, projectLink, todayISO });
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
}

main().catch((err) => {
  console.error("Article generation failed:", err);
  process.exit(1);
});
