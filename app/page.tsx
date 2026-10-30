"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

type SiteSummary = {
  key: string;
  domain: string;
  displayName: string;
  kind: "points" | "static";
  articleCount: number;
  unreviewedCount: number;
  cronHealth: {
    lastRunAt: string | null;
    lastRunSucceeded: boolean | null;
    lastRunSummary: string | null;
  };
};

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "<1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardHome() {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => setSites(data.sites));
  }, []);

  const totalUnreviewed = sites?.reduce((sum, s) => sum + s.unreviewedCount, 0) ?? 0;
  const totalArticles = sites?.reduce((sum, s) => sum + s.articleCount, 0) ?? 0;

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
          Overview
        </h1>
        <p className="mb-8 text-sm text-muted">
          {sites ? `${sites.length} sites · ${totalArticles} auto-generated articles tracked · ${totalUnreviewed} awaiting review` : "Loading..."}
        </p>

        {!sites && <div className="text-sm text-muted">Loading sites...</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites?.map((site) => (
            <Link
              key={site.key}
              href={`/sites/${site.key}`}
              className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-foreground group-hover:text-accent-2">
                    {site.displayName}
                  </h2>
                  <p className="text-xs text-muted">{site.domain}</p>
                </div>
                <span
                  className={`badge ${
                    site.cronHealth.lastRunSucceeded === false
                      ? "bg-danger/15 text-danger"
                      : site.cronHealth.lastRunSucceeded === true
                        ? "bg-accent-2/15 text-accent-2"
                        : "bg-surface-2 text-muted"
                  }`}
                >
                  {site.cronHealth.lastRunSucceeded === false
                    ? "Last run failed"
                    : site.cronHealth.lastRunSucceeded === true
                      ? "Healthy"
                      : "No runs yet"}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-4 text-xs text-muted">
                <span>{site.articleCount} articles</span>
                {site.unreviewedCount > 0 && (
                  <span className="font-medium text-warn">{site.unreviewedCount} unreviewed</span>
                )}
              </div>

              <div className="border-t border-border pt-3 text-xs text-muted">
                Last run: {timeAgo(site.cronHealth.lastRunAt)}
                {site.cronHealth.lastRunSummary && (
                  <p className="mt-1 truncate text-muted/80">{site.cronHealth.lastRunSummary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
