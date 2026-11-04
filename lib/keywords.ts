// Keyword & question ideas from Google's public autocomplete (no API key).
// It shows what people actually type, but gives NO search volume: use it to
// pick topics, then judge demand from Search Console once pages are indexed.
import { cached, HOUR } from "./cache";

export type KeywordIdeas = {
  seed: string;
  lang: "fr" | "en";
  fetchedAt: string;
  questions: string[];
  ideas: string[];
};

const QUESTION = /^(comment|pourquoi|quel|quelle|quels|quelles|qu'est|c'est quoi|combien|où|quand|est-ce|how|what|why|which|where|when|can|is|are|does|do|should)\b/i;
const PREFIX = {
  fr: ["comment", "pourquoi", "quel", "quelle", "combien", "meilleur", "avis", "prix", "gratuit", "tunisie"],
  en: ["how", "why", "what", "which", "best", "price", "free", "vs", "tunisia", "for"],
};

async function suggest(q: string, lang: "fr" | "en"): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${lang}&gl=tn&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

export async function keywordIdeas(seedRaw: string, lang: "fr" | "en", force = false): Promise<KeywordIdeas> {
  const seed = seedRaw.trim().toLowerCase().slice(0, 80);
  return cached(`kw:${lang}:${seed}`, 12 * HOUR, force, async () => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    const queries = [seed, ...PREFIX[lang].map((p) => `${p} ${seed}`), ...letters.map((l) => `${seed} ${l}`)];
    const results: string[][] = new Array(queries.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < queries.length) {
          const i = next++;
          results[i] = await suggest(queries[i], lang);
        }
      })
    );
    const seen = new Set<string>();
    const all: string[] = [];
    for (const r of results) {
      for (const s of r) {
        const t = s.trim().toLowerCase();
        if (!t || t === seed || seen.has(t)) continue;
        seen.add(t);
        all.push(t);
      }
    }
    if (all.length === 0) throw new Error("Google returned no suggestions (try another seed, or retry in a minute)");
    return {
      seed,
      lang,
      fetchedAt: new Date().toISOString(),
      questions: all.filter((t) => QUESTION.test(t)),
      ideas: all.filter((t) => !QUESTION.test(t)),
    } satisfies KeywordIdeas;
  });
}
