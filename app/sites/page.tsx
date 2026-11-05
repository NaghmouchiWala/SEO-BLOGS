"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Page, PageHeader } from "@/components/ui";

type Row = {
  key: string;
  domain: string;
  displayName: string;
  kind: "points" | "static";
  articleCount: number;
  unreviewedCount: number;
  cronHealth: { lastRunAt: string | null; lastRunSucceeded: boolean | null };
};

export default function SitesIndex() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    fetch("/api/sites").then((r) => r.json()).then((d) => setRows(d.sites));
  }, []);

  return (
    <Page>
      <PageHeader title="Sites & articles" subtitle="Review, edit, publish or generate articles per site" />
      <div className="card !p-0 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Site</th>
              <th className="hidden sm:table-cell">Type</th>
              <th className="num">Articles</th>
              <th className="num">Unreviewed</th>
              <th>Last run</th>
            </tr>
          </thead>
          <tbody>
            {!rows && (
              <tr><td colSpan={5}><div className="skeleton h-6" /></td></tr>
            )}
            {rows?.map((r) => (
              <tr key={r.key}>
                <td>
                  <Link href={`/sites/${r.key}`} className="font-medium hover:text-accent">{r.displayName}</Link>
                  <div className="font-[family-name:var(--font-mono)] text-xs text-muted">{r.domain}</div>
                </td>
                <td className="hidden text-muted sm:table-cell">{r.kind === "points" ? "Next.js / MDX" : "Static HTML"}</td>
                <td className="num">{r.articleCount}</td>
                <td className="num">{r.unreviewedCount > 0 ? <span className="text-warn">{r.unreviewedCount}</span> : 0}</td>
                <td className="text-muted">
                  {r.cronHealth.lastRunAt ? new Date(r.cronHealth.lastRunAt).toLocaleString() : "never"}
                  {r.cronHealth.lastRunSucceeded === false && <span className="ml-2 text-danger">failed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
