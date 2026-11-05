"use client";

import { useState } from "react";
import { Bot, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader, ScoreRing, SiteSelect } from "@/components/ui";
import { SITE_LIST } from "@/lib/sites";
import type { SiteAudit } from "@/lib/seoAudit";

const OPTIONS = SITE_LIST.map((s) => ({ value: s.key, label: `${s.displayName} — ${s.domain}` }));

function Row({ ok, title, text }: { ok: boolean | null; title: string; text: string }) {
  const Icon = ok === true ? CheckCircle2 : ok === false ? XCircle : MinusCircle;
  const color = ok === true ? "text-success" : ok === false ? "text-danger" : "text-muted";
  return (
    <div className="flex min-h-14 items-center gap-3 px-5 py-3">
      <Icon size={20} className={color} aria-label={ok === true ? "Passed" : ok === false ? "Failing" : "Unknown"} />
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted">{text}</div>
      </div>
    </div>
  );
}

export default function GeoPage() {
  const [siteKey, setSiteKey] = useState(OPTIONS[0].value);
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/audit/${siteKey}?pages=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAudit(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const g = audit?.geo;
  const checks = g
    ? [g.llmsTxt, g.hasOrganizationSchema, g.hasArticleSchema, g.hasFaqSchema, g.sitemapFound, !Object.values(g.aiBots).includes("blocked")]
    : [];
  const passed = checks.filter(Boolean).length;

  return (
    <Page>
      <PageHeader
        title="GEO / AI visibility"
        subtitle="How ready the site is to be read and cited by ChatGPT, Claude, Perplexity and Google AI answers"
        actions={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <SiteSelect value={siteKey} onChange={(v) => { setSiteKey(v); setAudit(null); }} options={OPTIONS} />
            <button onClick={run} disabled={loading} className="btn-primary w-full sm:w-auto">
              <Bot size={16} /> {loading ? "Checking..." : "Check site"}
            </button>
          </div>
        }
      />

      {error && <ErrorState title="Check failed" detail={error} onRetry={run} />}
      {loading && <div className="skeleton h-72" />}
      {!loading && !audit && !error && (
        <EmptyState
          icon={<Bot size={40} strokeWidth={1.5} />}
          title="No GEO check yet"
          text="Choose a site to test llms.txt, AI-crawler rules in robots.txt and the structured data AI answers rely on."
          action={<button onClick={run} className="btn-primary">Run first check</button>}
        />
      )}

      {audit && g && !loading && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="card flex flex-col items-center">
              <ScoreRing score={audit.geoScore} label="GEO score" />
              <div className="mt-3 text-sm font-medium">{passed} of {checks.length} signals ready</div>
              <div className="font-[family-name:var(--font-mono)] text-xs text-muted">{audit.domain}</div>
            </div>
            <div className="card">
              <div className="label mb-3">AI crawlers (robots.txt)</div>
              <ul className="space-y-2">
                {Object.entries(g.aiBots).map(([bot, st]) => (
                  <li key={bot} className="flex items-center justify-between text-sm">
                    <span className="font-[family-name:var(--font-mono)] text-xs">{bot}</span>
                    <span className={`badge border ${st === "blocked" ? "border-danger/30 bg-danger/15 text-danger" : st === "allowed" ? "border-success/30 bg-success/15 text-success" : "border-border bg-surface-2 text-muted"}`}>
                      {st === "unspecified" ? "default (allowed)" : st}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="card !p-0 divide-y divide-border/60">
              <Row ok={g.llmsTxt} title="llms.txt" text="A plain-text summary at /llms.txt that tells LLM crawlers what the site is and which pages matter." />
              <Row ok={g.llmsFullTxt} title="llms-full.txt (optional)" text="Full-content version for LLMs that ingest the whole site." />
              <Row ok={g.hasOrganizationSchema} title="Organization / WebSite schema" text="Entity facts (name, logo, URL, sameAs) that answer engines use to identify the brand." />
              <Row ok={g.hasArticleSchema} title="Article / BlogPosting schema" text="Marks author, date and headline so articles are citable with correct attribution." />
              <Row ok={g.hasFaqSchema} title="FAQPage / HowTo schema" text="Question-and-answer markup is the most reused format in AI answers." />
              <Row ok={g.sitemapFound} title="XML sitemap" text={g.sitemapFound ? `${g.sitemapUrlCount} URLs listed.` : "No sitemap.xml found."} />
              <Row ok={!Object.values(g.aiBots).includes("blocked")} title="AI crawlers allowed" text="robots.txt does not block GPTBot, ClaudeBot, PerplexityBot or Google-Extended." />
            </div>
            {g.structuredDataTypes.length > 0 && (
              <p className="mt-4 text-xs text-muted">
                Schema types found on sampled pages:{" "}
                <span className="font-[family-name:var(--font-mono)]">{g.structuredDataTypes.join(", ")}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
