"use client";

import { useState } from "react";
import { Copy, ExternalLink, Lightbulb } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader } from "@/components/ui";
import type { KeywordIdeas } from "@/lib/keywords";

const EXAMPLES = ["intelligence artificielle", "e-commerce tunisie", "référencement seo", "électroménager connecté"];

function IdeaList({ title, hint, items, lang }: { title: string; hint: string; items: string[]; lang: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(items.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <section className="card !p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title} <span className="badge ml-1 border border-border bg-surface-2 text-muted tabular-nums">{items.length}</span></h2>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        {items.length > 0 && (
          <button onClick={copy} className="btn-ghost !h-8 !px-3 text-xs">
            <Copy size={14} /> {copied ? "Copied" : "Copy list"}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">None found for this seed.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((k) => (
            <li key={k} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span>{k}</span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(k)}&hl=${lang}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-muted hover:text-accent"
                title="See who ranks for this on Google"
              >
                <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function KeywordsPage() {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [data, setData] = useState<KeywordIdeas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(seed = q) {
    if (seed.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/keywords?q=${encodeURIComponent(seed)}&lang=${lang}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Keyword ideas"
        subtitle="What people actually type into Google around a topic, grouped into questions and long-tail phrases. Good raw material for articles worth linking to."
      />

      <form
        onSubmit={(e) => { e.preventDefault(); run(); }}
        className="mb-6 flex flex-wrap items-center gap-3"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Seed topic, e.g. intelligence artificielle" className="input !w-auto min-w-80 flex-1" aria-label="Seed topic" />
        <select value={lang} onChange={(e) => setLang(e.target.value as "fr" | "en")} className="input !w-auto" aria-label="Language">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <button type="submit" disabled={loading || q.trim().length < 2} className="btn-primary">
          <Lightbulb size={16} /> {loading ? "Searching..." : "Find ideas"}
        </button>
      </form>

      {error && <ErrorState title="Could not get ideas" detail={error} onRetry={() => run()} />}
      {loading && <div className="skeleton h-72" />}

      {!loading && !data && !error && (
        <EmptyState
          icon={<Lightbulb size={40} strokeWidth={1.5} />}
          title="Start from a topic"
          text="Type a topic your sites cover. You get the questions and phrases people search for, from Google's own suggestions."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => { setQ(e); run(e); }} className="btn-ghost !h-8 !px-3 text-xs">{e}</button>
              ))}
            </div>
          }
        />
      )}

      {data && !loading && (
        <div className="space-y-6">
          <p className="text-xs text-muted">
            {data.questions.length + data.ideas.length} suggestions for “{data.seed}”. Google's suggestions show popular phrasing but not search volume: pick topics here, then check clicks and impressions in Search Console once the page is indexed.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <IdeaList title="Questions" hint="Each one can be an article title or an FAQ block." items={data.questions} lang={data.lang} />
            <IdeaList title="Long-tail phrases" hint="Specific searches with less competition." items={data.ideas} lang={data.lang} />
          </div>
        </div>
      )}
    </Page>
  );
}
