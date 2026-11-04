"use client";

import { useState } from "react";
import { ScanSearch } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader, ScoreRing, SeverityBadge, SiteSelect } from "@/components/ui";
import { SITE_LIST } from "@/lib/sites";
import type { SiteAudit, Severity } from "@/lib/seoAudit";

const OPTIONS = SITE_LIST.map((s) => ({ value: s.key, label: `${s.displayName} — ${s.domain}` }));

export default function SeoAuditPage() {
  const [siteKey, setSiteKey] = useState(OPTIONS[0].value);
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/audit/${siteKey}?pages=12`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAudit(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const groups: { sev: Severity; title: string }[] = [
    { sev: "error", title: "Critical" },
    { sev: "warning", title: "Warnings" },
    { sev: "notice", title: "Notices" },
  ];

  return (
    <Page>
      <PageHeader
        title="SEO audit"
        subtitle="Live crawl of the public site: titles, meta, headings, structured data, robots, sitemap and speed"
        actions={
          <div className="flex items-center gap-3">
            <SiteSelect value={siteKey} onChange={(v) => { setSiteKey(v); setAudit(null); }} options={OPTIONS} />
            <button onClick={run} disabled={loading} className="btn-primary">
              <ScanSearch size={16} /> {loading ? "Auditing..." : "Run audit"}
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Audit failed" detail={error} onRetry={run} />}

      {loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-52" /><div className="skeleton h-52" /><div className="skeleton h-52" />
        </div>
      )}

      {!loading && !audit && !error && (
        <EmptyState
          icon={<ScanSearch size={40} strokeWidth={1.5} />}
          title="No audit yet"
          text="Pick a site and run an audit. It crawls the homepage plus a sample of pages from the sitemap."
          action={<button onClick={run} className="btn-primary">Run first audit</button>}
        />
      )}

      {audit && !loading && (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="card flex items-center gap-6">
              <ScoreRing score={audit.score} label="Overall score" />
              <div>
                <div className="label">Overall</div>
                <div className="mt-1 font-[family-name:var(--font-mono)] text-sm">{audit.domain}</div>
                <div className="mt-2 text-xs text-muted">{audit.pages.length} pages · {new Date(audit.auditedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="card flex items-center gap-6">
              <ScoreRing score={audit.seoScore} size={96} stroke={8} label="SEO score" />
              <div><div className="label">On-page SEO</div><p className="mt-1 text-xs text-muted">Titles, meta, headings, images, links</p></div>
            </div>
            <div className="card flex items-center gap-6">
              <ScoreRing score={audit.geoScore} size={96} stroke={8} label="GEO score" />
              <div><div className="label">GEO readiness</div><p className="mt-1 text-xs text-muted">llms.txt, AI bots, structured data</p></div>
            </div>
          </div>

          <div className="mb-8 space-y-6">
            {groups.map(({ sev, title }) => {
              const list = audit.issues.filter((i) => i.severity === sev);
              if (!list.length) return null;
              return (
                <section key={sev}>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <span className="badge border border-border bg-surface-2 text-muted tabular-nums">{list.length}</span>
                  </div>
                  <div className="card !p-0 divide-y divide-border/60">
                    {list.map((i, idx) => (
                      <div key={i.id + idx} className="flex items-start gap-3 px-5 py-3">
                        <SeverityBadge severity={i.severity} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm">{i.title}</div>
                          {i.detail && <div className="text-xs text-muted">{i.detail}</div>}
                          {i.url && <div className="truncate font-[family-name:var(--font-mono)] text-xs text-subtle">{i.url}</div>}
                        </div>
                        <span className="badge border border-border bg-surface-2 text-muted uppercase">{i.category}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            {audit.issues.length === 0 && (
              <EmptyState title="No issues found" text="Every check passed on the sampled pages." />
            )}
          </div>

          <h2 className="mb-2 text-sm font-semibold">Audited pages</h2>
          <div className="card !p-0 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>URL</th><th className="num">Status</th><th className="num">Title</th><th className="num">Meta</th>
                  <th className="num">H1</th><th className="num">Words</th><th className="num">Img no alt</th><th>Schema</th><th className="num">ms</th>
                </tr>
              </thead>
              <tbody>
                {audit.pages.map((p) => (
                  <tr key={p.url}>
                    <td className="max-w-[360px] truncate font-[family-name:var(--font-mono)] text-xs">
                      <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-accent">{p.url.replace(/^https?:\/\//, "")}</a>
                    </td>
                    <td className={`num ${p.status === 200 ? "" : "text-danger"}`}>{p.status || "—"}</td>
                    <td className="num">{p.titleLength}</td>
                    <td className="num">{p.descriptionLength}</td>
                    <td className="num">{p.h1Count}</td>
                    <td className="num">{p.wordCount}</td>
                    <td className={`num ${p.imagesMissingAlt ? "text-warn" : ""}`}>{p.imagesMissingAlt}</td>
                    <td className="text-xs text-muted">{p.jsonLdTypes.slice(0, 3).join(", ") || "—"}</td>
                    <td className={`num ${p.ms > 2500 ? "text-warn" : ""}`}>{p.ms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Page>
  );
}
