"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type PointsArticle = {
  locale: "fr" | "en";
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  body: string;
  url: string;
  reviewed: boolean;
};

type StaticArticle = {
  siteKey: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  url: string;
  reviewed: boolean;
  published: boolean;
};

export default function ArticleEditPage({
  params,
}: {
  params: Promise<{ siteKey: string; slug: string }>;
}) {
  const { siteKey, slug: id } = use(params);
  const [article, setArticle] = useState<(PointsArticle | StaticArticle) & Record<string, unknown> | null>(null);
  const [editableField, setEditableField] = useState<"body" | "bodyHtml">("body");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${siteKey}/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setArticle(data.article);
        setEditableField(data.editableField);
        setTitle(data.article.title ?? "");
        setContent(data.editableField === "body" ? data.article.body : data.article.bodyHtml);
      });
  }, [siteKey, id]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const payload: Record<string, unknown> = { action: "update", title };
    if (editableField === "body") payload.body = content;
    else payload.bodyHtml = content;

    const res = await fetch(`/api/articles/${siteKey}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveMsg(data.error ?? "Save failed");
      return;
    }
    setSaveMsg("Saved.");
  }

  if (!article) {
    return (
      <>
        <TopNav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 text-sm text-muted">Loading...</main>
      </>
    );
  }

  const isStatic = editableField === "bodyHtml";

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <Link href={`/sites/${siteKey}`} className="mb-4 inline-block text-xs text-muted hover:text-foreground">
          ← Back to {siteKey}
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">Edit article</h1>
          <a
            href={String(article.url)}
            target="_blank"
            rel="noopener"
            className="text-xs text-accent-2 hover:underline"
          >
            View live ↗
          </a>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />

        <label className="mb-1 block text-xs font-medium text-muted">
          {isStatic ? "Body (HTML)" : "Body (Markdown)"}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          className="mb-2 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-accent"
        />
        {isStatic && (
          <p className="mb-5 text-xs text-muted">
            This is the raw article HTML (paragraphs, headings, links). The homepage and category
            listing excerpt won&apos;t update from this edit — only the article page itself.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saveMsg && <span className="text-xs text-muted">{saveMsg}</span>}
        </div>
      </main>
    </>
  );
}
