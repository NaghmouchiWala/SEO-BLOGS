"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, KeyRound, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, Page, PageHeader } from "@/components/ui";
import type { AhrefsDomainStats, AhrefsKeyword } from "@/lib/ahrefs";

type Row = AhrefsDomainStats | { domain: string; error: string };
type SortKey = "domain" | "domainRating" | "referringDomains" | "backlinks" | "organicTraffic" | "organicKeywords";

const COLS: { key: SortKey; label: string }[] = [
  { key: "domain", label: "Domain" },
  { key: "domainRating", label: "DR" },
  { key: "referringDomains", label: "Ref. domains" },
  { key: "backlinks", label: "Backlinks" },
  { key: "organicTraffic", label: "Organic traffic" },
  { key: "organicKeywords", label: "Keywords" },
];

const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString());

export default function RankingsPage() {
  const [state, setState] = useState<"loading" | "unconfigured" | "error" | "ready">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "domainRating", dir: -1 });
  const [open, setOpen] = useState<string | null>(null);
  const [kw, setKw] = useState<AhrefsKeyword[] | null>(null);

  async function load(refresh = false) {
    setState("loading");
    try {
      const res = await fetch(`/api/seo/rankings${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (data.configured === false) return setState("unconfigured");
      setRows(data.rows);
      setState("ready");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(domain: string) {
    if (open === domain) return setOpen(null);
    setOpen(domain);
    setKw(null);
    const res = await fetch(`/api/seo/rankings?keywords=${encodeURIComponent(domain)}`);
    const data = await res.json();
    setKw(data.ok ? data.data : []);
  }

  const sorted = useMemo(() => {
    const val = (r: Row, k: SortKey) => ("error" in r ? null : (r as AhrefsDomainStats)[k]);
    return [...rows].sort((a, b) => {
      const x = val(a, sort.key);
      const y = val(b, sort.key);
      if (x == null) return 1;
      if (y == null) return -1;
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
  }, [rows, sort]);

  return (
    <Page>
      <PageHeader
        title="Rankings"
        subtitle="Domain rating, backlinks, organic traffic and keywords for every site, from Ahrefs"
        actions={
          state === "ready" && (
            <button onClick={() => load(true)} className="btn-ghost">
              <RefreshCw size={16} /> Refresh
            </button>
          )
        }
      />

      {state === "loading" && <div className="skeleton h-72" />}
      {state === "error" && <ErrorState title="Could not load rankings" detail={err} onRetry={() => load()} />}

      {state === "unconfigured" && (
        <EmptyState
          icon={<KeyRound size={40} strokeWidth={1.5} />}
          title="Connect Ahrefs to see rankings"
          text="Add an Ahrefs API v3 token as AHREFS_API_TOKEN in .env.local on the server (an Ahrefs plan with API access is required), then restart the dashboard. Results are cached for 12 hours to save API units."
        />
      )}

      {state === "ready" && (
        <div className="card !p-0 overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    className={c.key === "domain" ? "" : "num"}
                    aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                  >
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
                  <tr className="cursor-pointer" onClick={() => !("error" in r) && toggle(r.domain)}>
                    <td className="font-[family-name:var(--font-mono)] text-[13px]">{r.domain}</td>
                    {"error" in r ? (
                      <td colSpan={5} className="text-xs text-danger">{r.error}</td>
                    ) : (
                      <>
                        <td className="num font-semibold">{fmt(r.domainRating)}</td>
                        <td className="num">{fmt(r.referringDomains)}</td>
                        <td className="num">{fmt(r.backlinks)}</td>
                        <td className="num">{fmt(r.organicTraffic)}</td>
                        <td className="num">{fmt(r.organicKeywords)}</td>
                      </>
                    )}
                  </tr>
                  {open === r.domain && (
                    <tr key={r.domain + "-kw"}>
                      <td colSpan={6} className="!bg-background/50">
                        {!kw ? (
                          <div className="skeleton h-16" />
                        ) : kw.length === 0 ? (
                          <span className="text-xs text-muted">No ranking keywords found.</span>
                        ) : (
                          <table className="tbl">
                            <thead><tr><th>Keyword</th><th className="num">Position</th><th className="num">Volume</th><th className="num">Traffic</th><th>Ranking URL</th></tr></thead>
                            <tbody>
                              {kw.map((k) => (
                                <tr key={k.keyword}>
                                  <td>{k.keyword}</td>
                                  <td className="num">{fmt(k.position)}</td>
                                  <td className="num">{fmt(k.volume)}</td>
                                  <td className="num">{fmt(k.traffic)}</td>
                                  <td className="max-w-[280px] truncate font-[family-name:var(--font-mono)] text-xs text-muted">{k.url}</td>
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
      )}
    </Page>
  );
}
