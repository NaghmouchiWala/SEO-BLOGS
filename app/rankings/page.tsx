"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, KeyRound, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader } from "@/components/ui";
import type { SearchRow, SearchSummary } from "@/lib/gsc";
import type { AuthorityRow } from "@/lib/openPageRank";

type Tab = "google" | "bing" | "authority";

const TABS: { id: Tab; label: string }[] = [
  { id: "google", label: "Google Search Console" },
  { id: "bing", label: "Bing Webmaster" },
  { id: "authority", label: "Domain authority" },
];

const SETUP: Record<Tab, { title: string; steps: string }> = {
  google: {
    title: "Connect Google Search Console",
    steps:
      "Create a Google Cloud service account, enable the Search Console API, download its JSON key to the server and set GSC_SERVICE_ACCOUNT_FILE in .env.local. Then add the service account's email as a user on each domain's Search Console property.",
  },
  bing: {
    title: "Connect Bing Webmaster Tools",
    steps:
      "In Bing Webmaster Tools open Settings → API access, generate an API key and set BING_WEBMASTER_API_KEY in .env.local. Each site must be added and verified in the same Bing account.",
  },
  authority: {
    title: "Connect Open PageRank",
    steps: "Get a free API key at domcop.com/openpagerank and set OPEN_PAGERANK_API_KEY in .env.local.",
  },
};

const n = (v: number | null | undefined, d = 0) => (v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));

type SumKey = "domain" | "clicks" | "impressions" | "ctr" | "position";

function SearchTable({ source }: { source: "google" | "bing" }) {
  const [state, setState] = useState<"loading" | "unconfigured" | "error" | "ready">("loading");
  const [rows, setRows] = useState<SearchSummary[]>([]);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState<{ key: SumKey; dir: 1 | -1 }>({ key: "clicks", dir: -1 });
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<SearchRow[] | null>(null);
  const [detailErr, setDetailErr] = useState("");

  const load = useCallback(
    async (refresh = false) => {
      setState("loading");
      try {
        const res = await fetch(`/api/seo/search?source=${source}${refresh ? "&refresh=1" : ""}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (data.configured === false) return setState("unconfigured");
        setRows(data.rows);
        setState("ready");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        setState("error");
      }
    },
    [source]
  );
  useEffect(() => {
    load();
  }, [load]);

  async function toggle(domain: string) {
    if (open === domain) return setOpen(null);
    setOpen(domain);
    setDetail(null);
    setDetailErr("");
    const res = await fetch(`/api/seo/search?source=${source}&domain=${encodeURIComponent(domain)}`);
    const data = await res.json();
    if (!res.ok) return setDetailErr(data.error ?? `HTTP ${res.status}`);
    setDetail(data.rows);
  }

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.error && !b.error) return 1;
        if (b.error && !a.error) return -1;
        const x = a[sort.key];
        const y = b[sort.key];
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      }),
    [rows, sort]
  );

  if (state === "loading") return <div className="skeleton h-72" />;
  if (state === "error") return <ErrorState title="Could not load data" detail={err} onRetry={() => load()} />;
  if (state === "unconfigured") return <Setup tab={source} />;

  const cols: { key: SumKey; label: string; show: boolean }[] = [
    { key: "domain", label: "Domain", show: true },
    { key: "clicks", label: "Clicks (28d)", show: true },
    { key: "impressions", label: "Impressions", show: true },
    { key: "ctr", label: "CTR", show: true },
    { key: "position", label: "Avg position", show: source === "google" },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button onClick={() => load(true)} className="btn-ghost">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      <div className="card !p-0 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              {cols.filter((c) => c.show).map((c) => (
                <th key={c.key} className={c.key === "domain" ? "" : "num"} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button
                    className={`inline-flex items-center gap-1 uppercase tracking-[0.08em] ${sort.key === c.key ? "text-accent" : ""}`}
                    onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : -1 }))}
                  >
                    {c.label}
                    {sort.key === c.key && <ChevronDown size={12} className={sort.dir === 1 ? "rotate-180" : ""} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <Fragment key={r.domain}>
                <tr className={r.error ? "" : "cursor-pointer"} onClick={() => !r.error && toggle(r.domain)}>
                  <td className="font-[family-name:var(--font-mono)] text-[13px]">{r.domain}</td>
                  {r.error ? (
                    <td colSpan={cols.filter((c) => c.show).length - 1} className="text-xs text-warn" title={r.error}>
                      Not available — {r.error.includes("403") || r.error.includes("404") ? "site not verified for this account" : r.error.slice(0, 90)}
                    </td>
                  ) : (
                    <>
                      <td className="num font-semibold">{n(r.clicks)}</td>
                      <td className="num">{n(r.impressions)}</td>
                      <td className="num">{(r.ctr * 100).toFixed(1)}%</td>
                      {source === "google" && <td className="num">{n(r.position, 1)}</td>}
                    </>
                  )}
                </tr>
                {open === r.domain && (
                  <tr>
                    <td colSpan={5} className="!bg-background/50">
                      {detailErr ? (
                        <span className="text-xs text-danger">{detailErr}</span>
                      ) : !detail ? (
                        <div className="skeleton h-16" />
                      ) : detail.length === 0 ? (
                        <span className="text-xs text-muted">No queries in the last 28 days.</span>
                      ) : (
                        <table className="tbl">
                          <thead>
                            <tr><th>Query</th><th className="num">Clicks</th><th className="num">Impressions</th><th className="num">CTR</th><th className="num">Position</th></tr>
                          </thead>
                          <tbody>
                            {detail.map((k) => (
                              <tr key={k.key}>
                                <td>{k.key}</td>
                                <td className="num">{n(k.clicks)}</td>
                                <td className="num">{n(k.impressions)}</td>
                                <td className="num">{(k.ctr * 100).toFixed(1)}%</td>
                                <td className="num">{n(k.position, 1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Setup({ tab }: { tab: Tab }) {
  return <EmptyState icon={<KeyRound size={40} strokeWidth={1.5} />} title={SETUP[tab].title} text={SETUP[tab].steps} />;
}

function AuthorityTable() {
  const [state, setState] = useState<"loading" | "unconfigured" | "error" | "ready">("loading");
  const [rows, setRows] = useState<AuthorityRow[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async (refresh = false) => {
    setState("loading");
    try {
      const res = await fetch(`/api/seo/search?source=authority${refresh ? "&refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (data.configured === false) return setState("unconfigured");
      setRows([...data.rows].sort((a: AuthorityRow, b: AuthorityRow) => (b.pageRank ?? -1) - (a.pageRank ?? -1)));
      setState("ready");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") return <div className="skeleton h-72" />;
  if (state === "error") return <ErrorState title="Could not load authority scores" detail={err} onRetry={() => load()} />;
  if (state === "unconfigured") return <Setup tab="authority" />;

  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr><th>Domain</th><th className="num">Authority (0–10)</th><th className="num">Global rank</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.domain}>
              <td className="font-[family-name:var(--font-mono)] text-[13px]">{r.domain}</td>
              <td className="num font-semibold">{r.pageRank != null ? r.pageRank.toFixed(2) : "—"}</td>
              <td className="num">{n(r.rank)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RankingsPage() {
  const [tab, setTab] = useState<Tab>("google");
  return (
    <Page>
      <PageHeader title="Rankings" subtitle="Real search performance from Google and Bing, plus domain authority, for every site" />
      <div role="tablist" className="mb-5 inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground aria-selected:bg-accent aria-selected:font-semibold aria-selected:text-ink"
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "authority" ? <AuthorityTable /> : <SearchTable key={tab} source={tab} />}
    </Page>
  );
}
