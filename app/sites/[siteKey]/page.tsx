"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type Article = {
  id: string;
  locale: "fr" | "en" | null;
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string | null;
  tags: string[];
  url: string;
  reviewed: boolean;
  published: boolean;
};

export default function SiteArticlesPage({ params }: { params: Promise<{ siteKey: string }> }) {
  const { siteKey } = use(params);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState("");

  const load = useCallback(() => {
    fetch(`/api/articles/${siteKey}`)
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []));
  }, [siteKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleReview(article: Article) {
    await fetch(`/api/articles/${siteKey}/${encodeURIComponent(article.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", reviewed: !article.reviewed }),
    });
    load();
  }

  async function togglePublish(article: Article) {
    const res = await fetch(`/api/articles/${siteKey}/${encodeURIComponent(article.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", published: !article.published }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update publish status");
      return;
    }
    load();
  }

  async function handleGenerateNow() {
    setGenerating(true);
    setGenerateMsg("Generating...");
    const res = await fetch(`/api/generate/${siteKey}`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGenerateMsg(data.error ?? "Failed to start");
      setGenerating(false);
      return;
    }
    poll();
  }

  function poll() {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/generate/${siteKey}`);
      const status = await res.json();
      if (status.state === "done") {
        clearInterval(interval);
        setGenerating(false);
        setGenerateMsg(status.success ? "Done — new article published." : "Finished with errors — check logs.");
        load();
      } else if (status.state === "error") {
        clearInterval(interval);
        setGenerating(false);
        setGenerateMsg("Failed — check logs.");
      }
    }, 3000);
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <Link href="/" className="mb-4 inline-block text-xs text-muted hover:text-foreground">
          ← All sites
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground capitalize">
            {siteKey}
          </h1>
          <button
            onClick={handleGenerateNow}
            disabled={generating}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate now"}
          </button>
        </div>
        {generateMsg && <p className="mb-4 text-xs text-muted">{generateMsg}</p>}

        {!articles && <div className="text-sm text-muted">Loading...</div>}

        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {articles?.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {a.locale && (
                    <span className="badge bg-surface-2 text-muted">{a.locale.toUpperCase()}</span>
                  )}
                  {!a.published && <span className="badge bg-danger/15 text-danger">Unpublished</span>}
                  {a.reviewed && <span className="badge bg-accent-2/15 text-accent-2">Reviewed</span>}
                </div>
                <Link
                  href={`/sites/${siteKey}/${encodeURIComponent(a.id)}`}
                  className="truncate font-medium text-foreground hover:text-accent-2"
                >
                  {a.title || "(untitled)"}
                </Link>
                <p className="truncate text-xs text-muted">{a.description}</p>
                <p className="mt-1 text-xs text-muted/70">
                  {a.date ? new Date(a.date).toLocaleDateString() : ""} ·{" "}
                  <a href={a.url} target="_blank" rel="noopener" className="hover:text-accent-2">
                    view live ↗
                  </a>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggleReview(a)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    a.reviewed
                      ? "border-accent-2/40 text-accent-2"
                      : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {a.reviewed ? "Reviewed" : "Mark reviewed"}
                </button>
                {a.locale === null && (
                  <button
                    onClick={() => togglePublish(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      a.published
                        ? "border-border text-muted hover:border-danger/40 hover:text-danger"
                        : "border-accent-2/40 text-accent-2"
                    }`}
                  >
                    {a.published ? "Unpublish" : "Republish"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {articles?.length === 0 && (
            <div className="p-8 text-center text-sm text-muted">No auto-generated articles yet.</div>
          )}
        </div>
      </main>
    </>
  );
}
