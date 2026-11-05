#!/usr/bin/env node
// Weekly backlink monitor. For every site it records:
//  - how many inbound links Bing Webmaster Tools knows about, and which pages receive them
//  - the sources of those links, so new ones can be flagged
//  - the Open PageRank score (0-10, a free authority estimate)
// History is appended to .backlink-history.json (git-ignored); the Authority page reads it.
// Run from the app folder:  node scripts/backlink-snapshot.mjs   (cron runs it weekly)
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const HISTORY = path.join(ROOT, ".backlink-history.json");

// Load .env.local without extra dependencies.
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").replace(/\\\$/g, "$");
  }
} catch {
  /* env may already be set */
}

const DOMAINS = [
  "points.tn", "soukbladi.tn", "generaldesign.tn", "lequotidien.tn", "snitnord.tn", "webline.tn",
  "chedmed.tn", "openmosques.tn", "pcs.tn", "smartimpact.tn", "yatout.tn", "galylio.com",
];
const BING = "https://ssl.bing.com/webmaster/api.svc/json";
const BING_KEY = process.env.BING_WEBMASTER_API_KEY;
const OPR_KEY = process.env.OPEN_PAGERANK_API_KEY;

async function bing(method, params) {
  const qs = new URLSearchParams({ apikey: BING_KEY, ...params }).toString();
  const res = await fetch(`${BING}/${method}?${qs}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.d) throw new Error(j.Message ?? `HTTP ${res.status}`);
  return j.d;
}

async function bingLinks(domain) {
  let lastErr;
  for (const siteUrl of [`https://${domain}/`, `https://www.${domain}/`]) {
    try {
      const pages = [];
      let total = 0;
      for (let page = 0; page < 5; page++) {
        const d = await bing("GetLinkCounts", { siteUrl, page: String(page) });
        pages.push(...(d.Links ?? []));
        total = d.TotalPages ?? 0;
        if (page + 1 >= total) break;
      }
      const targets = pages.sort((a, b) => b.Count - a.Count).slice(0, 10);
      const sources = [];
      for (const t of targets) {
        try {
          const d = await bing("GetUrlLinks", { siteUrl, link: t.Url, page: "0" });
          for (const l of d.Details ?? []) sources.push(l.SourceUrl);
        } catch {
          /* some targets return nothing */
        }
      }
      return {
        links: pages.reduce((s, p) => s + (p.Count ?? 0), 0),
        pages: pages.length,
        top: targets.map((t) => ({ url: t.Url, count: t.Count })),
        sources: [...new Set(sources)].slice(0, 200),
      };
    } catch (e) {
      lastErr = e;
    }
  }
  return { error: lastErr instanceof Error ? lastErr.message : String(lastErr) };
}

async function opr() {
  if (!OPR_KEY) return {};
  const qs = DOMAINS.map((d, i) => `domains[${i}]=${encodeURIComponent(d)}`).join("&");
  try {
    const res = await fetch(`https://openpagerank.keywordseverywhere.com/api/v1.0/getPageRank?${qs}`, { headers: { "API-OPR": OPR_KEY }, signal: AbortSignal.timeout(30000) });
    const j = await res.json();
    return Object.fromEntries((j.response ?? []).map((r) => [r.domain, r.page_rank_decimal ?? null]));
  } catch {
    return {};
  }
}

let history = [];
try {
  history = JSON.parse(fs.readFileSync(HISTORY, "utf8"));
} catch {
  /* first run */
}
const previous = history.at(-1)?.sites ?? {};
const pageRank = await opr();

const sites = {};
for (const d of DOMAINS) {
  const b = BING_KEY ? await bingLinks(d) : { error: "BING_WEBMASTER_API_KEY not set" };
  const prevSources = new Set(previous[d]?.sources ?? []);
  sites[d] = {
    ...b,
    pageRank: pageRank[d] ?? null,
    newSources: b.sources ? b.sources.filter((s) => !prevSources.has(s)).slice(0, 50) : [],
  };
  console.log(d, b.error ? `error: ${b.error}` : `${b.links} links, ${sites[d].newSources.length} new`, `OPR ${sites[d].pageRank ?? "-"}`);
}

history.push({ at: new Date().toISOString(), sites });
fs.writeFileSync(HISTORY, JSON.stringify(history.slice(-60)), "utf8");
