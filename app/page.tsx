"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Page, PageHeader, StatCard } from "@/components/ui";

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
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hours < 1) return "<1h ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardHome() {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => setSites(data.sites));
  }, []);

  const totalUnreviewed = sites?.reduce((s, x) => s + x.unreviewedCount, 0) ?? 0;
  const totalArticles = sites?.reduce((s, x) => s + x.articleCount, 0) ?? 0;
  const healthy = sites?.filter((s) => s.cronHealth.lastRunSucceeded === true).length ?? 0;
  const failing = sites?.filter((s) => s.cronHealth.lastRunSucceeded === false).length ?? 0;

  return (
    <Page>
      <PageHeader title="Overview" subtitle="Daily generation health and review queue across the Galylio blog network" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sites ? (
          <>
            <StatCard label="Sites" value={sites.length} hint="points.tn + satellites" />
            <StatCard label="Auto articles" value={totalArticles} hint="tracked by the generators" />
            <StatCard label="Awaiting review" value={totalUnreviewed} hint="mark as reviewed in each site" />
            <StatCard label="Healthy runs" value={`${healthy}/${sites.length}`} hint={failing ? `${failing} failing` : "no failures"} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[118px]" />)
        )}
      </div>

      <div className="mb-3 label">Sites</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!sites && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-[150px]" />)}
        {sites?.map((site) => {
          const s = site.cronHealth.lastRunSucceeded;
          return (
            <Link key={site.key} href={`/sites/${site.key}`} className="card block">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{site.displayName}</h2>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-muted">{site.domain}</p>
                </div>
                <span
                  className={`badge border ${
                    s === false
                      ? "border-danger/30 bg-danger/15 text-danger"
                      : s === true
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-border bg-surface-2 text-muted"
                  }`}
                >
                  {s === false ? "Last run failed" : s === true ? "Healthy" : "No runs yet"}
                </span>
              </div>
              <div className="mb-3 flex items-center gap-4 text-xs text-muted">
                <span className="tabular-nums">{site.articleCount} articles</span>
                {site.unreviewedCount > 0 && <span className="font-medium text-warn tabular-nums">{site.unreviewedCount} unreviewed</span>}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                <span className="min-w-0 truncate">Last run {timeAgo(site.cronHealth.lastRunAt)}</span>
                <ArrowUpRight size={14} className="shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
