"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink, Lightbulb, Target } from "lucide-react";
import { ErrorState, Page, PageHeader } from "@/components/ui";

type Item = { id: string; name: string; url?: string; site?: string; status: "standard" | "verify" | "old" | "idea"; note: string; source?: string };
type Data = {
  researchedAt: string;
  disclaimer: string;
  strategy: { title: string; points: string[] };
  groups: { title: string; intro: string; items: Item[] }[];
  profiles: { site: string; label: string; fields: { name: string; value: string }[] }[];
  outreach: { id: string; title: string; when: string; subject: string; body: string }[];
  avoid: string[];
};
type Progress = Record<string, "doing" | "done" | "skip">;

const STATUS: Record<Item["status"], { label: string; cls: string }> = {
  standard: { label: "Free, standard", cls: "border-success/30 bg-success/15 text-success" },
  verify: { label: "Lead — verify first", cls: "border-warn/30 bg-warn/15 text-warn" },
  old: { label: "Possibly inactive", cls: "border-danger/30 bg-danger/15 text-danger" },
  idea: { label: "Idea", cls: "border-info/30 bg-info/15 text-info" },
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: the text is still selectable on screen */
        }
      }}
      className="btn-ghost !h-8 !px-3 text-xs"
    >
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied" : label}
    </button>
  );
}

export default function OpportunitiesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const [res, tr] = await Promise.all([fetch("/api/seo/opportunities"), fetch("/api/seo/tracker")]);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      if (tr.ok) setProgress(await tr.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setState(id: string, state: string) {
    setProgress((p) => {
      const n = { ...p };
      if (state === "todo") delete n[id];
      else n[id] = state as Progress[string];
      return n;
    });
    try {
      const res = await fetch("/api/seo/tracker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, state }) });
      if (res.ok) setProgress(await res.json());
    } catch {
      /* keep the optimistic state */
    }
  }

  const all = data?.groups.flatMap((g) => g.items) ?? [];
  const doneCount = all.filter((i) => progress[i.id] === "done").length;

  return (
    <Page>
      <PageHeader
        title="Link opportunities"
        subtitle="Where a real backlink can be earned. DR and UR only grow when other websites link to yours."
        actions={
          data && (
            <div className="text-sm text-muted">
              <span className="font-semibold text-foreground">{doneCount}</span> of {all.length} done
            </div>
          )
        }
      />

      {err && <ErrorState title="Could not load opportunities" detail={err} onRetry={load} />}
      {!data && !err && <div className="skeleton h-72" />}

      {data && (
        <div className="space-y-8">
          <section className="card !border-accent/40">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Target size={16} className="text-accent" /> {data.strategy.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {data.strategy.points.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

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
                {g.items.map((it) => {
                  const st = progress[it.id] ?? "todo";
                  return (
                    <div key={it.id} className={`card ${st === "done" ? "opacity-70" : ""}`}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                          {it.status === "idea" && <Lightbulb size={15} className="shrink-0 text-accent" />}
                          <span className={st === "done" ? "line-through" : ""}>{it.name}</span>
                        </h3>
                        <span className={`badge shrink-0 border ${STATUS[it.status].cls}`}>{STATUS[it.status].label}</span>
                      </div>
                      {it.site && <p className="mb-1 font-[family-name:var(--font-mono)] text-xs text-subtle">{it.site}</p>}
                      <p className="text-sm text-muted">{it.note}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap gap-4">
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
                        <select value={st} onChange={(e) => setState(it.id, e.target.value)} aria-label={`Progress for ${it.name}`} className="input !h-8 !w-auto !px-2 text-xs">
                          <option value="todo">To do</option>
                          <option value="doing">In progress</option>
                          <option value="done">Done</option>
                          <option value="skip">Skipped</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-sm font-semibold">Profile kit</h2>
            <p className="mb-3 text-xs text-muted">Paste the same text everywhere so Google and AI answers see one consistent brand. Edit only facts you can prove.</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.profiles.map((p) => (
                <div key={p.site} className="card space-y-4">
                  <h3 className="text-sm font-semibold">{p.label}</h3>
                  {p.fields.map((f) => (
                    <div key={f.name}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="label">{f.name}</span>
                        <CopyButton text={f.value} />
                      </div>
                      <p className="rounded-lg bg-surface-2 p-3 text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Outreach templates (French)</h2>
            <p className="mb-3 text-xs text-muted">Replace everything in [brackets]. Send them yourself from your own mailbox, one person at a time, and change the wording to fit.</p>
            <div className="grid gap-3 lg:grid-cols-3">
              {data.outreach.map((o) => (
                <div key={o.id} className="card flex flex-col">
                  <h3 className="text-sm font-semibold">{o.title}</h3>
                  <p className="mb-3 mt-1 text-xs text-muted">{o.when}</p>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="label">Subject</span>
                    <CopyButton text={o.subject} />
                  </div>
                  <p className="mb-3 rounded-lg bg-surface-2 p-3 text-sm">{o.subject}</p>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="label">Message</span>
                    <CopyButton text={o.body} />
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-[family-name:var(--font-sans)] text-sm">{o.body}</pre>
                </div>
              ))}
            </div>
          </section>

          <section className="card !border-danger/30">
            <h2 className="mb-2 text-sm font-semibold text-danger">Avoid</h2>
            <ul className="space-y-2 text-sm">
              {data.avoid.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Page>
  );
}
