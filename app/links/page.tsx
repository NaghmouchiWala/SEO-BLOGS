"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader, SiteSelect, StatCard } from "@/components/ui";
import { SITE_LIST } from "@/lib/sites";
import type { LinkReport, PageLinks } from "@/lib/internalLinks";

const OPTIONS = SITE_LIST.map((s) => ({ value: s.key, label: `${s.displayName} — ${s.domain}` }));

function PageTable({ rows, empty, cols }: { rows: PageLinks[]; empty: string; cols: ("inbound" | "outbound")[] }) {
  if (!rows.length) return <p className="px-5 py-4 text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>Page</th>
            {cols.includes("inbound") && <th className="num">Links in</th>}
            {cols.includes("outbound") && <th className="num">Links out</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.url}>
              <td className="max-w-[560px] truncate font-[family-name:var(--font-mono)] text-xs">
                <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-accent">{r.path}</a>
              </td>
              {cols.includes("inbound") && <td className="num">{r.inbound}</td>}
              {cols.includes("outbound") && <td className="num">{r.outbound}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card !p-0 overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      {children}
    </section>
  );
}

export default function LinksPage() {
  const [siteKey, setSiteKey] = useState(OPTIONS[0].value);
  const [report, setReport] = useState<LinkReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(refresh = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/links/${siteKey}${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Internal links"
        subtitle="Which pages nobody links to, which are weakly linked, and which links are broken. Strong internal links raise the UR of your own pages."
        actions={
          <div className="flex items-center gap-3">
            <SiteSelect value={siteKey} onChange={(v) => { setSiteKey(v); setReport(null); }} options={OPTIONS} />
            <button onClick={() => run()} disabled={loading} className="btn-primary">
              <Network size={16} /> {loading ? "Crawling..." : "Analyze"}
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Analysis failed" detail={error} onRetry={() => run()} />}
      {loading && <div className="grid gap-4 sm:grid-cols-4"><div className="skeleton h-[118px]" /><div className="skeleton h-[118px]" /><div className="skeleton h-[118px]" /><div className="skeleton h-[118px]" /></div>}

      {!loading && !report && !error && (
        <EmptyState
          icon={<Network size={40} strokeWidth={1.5} />}
          title="No analysis yet"
          text="Pick a site and click Analyze. It reads the sitemap and every page (up to 250), so it can take up to a minute."
          action={<button onClick={() => run()} className="btn-primary">Analyze this site</button>}
        />
      )}

      {report && !loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pages crawled" value={report.pages} hint={report.truncated ? "first 250 of the sitemap" : "whole sitemap"} />
            <StatCard label="Avg links in / page" value={report.avgInbound.toFixed(1)} hint="from page content, not menus" />
            <StatCard label="Orphan pages" value={report.orphans.length} hint="no page links to them" />
            <StatCard label="Broken links" value={report.broken.length} hint="internal, 4xx or unreachable" />
          </div>

          <Section title="Orphan pages" hint="No other page links to these. Link to them from related articles or from a hub page.">
            <PageTable rows={report.orphans} empty="No orphan pages. Every page is linked from at least one other page." cols={["outbound"]} />
          </Section>
          <Section title="Weakly linked pages" hint="Only one page links to each of these. Two or three contextual links make a page far easier to find.">
            <PageTable rows={report.weak} empty="No weakly linked pages." cols={["inbound", "outbound"]} />
          </Section>
          <Section title="Strongest pages" hint="Most linked pages: link from these to the pages you want to lift.">
            <PageTable rows={report.top} empty="Nothing to show." cols={["inbound", "outbound"]} />
          </Section>
          <Section title="Pages that link out to almost nothing" hint="Fewer than 2 links to other pages: dead ends for visitors and crawlers.">
            <PageTable rows={report.fewOutbound} empty="Every page links to at least two others." cols={["outbound"]} />
          </Section>
          <Section title="Broken internal links" hint="Links on your pages that point to a missing page.">
            {report.broken.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No broken internal links found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Broken target</th><th className="num">Status</th><th>Linked from</th></tr></thead>
                  <tbody>
                    {report.broken.map((b) => (
                      <tr key={b.target}>
                        <td className="max-w-[360px] truncate font-[family-name:var(--font-mono)] text-xs">{b.target.replace(/^https?:\/\//, "")}</td>
                        <td className="num text-danger">{b.status || "no response"}</td>
                        <td className="max-w-[360px] truncate font-[family-name:var(--font-mono)] text-xs text-muted">{b.from.map((f) => f.replace(/^https?:\/\/[^/]+/, "")).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          <p className="text-xs text-muted">Crawled {new Date(report.crawledAt).toLocaleString()}. Results are cached for 6 hours.</p>
        </div>
      )}
    </Page>
  );
}
