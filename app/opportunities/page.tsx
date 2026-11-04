"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Lightbulb } from "lucide-react";
import { ErrorState, Page, PageHeader } from "@/components/ui";

type Item = { name: string; url?: string; status: "standard" | "verify" | "old" | "idea"; note: string; source?: string };
type Data = {
  researchedAt: string;
  disclaimer: string;
  groups: { title: string; intro: string; items: Item[] }[];
  avoid: string[];
};

const STATUS: Record<Item["status"], { label: string; cls: string }> = {
  standard: { label: "Free, standard", cls: "border-success/30 bg-success/15 text-success" },
  verify: { label: "Lead — verify first", cls: "border-warn/30 bg-warn/15 text-warn" },
  old: { label: "Possibly inactive", cls: "border-danger/30 bg-danger/15 text-danger" },
  idea: { label: "Idea", cls: "border-info/30 bg-info/15 text-info" },
};

export default function OpportunitiesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/seo/opportunities");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Page>
      <PageHeader title="Link opportunities" subtitle="Where a real backlink can be earned for the Tunisian sites. DR and UR only grow when other websites link to yours." />

      {err && <ErrorState title="Could not load opportunities" detail={err} onRetry={load} />}
      {!data && !err && <div className="skeleton h-72" />}

      {data && (
        <div className="space-y-6">
          <div className="card flex gap-3 !border-warn/40">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-sm">
              <span className="font-medium">Researched {data.researchedAt}. </span>
              {data.disclaimer}
            </p>
          </div>

          {data.groups.map((g) => (
            <section key={g.title}>
              <h2 className="text-sm font-semibold">{g.title}</h2>
              <p className="mb-3 text-xs text-muted">{g.intro}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((it) => (
                  <div key={it.name} className="card">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        {it.status === "idea" && <Lightbulb size={15} className="text-accent" />}
                        {it.name}
                      </h3>
                      <span className={`badge shrink-0 border ${STATUS[it.status].cls}`}>{STATUS[it.status].label}</span>
                    </div>
                    <p className="text-sm text-muted">{it.note}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      {it.url && (
                        <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                          Open <ExternalLink size={12} />
                        </a>
                      )}
                      {it.source && (
                        <a href={it.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-foreground">
                          Source <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="card !border-danger/30">
            <h2 className="mb-2 text-sm font-semibold text-danger">Avoid</h2>
            <ul className="space-y-2 text-sm">
              {data.avoid.map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />{t}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Page>
  );
}
