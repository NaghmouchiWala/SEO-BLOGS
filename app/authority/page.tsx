"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2, Network, Search } from "lucide-react";
import { ErrorState, Page, PageHeader, StatCard } from "@/components/ui";
import { ChartCard, ChartLegend, DrScale, DrUrBars, DrUrTable, type AuthRow } from "@/components/charts";

type Snapshot = {
  source: string;
  checkedAt: string;
  note: string;
  rows: AuthRow[];
  plan: { done: string[]; todo: string[] };
};

type Entry = { links?: number; pages?: number; newSources?: string[]; sources?: string[]; pageRank?: number | null; error?: string };
type History = { at: string; sites: Record<string, Entry> }[];

const ACTIONS = [
  { href: "/links", icon: Network, title: "Fix internal links", text: "Find pages nobody links to and broken links. Internal links lift UR without needing anyone else." },
  { href: "/opportunities", icon: Link2, title: "Get real backlinks", text: "Researched directories, media and profiles where a genuine link can be earned." },
  { href: "/keywords", icon: Search, title: "Find topics people search", text: "Keyword and question ideas for articles worth linking to." },
];

export default function AuthorityPage() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [err, setErr] = useState("");
  const [hist, setHist] = useState<History>([]);

  useEffect(() => {
    fetch("/api/seo/backlinks")
      .then((r) => r.json())
      .then((d) => setHist(d.history ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/seo/authority-snapshot");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSnap(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const measured = snap?.rows.filter((r) => r.status === "ok") ?? [];
  const drValues = measured.map((r) => r.dr).filter((v): v is number => v != null);
  const best = drValues.length ? Math.max(...drValues) : null;
  const bestDomain = measured.find((r) => r.dr === best)?.domain;
  const avg = drValues.length ? drValues.reduce((a, b) => a + b, 0) / drValues.length : null;
  const pending = snap?.rows.filter((r) => r.status === "pending").length ?? 0;
  const sorted = snap ? [...snap.rows].sort((a, b) => (b.dr ?? -1) - (a.dr ?? -1) || (b.ur ?? -1) - (a.ur ?? -1)) : [];

  return (
    <Page>
      <PageHeader title="Authority" subtitle="Domain Rating (DR) and URL Rating (UR) across the network, and what moves them" />

      {err && <ErrorState title="Could not load the DR/UR snapshot" detail={err} onRetry={load} />}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {snap ? (
          <>
            <StatCard label="Domains measured" value={`${measured.length}/${snap.rows.length}`} hint={pending ? `${pending} pending (checker rate limit)` : "all measured"} />
            <StatCard label="Average DR" value={avg == null ? "—" : avg.toFixed(1)} hint="of domains with a DR value" />
            <StatCard label="Best DR" value={best ?? "—"} hint={bestDomain} />
            <StatCard label="Checked" value={snap.checkedAt} hint="refresh monthly: DR moves slowly" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[118px]" />)
        )}
      </div>

      {snap && (
        <div className="mb-8 space-y-4">
          <ChartCard
            title="DR and UR per site"
            subtitle="Both on one shared axis. UR is the homepage's URL Rating."
            legend={<ChartLegend items={[{ label: "DR — Domain Rating", color: "var(--series-1)" }, { label: "UR — homepage URL Rating", color: "var(--series-2)" }]} />}
            chart={<DrUrBars rows={sorted} />}
            table={<DrUrTable rows={sorted} />}
          />
          <ChartCard
            title="Where the network sits on the full DR scale"
            subtitle="0–100. Anything under 10 is considered new; 50+ is strong."
            chart={<DrScale rows={sorted} />}
            table={<DrUrTable rows={sorted} />}
          />
          <p className="text-xs text-muted">
            Source: {snap.source}. {snap.note}
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold">Backlink monitor</h2>
        <p className="mb-3 text-xs text-muted">
          Checked automatically every week from Bing Webmaster Tools (inbound links it knows about) and Open PageRank (0–10 authority estimate).
          {hist.length > 0 && ` Last check: ${new Date(hist[hist.length - 1].at).toLocaleDateString()}.`}
        </p>
        {hist.length === 0 ? (
          <p className="card text-sm text-muted">The first weekly check has not run yet.</p>
        ) : (
          <div className="card !p-0 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th className="num">Links (Bing)</th>
                  <th className="num">Change</th>
                  <th className="num">New this week</th>
                  <th className="num">Open PageRank</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(hist[hist.length - 1].sites).map(([d, e]) => {
                  const first = hist[0].sites[d]?.links;
                  const change = e.links != null && first != null ? e.links - first : null;
                  return (
                    <tr key={d}>
                      <td className="font-[family-name:var(--font-mono)] text-[13px]">{d}</td>
                      <td className="num">{e.error ? <span className="text-xs text-warn" title={e.error}>not available</span> : e.links ?? "—"}</td>
                      <td className="num">{change == null ? "—" : change > 0 ? `+${change}` : change}</td>
                      <td className="num">{e.newSources?.length ?? 0}</td>
                      <td className="num">{e.pageRank == null ? "—" : e.pageRank.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {hist.length > 0 && Object.entries(hist[hist.length - 1].sites).some(([, e]) => (e.newSources?.length ?? 0) > 0) && (
          <div className="card mt-3">
            <h3 className="mb-2 text-sm font-semibold text-success">New links found</h3>
            <ul className="space-y-1 text-xs">
              {Object.entries(hist[hist.length - 1].sites).flatMap(([d, e]) => (e.newSources ?? []).map((u) => (
                <li key={d + u} className="break-all"><span className="font-[family-name:var(--font-mono)] text-muted">{d}</span> ← {u}</li>
              )))}
            </ul>
          </div>
        )}
      </section>

      <h2 className="mb-3 text-sm font-semibold">What to do next</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {ACTIONS.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="card block">
            <Icon size={20} strokeWidth={1.5} className="mb-3 text-accent" />
            <div className="mb-1 flex items-center justify-between font-semibold">
              {title} <ArrowRight size={14} className="text-muted" />
            </div>
            <p className="text-sm text-muted">{text}</p>
          </Link>
        ))}
      </div>

      {snap && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-success">Already improved</h2>
            <ul className="space-y-2 text-sm">
              {snap.plan.done.map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="mb-1 text-sm font-semibold text-accent">To raise DR and UR further</h2>
            <p className="mb-3 text-xs text-muted">DR and UR come from links on other websites, so the biggest steps happen off-site.</p>
            <ul className="space-y-2 text-sm">
              {snap.plan.todo.map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Page>
  );
}
